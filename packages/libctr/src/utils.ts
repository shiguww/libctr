import { CTRError } from "@libctr/error";
import { CTRMemory } from "@libctr/memory";
import type { CTRMemoryArray } from "@libctr/memory";
import { CTREventEmitter } from "#event-emitter/event-emitter";

import type {
  CTREventEmitterEventMap,
  CTREventEmitterDefaultEventMap
} from "#event-emitter/event-emitter";

abstract class CTRBinarySerializable<
  S = never,
  E extends CTREventEmitterEventMap = CTREventEmitterDefaultEventMap,
  BC = undefined,
  PC = BC,
  BE extends Error = CTRError,
  PE extends Error = CTRError,
  SE extends Error = CTRError,
  BO = null,
  PO = BO
> extends CTREventEmitter<E> {
  private _offset: null | number = null;

  public get offset(): null | number {
    return this._offset;
  }

  public get sizeof(): number {
    return this._sizeof();
  }

  protected abstract _build(buffer: CTRMemory, ctx: BC, options?: BO): void;
  protected abstract _parse(buffer: CTRMemory, ctx: PC, options?: PO): void;

  protected _get(): S {
    throw new CTRError("ctr.err_not_implemented");
  }

  protected _set(_state: S): void {
    throw new CTRError("ctr.err_not_implemented");
  }

  protected _sizeof(): number {
    throw new CTRError("ctr.err_not_implemented");
  }

  protected _validate(_state: unknown): null | SE {
    return <any>new CTRError("ctr.err_not_implemented");
  }

  protected _builderr(
    err: unknown,
    _buffer: CTRMemory,
    _ctx: BC,
    _options?: BO
  ): BE {
    return <any>(
      (err instanceof CTRError
        ? err
        : new CTRError("ctr.err_unknown", undefined, err))
    );
  }

  protected _parseerr(
    err: unknown,
    _buffer: CTRMemory,
    _ctx: PC,
    _options?: PO
  ): PE {
    return <any>(
      (err instanceof CTRError
        ? err
        : new CTRError("ctr.err_unknown", undefined, err))
    );
  }

  public get(): S {
    const state = this._get();
    const err = this.validate(state);

    if (err !== null) {
      throw err;
    }

    return state;
  }

  public set(state: S): this {
    this.validate(state);
    this._set(state);

    return this;
  }

  public build(buffer?: CTRMemory, ctx?: BC, options?: BO): CTRMemory {
    const result = this.safebuild(buffer, ctx, options);

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  public parse(buffer: CTRMemoryArray, ctx?: PC, options?: PO): this {
    const result = this.safeparse(buffer, ctx, options);

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  public validate(state: unknown): asserts state is S {
    const err = this._validate(state);

    if (err instanceof Error) {
      throw err;
    }
  }

  public safebuild(buffer?: CTRMemory, ctx?: BC, options?: BO): BE | CTRMemory {
    if (buffer === undefined) {
      buffer = new CTRMemory();
    }

    try {
      this._offset = buffer.offset;
      this._build(buffer, ctx!, options);

      return buffer;
    } catch (err) {
      return this._builderr(err, buffer, ctx!, options);
    }
  }

  public safeparse(buffer: CTRMemoryArray, ctx?: PC, options?: PO): PE | this {
    buffer = buffer instanceof CTRMemory ? buffer : new CTRMemory(buffer);

    try {
      this._offset = buffer.offset;
      this._parse(buffer, ctx!, options);

      return this;
    } catch (err) {
      return this._parseerr(err, buffer, ctx!, options);
    }
  }

  public safevalidate(state: unknown): SE | null {
    return this._validate(state);
  }
}

export { CTRBinarySerializable, CTRBinarySerializable as BinarySerializable };
