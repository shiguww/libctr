import fs from "node:fs/promises";
import { CTRMemory } from "@libctr/memory";
import type { CTRMemoryArray } from "@libctr/memory";
import {
  CTRVFSAlreadyExistsError,
  CTRVFSMissingFileError
} from "#vfs/vfs-error";
import type { Mode, MakeDirectoryOptions } from "node:fs";
import { CTREventEmitter } from "#event-emitter/event-emitter";
import { join, dirname, extname, resolve, basename } from "node:path";
import type { CTREventEmitterDefaultEventMap } from "#event-emitter/event-emitter";

type CTRVFSNodeKind = "file" | "directory";

abstract class BaseCTRVFSNode<D extends object, F extends object> {
  public name: string;
  private _protocol: null | string;
  protected _parent: null | CTRVFSDirectory<D, F>;

  protected constructor(name: string, parent: null | CTRVFSDirectory<D, F>) {
    this.name = name;
    this._protocol = null;
    this._parent = parent;

    const match = /(.+):\/\//.exec(name);
    const protocol = match?.[1];

    if (match !== null && protocol !== undefined) {
      this._protocol = protocol;
      this.name = this.name.replace(match[0], "");
    }
  }

  public abstract get length(): number;
  public abstract get files(): CTRVFSFile<D, F>[];

  public get url(): string {
    return this.protocol !== null
      ? `${this.protocol}://${this.path}`
      : this.path;
  }

  public get path(): string {
    return this.segments.join("/");
  }

  public get kind(): this extends CTRVFSFile<D, F> ? "file" : "directory" {
    return <this extends CTRVFSFile<D, F> ? "file" : "directory">(
      (this.isFile() ? "file" : "directory")
    );
  }

  public get parent(): null | CTRVFSDirectory<D, F> {
    return this._parent;
  }

  public get dirname(): string {
    return dirname(this.path);
  }

  public get segments(): string[] {
    return this.parent === null
      ? [this.name]
      : [...this.parent.segments, this.name];
  }

  public get extname(): string {
    return extname(this.path);
  }

  public get relpath(): string {
    return this.path.replace(/^\//, "");
  }

  public get basename(): string {
    return basename(this.path);
  }

  public get protocol(): null | string {
    return this._protocol !== null
      ? this._protocol
      : this.parent?.protocol || null;
  }

  public set protocol(protocol: null | string | undefined) {
    this._protocol = protocol || null;
  }

  public get stemname(): string {
    const extname = this.extname;
    const basename = this.basename;

    if (extname.length !== 0 && basename.endsWith(extname)) {
      return basename.slice(0, -extname.length);
    }

    return extname.length !== 0 ? basename.slice(0, -extname.length) : basename;
  }

  public abstract clone(): CTRVFSNode<D, F>;
  public abstract flatten(): CTRVFSNode<D, F>[];

  public is<D0 extends object, F0 extends object>(
    this: CTRVFSNode<D, F>,
    other: CTRVFSNode<D0, F0>,
    strict?: boolean
  ): this is CTRVFSNode<D0, F0> {
    if (this.name !== other.name) {
      return false;
    }

    if (this.length !== other.length) {
      return false;
    }

    if (
      strict &&
      ((this.parent === null && other.parent !== null) ||
        (this.parent !== null && other.parent === null) ||
        (this.parent !== null &&
          other.parent !== null &&
          !this.parent.is(other.parent)))
    ) {
      return false;
    }

    if (this.isFile() && other.isFile()) {
      return this.data.equals(other.data);
    }

    if (this.isDirectory() && other.isDirectory()) {
      return this.nodes.every((n0, i) => {
        const n1 = other.nodes[i]!;
        return n0.is(n1);
      });
    }

    return false;
  }

  public tree(indent?: string | number): string {
    const space = typeof indent === "string" ? indent : " ".repeat(indent || 0);

    if (this.isFile()) {
      return `${space}- ${this.name} (${this.length} bytes)`;
    }

    if (this.isDirectory()) {
      const doublespace = indent === undefined ? 2 : space.repeat(2);
      let string = `${space}> ${this.name || `${this.isRoot() ? "(root)" : "(unnamed)"}`} (${this.length} items)`;

      for (const node of this.nodes) {
        string += `\n${node.tree(doublespace)}`;
      }

      return string;
    }

    return `${space}${this.name}`;
  }

  public isFile(): this is CTRVFSFile<D, F> {
    return this instanceof CTRVFSFile;
  }

  public isRoot(): this is CTRVFS<D, F> {
    return this instanceof CTRVFS && this.parent === null;
  }

  public isDirectory(): this is CTRVFSDirectory<D, F> {
    return this instanceof CTRVFSDirectory;
  }
}

class CTRVFSFile<
  D extends object = {},
  F extends object = {}
> extends BaseCTRVFSNode<D, F> {
  private _data: CTRMemory;
  public readonly attributes: F | null;

  public constructor(
    name: string,
    data?: CTRMemoryArray,
    attributes?: F | null
  ) {
    super(name, null);

    this._data = data instanceof CTRMemory ? data : new CTRMemory(data);
    this.attributes = attributes || null;
  }

  public get data(): CTRMemory {
    return this._data;
  }

  public set data(data: CTRMemoryArray) {
    this._data = data instanceof CTRMemory ? data : new CTRMemory(data);
  }

  public override get files(): CTRVFSFile<D, F>[] {
    return [this];
  }

  public override get length(): number {
    return this._data.length;
  }

  public override clone(): CTRVFSFile<D, F> {
    const clone = new CTRVFSFile<D, F>(
      this.name,
      this._data,
      Object.assign({}, this.attributes)
    );

    clone._parent = this.parent;
    return clone;
  }

  public override flatten(): CTRVFSNode<D, F>[] {
    return [this];
  }
}

type CTRVFSDirectoryAppendMode =
  | "fail"
  | "skip"
  | "force"
  | "merge"
  | "replace";

type CTRVFSDirectoryMergeMode = Exclude<CTRVFSDirectoryAppendMode, "merge">;

interface CTRVFSDirectoryAppendOptions {
  clone?: boolean;
  mode?: CTRVFSDirectoryAppendMode;
  merge?: true | CTRVFSDirectoryMergeMode;
}

interface CTRVFSDirectoryListenerNode<D extends object, F extends object> {
  path: string;
  node: CTRVFSNode<D, F>;
}

class CTRVFSDirectoryListener<
  D extends object = {},
  F extends object = {}
> extends CTREventEmitter<
  CTREventEmitterDefaultEventMap &
    Record<
      `${"read" | "write"}.node.${"end" | "start"}`,
      [CTRVFSDirectoryListenerNode<D, F>]
    >
> {}

class CTRVFSDirectory<
  D extends object = {},
  F extends object = {}
> extends BaseCTRVFSNode<D, F> {
  public static async fromDirectory<
    D extends object = {},
    F extends object = {}
  >(
    directory: string,
    protocol?: null | string,
    attributes?: D | null,
    listener?: CTRVFSDirectoryListener
  ): Promise<CTRVFSDirectory<D, F>> {
    const path = resolve(directory);

    const node = new CTRVFSDirectory<D, F>(
      protocol !== undefined
        ? `${protocol}://${basename(directory)}`
        : basename(directory),
      [],
      attributes
    );

    listener?.emit("read.node.start", {
      node,
      path
    });

    const dirents = await fs.readdir(path, {
      withFileTypes: true
    });

    for (const dirent of dirents) {
      if (dirent.isFile()) {
        await CTRVFSDirectory._fromFile(
          node,
          dirent.name,
          resolve(path, dirent.name),
          null,
          listener
        );
      } else if (dirent.isDirectory()) {
        await CTRVFSDirectory._fromDirectory(
          node,
          dirent.name,
          resolve(path, dirent.name),
          null,
          listener
        );
      }
    }

    listener?.emit("read.node.end", {
      node,
      path
    });

    return node;
  }

  private static async _fromFile<D extends object = {}, F extends object = {}>(
    directory: CTRVFSDirectory<D, F>,
    name: string,
    path: string,
    attributes: F | null,
    listener: undefined | CTRVFSDirectoryListener
  ): Promise<CTRVFSFile<D, F>> {
    const node = new CTRVFSFile<D, F>(name, undefined, attributes);
    directory.append(node);

    listener?.emit("read.node.start", { node, path });
    node.data = await fs.readFile(path);
    listener?.emit("read.node.end", { node, path });

    return node;
  }

  private static async _fromDirectory<
    D extends object = {},
    F extends object = {}
  >(
    directory: CTRVFSDirectory<D, F>,
    name: string,
    path: string,
    attributes: D | null,
    listener: undefined | CTRVFSDirectoryListener
  ): Promise<CTRVFSDirectory<D, F>> {
    const node = new CTRVFSDirectory<D, F>(name, [], attributes);
    directory.append(node);

    listener?.emit("read.node.start", { node, path });

    const dirents = await fs.readdir(path, {
      withFileTypes: true
    });

    for (const dirent of dirents) {
      if (dirent.isFile()) {
        await CTRVFSDirectory._fromFile(
          node,
          dirent.name,
          resolve(path, dirent.name),
          null,
          listener
        );
      } else if (dirent.isDirectory()) {
        await CTRVFSDirectory._fromDirectory(
          node,
          dirent.name,
          resolve(path, dirent.name),
          null,
          listener
        );
      }
    }

    listener?.emit("read.node.end", { node, path });
    return node;
  }

  protected _attributes: D | null;
  protected _nodes: CTRVFSNode<D, F>[];

  public constructor(
    name: string,
    nodes?: CTRVFSNode<D, F>[],
    attributes?: D | null
  ) {
    super(name, null);

    this._nodes = [];
    this._attributes = attributes || null;

    if (nodes !== undefined) {
      this.append(nodes);
    }
  }

  public override get files(): CTRVFSFile<D, F>[] {
    return this._nodes.map((n) => n.files).flat();
  }

  public get nodes(): CTRVFSNode<D, F>[] {
    return this._nodes;
  }

  public override get length(): number {
    return this._nodes.length;
  }

  public get attributes(): D | null {
    return this._attributes;
  }

  public set attributes(attributes: D | null) {
    this._attributes = attributes;
  }

  public readonly push = this.append.bind(this);
  public readonly dir = this.directory.bind(this);

  public file(
    name: string,
    data?: CTRMemoryArray,
    attributes?: F | null,
    options?: Omit<CTRVFSDirectoryAppendOptions, "clone">
  ): CTRVFSFile<D, F> {
    return <CTRVFSFile<D, F>>(
      this._append(new CTRVFSFile(name, data, attributes), options)
    );
  }

  public find<T extends CTRVFSNode<D, F>>(
    predicate: (
      value: CTRVFSNode<D, F>,
      index: number,
      obj: CTRVFSNode<D, F>[]
    ) => value is T
  ): undefined | T;

  public find(
    predicate: (
      value: CTRVFSNode<D, F>,
      index: number,
      obj: CTRVFSNode<D, F>[]
    ) => boolean
  ): undefined | CTRVFSNode<D, F>;

  public find(
    predicate: (
      value: CTRVFSNode<D, F>,
      index: number,
      obj: CTRVFSNode<D, F>[]
    ) => boolean
  ): undefined | CTRVFSNode<D, F> {
    return this._nodes[this.findIndex(predicate)];
  }

  public read(path: string | string[], required: true): CTRMemory;
  public read(path: string | string[], required?: boolean): null | CTRMemory;

  public read(path: string | string[], required?: boolean): null | CTRMemory {
    const node = this.search(path);

    if (node === null || node.isDirectory()) {
      if (required) {
        path = Array.isArray(path) ? path.join("/") : path;
        throw new CTRVFSMissingFileError(path, this);
      }

      return null;
    }

    return node.data;
  }

  public clear(): this {
    this.nodes.forEach(
      (node) => ((<CTRVFSDirectory<D, F>>node)._parent = null)
    );

    this.nodes.length = 0;
    return this;
  }

  public override clone(): CTRVFSDirectory<D, F> {
    const clone = new CTRVFSDirectory<D, F>(
      this.name,
      this._nodes.map((n) => n.clone()),
      Object.assign({}, this.attributes)
    );

    clone._parent = this.parent;
    return clone;
  }

  public append(
    nodes: CTRVFSNode<D, F> | CTRVFSNode<D, F>[],
    options?: CTRVFSDirectoryAppendOptions
  ): this {
    nodes = Array.isArray(nodes) ? nodes : [nodes];

    for (const node of nodes) {
      this._append(options?.clone ? node.clone() : node, options);
    }

    return this;
  }

  public exists(nameOrNode: string | CTRVFSNode<D, F>): boolean {
    return this.indexOf(nameOrNode) !== -1;
  }

  public remove(...namesOrNodes: (string | CTRVFSNode<D, F>)[]): this {
    namesOrNodes.forEach((nameOrNode) => {
      const index = this.indexOf(nameOrNode);
      const node = this._nodes[index];

      if (node !== undefined) {
        (<CTRVFSDirectory<D, F>>node)._parent = null;
        this._nodes.splice(index, 1);
      }
    });

    return this;
  }

  public search(path: string | string[]): null | CTRVFSNode<D, F> {
    const segments = typeof path === "string" ? path.split("/") : path;
    const name = segments[0];

    if (name === undefined) {
      return null;
    }

    for (const node of this._nodes) {
      if (node.name === name) {
        if (segments.length === 1) {
          return node;
        }

        if (node.isFile()) {
          return null;
        }

        return node.search(segments.slice(1));
      }
    }

    return null;
  }

  public override flatten(): CTRVFSNode<D, F>[] {
    return [this, ...this._nodes.map((n) => n.flatten()).flat()];
  }

  public indexOf(nameOrNode: string | CTRVFSNode<D, F>): number {
    const name = typeof nameOrNode === "string" ? nameOrNode : nameOrNode.name;
    return this.findIndex((n) => n.name === name);
  }

  public resolve(...paths: (string | CTRVFSNode<any, any>)[]): string {
    return join(
      this.path,
      ...paths.map((p) => (typeof p === "string" ? p : p.path))
    );
  }

  public directory(
    name: string,
    nodes?: CTRVFSNode<D, F>[],
    attributes?: D | null,
    options?: Omit<CTRVFSDirectoryAppendOptions, "clone">
  ): CTRVFSDirectory<D, F> {
    return <CTRVFSDirectory<D, F>>(
      this._append(new CTRVFSDirectory(name, nodes, attributes), options)
    );
  }

  public findIndex(
    predicate: (
      value: CTRVFSNode<D, F>,
      index: number,
      obj: CTRVFSNode<D, F>[]
    ) => boolean
  ): number {
    return this._nodes.findIndex(predicate);
  }

  public async toDirectory(
    destination: string,
    options?: null | Mode | MakeDirectoryOptions,
    listener?: CTRVFSDirectoryListener<D, F>
  ): Promise<void> {
    const dirpath = resolve(destination);

    listener?.emit("write.node.start", {
      node: this,
      path: dirpath
    });

    await fs.mkdir(dirpath, options);

    listener?.emit("write.node.end", {
      node: this,
      path: dirpath
    });

    const mode =
      options !== null && typeof options === "object"
        ? options.mode
        : options || undefined;

    for (const node of this.nodes) {
      const path = resolve(dirpath, node.name);

      if (node.isFile()) {
        listener?.emit("write.node.start", {
          node,
          path
        });

        await fs.writeFile(path, node.data.buffer, { mode });

        listener?.emit("write.node.end", {
          node,
          path
        });
      }

      if (node.isDirectory()) {
        await node.toDirectory(path, options);
      }
    }
  }

  private _append(
    node: CTRVFSNode<D, F>,
    options: undefined | Omit<CTRVFSDirectoryAppendOptions, "clone">
  ): CTRVFSNode<D, F> {
    let index: number | undefined;
    const mode = options?.mode || (options?.merge ? "merge" : "fail");

    if (mode === "fail" && this.exists(node)) {
      throw new CTRVFSAlreadyExistsError(node, this);
    }

    if (mode === "skip") {
      index = this.indexOf(node.name);
      const existing = this._nodes[index];

      if (existing !== undefined) {
        return existing;
      }
    }

    if (mode === "force") {
      return this._force(node);
    }

    if (mode === "merge") {
      return this._merge(node, options);
    }

    return this._replace(node, index);
  }

  private _force(node: CTRVFSNode<D, F>): CTRVFSNode<D, F> {
    (<CTRVFSDirectory<D, F>>node)._parent = this;
    this._nodes.push(node);
    return node;
  }

  private _merge(
    node: CTRVFSNode<D, F>,
    options: undefined | CTRVFSDirectoryAppendOptions
  ): CTRVFSNode<D, F> {
    const index = this.indexOf(node);
    const existing = this._nodes[index];
    const merge = options?.merge || "fail";

    (<CTRVFSDirectory<D, F>>node)._parent = this;

    if (existing === undefined) {
      this._nodes.push(node);
      return node;
    }

    if (node.isDirectory() && existing.isDirectory()) {
      const merged = new CTRVFSDirectory<D, F>(node.name, [], <D>{
        ...existing._attributes,
        ...node._attributes
      });

      merged._parent = this;

      for (const child of existing._nodes) {
        merged.append(child, options);
      }

      for (const child of node._nodes) {
        merged.append(child, options);
      }

      node._nodes = merged._nodes;
      node._attributes = merged._attributes;

      existing._nodes = merged._nodes;
      existing._attributes = merged._attributes;

      this._nodes.splice(index, 1, merged);
      return merged;
    }

    if (merge === "fail") {
      throw new CTRVFSAlreadyExistsError(node, this);
    }

    if (merge === "skip") {
      return existing;
    }

    if (merge === "force") {
      this._nodes.push(node);
      return node;
    }

    (<CTRVFSDirectory<D, F>>existing)._parent = null;
    this._nodes.splice(index, 1, node);

    return node;
  }

  private _replace(
    node: CTRVFSNode<D, F>,
    index: number | undefined
  ): CTRVFSNode<D, F> {
    if (index === undefined) {
      index = this.indexOf(node);
    }

    const existing = this._nodes[index];
    (<CTRVFSDirectory<D, F>>node)._parent = this;

    if (existing === undefined) {
      this._nodes.push(node);
      return node;
    }

    (<CTRVFSDirectory<D, F>>existing)._parent = null;
    this._nodes.splice(index, 1, node);

    return node;
  }
}

class CTRVFS<
  D extends object = {},
  F extends object = {}
> extends CTRVFSDirectory<D, F> {
  public static async fromDirectory<
    D extends object = {},
    F extends object = {}
  >(
    directory: string,
    protocol?: null | string,
    attributes?: D | null | undefined,
    listener?: CTRVFSDirectoryListener
  ): Promise<CTRVFS<D, F>> {
    const _directory = await CTRVFSDirectory.fromDirectory<D, F>(
      directory,
      protocol,
      attributes,
      listener
    );

    return new CTRVFS<D, F>(protocol, _directory.nodes, _directory.attributes);
  }

  public constructor(
    protocol?: null | string,
    nodes?: CTRVFSNode<D, F>[],
    attributes?: D | null
  ) {
    super(
      typeof protocol === "string" ? `${protocol}:///` : "/",
      nodes,
      attributes
    );

    this._parent = null;
  }

  public override get parent(): null {
    return null;
  }
}

type CTRVFSNode<D extends object = object, F extends object = object> =
  | CTRVFSFile<D, F>
  | CTRVFSDirectory<D, F>;

export {
  CTRVFS,
  CTRVFS as VFS,
  CTRVFSFile,
  CTRVFSFile as VFSFile,
  CTRVFSDirectory,
  CTRVFSDirectory as VFSDirectory,
  CTRVFSDirectoryListener,
  CTRVFSDirectoryListener as VFSDirectoryListener
};

export type {
  CTRVFSNode,
  CTRVFSNode as VFSNode,
  CTRVFSNodeKind,
  CTRVFSNodeKind as VFSNodeKind,
  CTRVFSDirectoryMergeMode,
  CTRVFSDirectoryMergeMode as VFSDirectoryMergeMode,
  CTRVFSDirectoryAppendMode,
  CTRVFSDirectoryAppendMode as VFSDirectoryAppendMode,
  CTRVFSDirectoryAppendOptions,
  CTRVFSDirectoryAppendOptions as VFSDirectoryAppendOptions
};
