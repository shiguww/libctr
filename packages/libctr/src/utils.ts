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

  public get(): S {
    const state = this._get();
    const err = this.validate(state);

    if (err !== null) {
      throw err;
    }

    return state;
  }

  public set(state: S): this {
    const err = this._validate(state);

    if (err !== null) {
      throw err;
    }

    this._set(state);
    return this;
  }

  public validate<T>(state: T): null | Error {
    return this._validate(state);
  }

  protected abstract _build(buffer: CTRMemory, ctx: BC, options?: BO): void;
  protected abstract _parse(buffer: CTRMemory, ctx: PC, options?: PO): void;

  protected _get(): S {
    throw new CTRError("ctr.not_implemented", null);
  }

  protected _set(state: S): void {
    throw new CTRError("ctr.not_implemented", { state });
  }

  protected _sizeof(): number {
    throw new CTRError("ctr.not_implemented", null);
  }

  protected _builderr(
    err: unknown,
    buffer: CTRMemory,
    ctx: BC,
    options?: BO
  ): Error {
    if (err instanceof Error) {
      return err;
    }

    return new CTRError("ctr.unknown", { ctx, buffer, options });
  }

  protected _parseerr(
    err: unknown,
    buffer: CTRMemory,
    ctx: PC,
    options?: PO
  ): Error {
    if (err instanceof Error) {
      return err;
    }

    return new CTRError("ctr.unknown", { ctx, buffer, options });
  }

  protected _validate<T>(state: T): null | Error {
    return new CTRError("ctr.not_implemented", { state });
  }

  public build(buffer?: CTRMemory, ctx?: BC, options?: BO): CTRMemory {
    if (buffer === undefined) {
      buffer = new CTRMemory();
    }

    try {
      this._offset = buffer.offset;
      this._build(buffer, ctx!, options);

      return buffer;
    } catch (err) {
      throw this._builderr(err, buffer, ctx!, options);
    }
  }

  public parse(buffer: CTRMemoryArray, ctx?: PC, options?: PO): this {
    buffer = buffer instanceof CTRMemory ? buffer : new CTRMemory(buffer);

    try {
      this._offset = buffer.offset;
      this._parse(buffer, ctx!, options);

      return this;
    } catch (err) {
      throw this._parseerr(err, buffer, ctx!, options);
    }
  }
}

export { CTRBinarySerializable, CTRBinarySerializable as BinarySerializable };
