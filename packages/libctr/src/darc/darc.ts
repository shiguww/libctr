import { CTRMemory } from "@libctr/memory";
import type { CTRVFSNode } from "#vfs/vfs";
import { CTRVersion } from "#version/version";
import { CTRBinarySerializable } from "#utils";
import { CTRMemoryOOBError } from "@libctr/memory";
import type { CTRMemoryEndianness } from "@libctr/memory";
import { CTRVFS, CTRVFSDirectory, CTRVFSFile } from "#vfs/vfs";
import type { CTREventEmitterDefaultEventMap } from "#event-emitter/event-emitter";

import {
  CTRDARCError,
  CTRDARCInvalidStateError,
  CTRDARCUnsupportedVersionError
} from "#darc/darc-error";

interface CTRDARCVFSFileAttributes {
  padding?: number;
}

interface CTRDARCListEntry {
  name: string;
  length: number;
  directory: boolean;
}

interface CTRDARCList extends Array<CTRDARCListEntry> {}
type CTRDARCVFSNode = CTRVFSNode<{}, CTRDARCVFSFileAttributes>;

interface CTRDARCVFS extends CTRVFS<{}, CTRDARCVFSFileAttributes> {}
interface CTRDARCVFSFile extends CTRVFSFile<{}, CTRDARCVFSFileAttributes> {}

interface CTRDARCVFSDirectory
  extends CTRVFSDirectory<{}, CTRDARCVFSFileAttributes> {}

interface CTRDARCNode {
  name: string;
  length: number;
  padding: number;
  nameOffset: number;
  dataOffset: number;
  data: null | Buffer;
  isDirectory: boolean;
}

interface CTRDARCHeader {
  size: number;
  magic: number[];
  fileLength: number;
  tableLength: number;
  tableOffset: number;
  version: CTRVersion;
  dataStartOffset: number;
  endianness: CTRMemoryEndianness;
}

type CTRDARCState = CTRDARCVFS;

class CTRDARC extends CTRBinarySerializable<
  CTRDARCState,
  CTREventEmitterDefaultEventMap &
    Record<`parse.list`, [CTRDARCList]> &
    Record<`${"build" | "parse"}.node`, [CTRDARCNode]> &
    Record<`${"build" | "parse"}.header`, [CTRDARCHeader]>
> {
  private static readonly VERSION_SPECIFIER = "1.0.0.0";

  private static readonly NODE_SIZE = 0xc;
  private static readonly ALIGNMENT = 0x10;
  private static readonly ENCODING = "utf16";
  private static readonly HEADER_SIZE = 0x1c;
  private static readonly MAGIC = [0x64, 0x61, 0x72, 0x63];

  public endianness: CTRMemoryEndianness;
  public readonly version: CTRVersion;
  public readonly root: CTRDARCVFS;

  public constructor() {
    super();

    this.endianness = "LE";
    this.root = new CTRVFS("darc");
    this.version = new CTRVersion(CTRDARC.VERSION_SPECIFIER);
  }

  private get _nodes(): CTRDARCNode[] {
    const root = this._rootnode;
    const nodes = this._flattenNode(new Map(), [root], this.root);
    root.length = nodes.length;
    return nodes;
  }

  private get _rootnode(): CTRDARCNode {
    return {
      name: "\0",
      length: 0,
      data: null,
      padding: 0,
      dataOffset: 0,
      nameOffset: NaN,
      isDirectory: true
    };
  }

  protected override _get(): CTRDARCState {
    return this.root;
  }

  protected override _set(root: CTRDARCState): void {
    this.root.clear();

    for (const node of root.flatten()) {
      this.root.append(node);
    }
  }

  protected override _build(buffer: CTRMemory): void {
    buffer.endianness = this.endianness;

    const nodes = this._nodes;
    const tableOffset = CTRDARC.HEADER_SIZE;

    let nameOffset = 0;
    let tableLength = 0;

    for (const node of nodes) {
      const nameLength = CTRMemory.bytelength(node.name, CTRDARC.ENCODING);
      node.nameOffset = nameOffset;

      nameOffset += nameLength;
      tableLength += CTRDARC.NODE_SIZE + nameLength;
    }

    let dataOffset = CTRMemory.align(
      tableOffset + tableLength,
      CTRDARC.ALIGNMENT
    );

    const dataStartOffset = dataOffset;

    for (const node of nodes) {
      if (node.data !== null) {
        dataOffset = CTRMemory.align(dataOffset, CTRDARC.ALIGNMENT);
        dataOffset += node.padding;
        dataOffset = CTRMemory.align(dataOffset, CTRDARC.ALIGNMENT);

        node.dataOffset = dataOffset;
        dataOffset += node.data.length;
      }
    }

    const header = {
      tableLength,
      dataStartOffset,
      magic: CTRDARC.MAGIC,
      version: this.version,
      fileLength: this.sizeof,
      size: CTRDARC.HEADER_SIZE,
      endianness: this.endianness,
      tableOffset: CTRDARC.HEADER_SIZE
    };

    this._buildHeader(header, buffer);
    this.emit("build.header", header);

    for (const node of nodes) {
      this._buildNode(node, buffer);
    }

    for (const node of nodes) {
      buffer.string(node.name, {
        encoding: CTRDARC.ENCODING,
        terminator: false
      });

      if (node.isDirectory) {
        this.emit("build.node", node);
      }
    }

    this._buildalign(buffer);

    for (const node of nodes) {
      if (!node.isDirectory && node.data !== null) {
        this._buildalign(buffer);
        buffer.pad(0x00, node.padding);
        this._buildalign(buffer);
        buffer.raw(node.data);

        this.emit("build.node", node);
      }
    }
  }

  protected override _parse(buffer: CTRMemory): void {
    const header = this._parseHeader(buffer);
    this.emit("parse.header", header);

    const root = this._parseNode(buffer);
    const count = root.length - 1;

    if (!root.isDirectory) {
      throw new CTRDARCError(CTRDARCError.ERR_ROOT_IS_NOT_A_DIRECTORY, {
        buffer
      });
    }

    const nodes: CTRDARCNode[] = [root];

    for (let i = 0; i < count; i += 1) {
      nodes.push(this._parseNode(buffer));
    }

    const nameOffset = buffer.offset;

    for (const node of nodes) {
      if (buffer.offset !== nameOffset + node.nameOffset) {
        throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
      }

      node.name = buffer.string({
        encoding: CTRDARC.ENCODING,
        terminator: "\0"
      });
    }

    this.emit(
      "parse.list",
      nodes.map((n) => ({
        name: n.name,
        length: n.length,
        directory: n.isDirectory
      }))
    );

    if (buffer.offset !== header.tableOffset + header.tableLength) {
      throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
    }

    this._parsealign(buffer);

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i]!;

      if (node.isDirectory) {
        continue;
      }

      this._parsealign(buffer);

      while (buffer.offset !== node.dataOffset) {
        if (buffer.u8() !== 0x00) {
          throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
        }

        node.padding += 1;
      }

      if (i === 0 && buffer.offset !== header.dataStartOffset) {
        throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
      }

      node.data = buffer.raw({ count: node.length }).steal();
      this.emit("parse.node", node);
    }

    // discard root node
    nodes.shift();

    const first = nodes[0];
    const node = this._processNode(nodes, first!, buffer);

    if (node instanceof CTRVFSFile) {
      this.root.name = "";
      this.root.append(node);
    } else {
      this.root.name = node.name;
      this.root.nodes.push(...node.nodes);
    }
  }

  protected override _sizeof(): number {
    const nodes = this._nodes;
    let length = CTRDARC.HEADER_SIZE;

    for (const node of nodes) {
      length += CTRDARC.NODE_SIZE;
      length += CTRMemory.bytelength(node.name, CTRDARC.ENCODING);
    }

    for (const node of nodes) {
      if (node.data !== null) {
        length = CTRMemory.align(length, CTRDARC.ALIGNMENT);
        length += node.padding;
        length = CTRMemory.align(length, CTRDARC.ALIGNMENT);
        length += node.data.length;
      }
    }

    return length;
  }

  protected override _builderr(err: unknown, buffer: CTRMemory): CTRDARCError {
    return new CTRDARCError(
      CTRDARCError.ERR_UNKNOWN,
      { buffer },
      undefined,
      err
    );
  }

  protected override _parseerr(err: unknown, buffer: CTRMemory): CTRDARCError {
    if (err instanceof CTRDARCError) {
      return err;
    }

    if (err instanceof CTRMemoryOOBError) {
      return new CTRDARCError(
        CTRDARCError.ERR_UNEXPECTED_END_OF_FILE,
        { buffer },
        undefined,
        err
      );
    }

    return new CTRDARCError(
      CTRDARCError.ERR_UNKNOWN,
      { buffer },
      undefined,
      err
    );
  }

  protected override _validate(state: unknown): CTRDARCVFS {
    if (state instanceof CTRVFS) {
      for (const node of state.flatten()) {
        if (node.attributes === null) {
          continue;
        }

        if (
          typeof node.attributes !== "object" ||
          typeof node.attributes.padding !== "number"
        ) {
          throw new CTRDARCInvalidStateError({ state });
        }
      }
    }

    throw new CTRDARCInvalidStateError({ state });
  }

  private _buildNode(node: CTRDARCNode, buffer: CTRMemory): void {
    buffer.u24(node.nameOffset);
    buffer.u8(Number(node.isDirectory));
    buffer.u32(node.dataOffset);
    buffer.u32(node.length);
  }

  private _parseNode(buffer: CTRMemory): CTRDARCNode {
    const nameOffset = buffer.u24();
    const isDirectory = Boolean(buffer.u8());
    const dataOffset = buffer.u32();
    const length = buffer.u32();

    return {
      length,
      name: "",
      dataOffset,
      nameOffset,
      padding: 0,
      isDirectory,
      data: Buffer.alloc(0)
    };
  }

  private _buildalign(buffer: CTRMemory): void {
    buffer.pad(
      0,
      CTRMemory.align(buffer.offset, CTRDARC.ALIGNMENT) - buffer.offset
    );
  }

  private _parsealign(buffer: CTRMemory): void {
    while (
      buffer.offset !== CTRMemory.align(buffer.offset, CTRDARC.ALIGNMENT)
    ) {
      if (buffer.u8() !== 0x00) {
        throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
      }
    }
  }

  private _buildHeader(header: CTRDARCHeader, buffer: CTRMemory): void {
    buffer.raw(header.magic);
    buffer.bom("u16", header.endianness);
    buffer.u16(header.size);
    header.version.build(buffer);
    buffer.u32(header.fileLength);
    buffer.u32(header.tableOffset);
    buffer.u32(header.tableLength);
    buffer.u32(header.dataStartOffset);
  }

  private _flattenNode(
    map: Map<CTRDARCNode, Buffer>,
    nodes: CTRDARCNode[],
    node: CTRDARCVFSNode
  ): CTRDARCNode[] {
    if (node.isFile()) {
      const _node = {
        nameOffset: NaN,
        dataOffset: NaN,
        isDirectory: false,
        name: node.name + "\0",
        data: node.data.steal(),
        length: node.data.length,
        padding:
          node.attributes?.padding !== undefined ? node.attributes.padding : 16
      };

      return [_node];
    }

    nodes.push({
      data: null,
      padding: 0,
      dataOffset: 0,
      nameOffset: NaN,
      isDirectory: true,
      length: nodes.length + node.nodes.length + 1,
      name: (node !== this.root ? node.name : ".") + "\0"
    });

    for (const child of node.nodes) {
      nodes.push(...this._flattenNode(map, nodes, child));
    }

    return nodes;
  }

  private _parseHeader(buffer: CTRMemory): CTRDARCHeader {
    const magic = buffer.raw({ count: CTRDARC.MAGIC.length });

    if (!magic.equals(CTRDARC.MAGIC)) {
      throw new CTRDARCError(CTRDARCError.ERR_NOT_A_DARC_FILE, { buffer });
    }

    const endianness = buffer.bom("u16");
    buffer.endianness = endianness;

    const size = buffer.u16();
    const version = new CTRVersion(buffer);
    const fileLength = buffer.u32();
    const tableOffset = buffer.u32();
    const tableLength = buffer.u32();
    const dataStartOffset = buffer.u32();

    if (!version.is(CTRDARC.VERSION_SPECIFIER)) {
      throw new CTRDARCUnsupportedVersionError({ buffer, version });
    }

    if (size !== CTRDARC.HEADER_SIZE || fileLength !== buffer.length) {
      throw new CTRDARCError(CTRDARCError.ERR_INVALID_HEADER, { buffer });
    }

    if (tableOffset !== CTRDARC.HEADER_SIZE) {
      throw new CTRDARCError(CTRDARCError.ERR_MALFORMED_FILE, { buffer });
    }

    this.version.set(version.toString());
    this.endianness = endianness;

    return {
      size,
      version,
      endianness,
      fileLength,
      tableOffset,
      tableLength,
      dataStartOffset,
      magic: magic.array
    };
  }

  private _processNode(
    nodes: CTRDARCNode[],
    node: CTRDARCNode,
    buffer: CTRMemory
  ): CTRVFSNode<{}, CTRDARCVFSFileAttributes> {
    nodes.shift();

    if (!node.isDirectory) {
      return new CTRVFSFile(node.name, node.data || Buffer.alloc(0), {
        padding: node.padding
      });
    }

    node.length -= 1;

    const directory = new CTRVFSDirectory<{}, CTRDARCVFSFileAttributes>(
      node.name
    );

    for (let i = 0; i < node.length; i += 1) {
      const node = nodes[0];

      if (node === undefined) {
        break;
      }

      directory.append(this._processNode(nodes, node, buffer));
    }

    return directory;
  }
}

export { CTRDARC, CTRDARC as DARC };

export type {
  CTRDARCVFS,
  CTRDARCVFS as DARCVFS,
  CTRDARCList,
  CTRDARCList as DARCList,
  CTRDARCNode,
  CTRDARCNode as DARCNode,
  CTRDARCHeader,
  CTRDARCHeader as DARCHeader,
  CTRDARCVFSFile,
  CTRDARCVFSFile as DARCVFSFile,
  CTRDARCVFSNode,
  CTRDARCVFSNode as DARVFSNode,
  CTRDARCListEntry,
  CTRDARCListEntry as DARCListEntry,
  CTRDARCVFSDirectory,
  CTRDARCVFSDirectory as DARVFSDirectory,
  CTRDARCVFSFileAttributes,
  CTRDARCVFSFileAttributes as DARCVFSFileAttributes
};
