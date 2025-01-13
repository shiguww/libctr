import { CTRError } from "@libctr/error";
import { CTRMemory } from "@libctr/memory";
import type { CTRMemoryArray } from "@libctr/memory";
import { CTREventEmitter } from "#event-emitter/event-emitter";

import type {
  CTREventEmitterEventMap,
  CTREventEmitterDefaultEventMap
} from "#event-emitter/event-emitter";

abstract class CTRBinarySerializable<
  E extends CTREventEmitterEventMap = CTREventEmitterDefaultEventMap,
  BC = undefined,
  PC = BC,
  BO = null,
  PO = BO
> extends CTREventEmitter<E> {
  public get sizeof(): number {
    return this._sizeof();
  }

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

    if (err instanceof CTRError) {
      return err;
    }

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

    if (err instanceof CTRError) {
      return err;
    }

    return err;
  }

  public build(
    this: CTRBinarySerializable<E, undefined, PC, BO, PO>,
    buffer?: CTRMemory,
    options?: BO
  ): CTRMemory;

  public build(
    buffer: undefined | CTRMemory,
    options: BO | undefined,
    ctx: BC
  ): CTRMemory;

  public build(buffer?: CTRMemory, options?: BO, ctx?: BC): CTRMemory {
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

  public parse(
    this: CTRBinarySerializable<E, BC, undefined, BO, PO>,
    buffer: CTRMemoryArray,
    options?: PO
  ): this;

  public parse(buffer: CTRMemoryArray, options: PO | undefined, ctx: PC): this;

  public parse(_buffer: CTRMemoryArray, options?: PO, ctx?: PC): this {
    const buffer =
      _buffer instanceof CTRMemory ? _buffer : new CTRMemory(_buffer);

    try {
      this._parse(buffer, ctx!, options);
      return this;
    } catch (err) {
      throw this._parseerr(err, buffer, ctx!, options);
    }
  }
}

export { CTRBinarySerializable, CTRBinarySerializable as BinarySerializable };
