import { CTRError } from "@libctr/error";
import { CTRMemory } from "@libctr/memory";
import type { CTRMemoryArray } from "@libctr/memory";
import { CTREventEmitter } from "#event-emitter/event-emitter";

import type {
  CTREventEmitterEventMap,
  CTREventEmitterDefaultEventMap
} from "#event-emitter/event-emitter";

abstract class CTRBinarySerializable<
  S = null,
  E extends CTREventEmitterEventMap = CTREventEmitterDefaultEventMap,
  BC = undefined,
  PC = BC,
  BO = null,
  PO = BO
> extends CTREventEmitter<E> {
  public get sizeof(): number {
    return this._sizeof();
  }

  public get(): S {
    return this._validate(this._get());
  }

  public set(state: S): this {
    this._set(this._validate(state));
    return this;
  }

  protected abstract _get(): S;
  protected abstract _set(state: S): void;
  protected abstract _validate(state: unknown): S;
  protected abstract _build(buffer: CTRMemory, ctx: BC, options?: BO): void;
  protected abstract _parse(buffer: CTRMemory, ctx: PC, options?: PO): void;

  protected _sizeof(): number {
    throw new CTRError("ctr.not_implemented", null);
  }

  protected _builderr(
    err: unknown,
    buffer: CTRMemory,
    ctx: BC,
    options?: BO
  ): unknown {
    ctx;
    buffer;
    options;

    return err;
  }

  protected _parseerr(
    err: unknown,
    buffer: CTRMemory,
    ctx: PC,
    options?: PO
  ): unknown {
    ctx;
    buffer;
    options;

    return err;
  }

  public build(buffer?: CTRMemory, ctx?: BC, options?: BO): CTRMemory {
    if (buffer === undefined) {
      buffer = new CTRMemory();
    }

    try {
      this._build(buffer, ctx!, options);
      return buffer;
    } catch (err) {
      throw this._builderr(err, buffer, ctx!, options);
    }
  }

  public parse(buffer: CTRMemoryArray, ctx?: PC, options?: PO): this {
    buffer = buffer instanceof CTRMemory ? buffer : new CTRMemory(buffer);

    try {
      this._parse(buffer, ctx!, options);
      return this;
    } catch (err) {
      throw this._parseerr(err, buffer, ctx!, options);
    }
  }
}

export { CTRBinarySerializable, CTRBinarySerializable as BinarySerializable };
