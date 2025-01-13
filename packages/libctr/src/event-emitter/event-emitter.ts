import { CTRError } from "@libctr/error";
import { EventEmitter } from "node:events";

interface CTREventEmitterDefaultEventMap {
  error: [CTRError];
}

interface CTREventEmitterEventMap
  extends CTREventEmitterDefaultEventMap,
    Record<string | symbol, any> {}

type CTREventEmitterListenerParameters<
  K extends keyof E,
  E extends CTREventEmitterEventMap
> = E[K];

type CTREventEmitterListener<
  K extends keyof E,
  E extends CTREventEmitterEventMap
> = (
  ...params: CTREventEmitterListenerParameters<K, E>
) => void | Promise<void>;

type CTREventEmitterAnyListener = (...params: any[]) => void | Promise<void>;

class CTREventEmitter<
  E extends CTREventEmitterEventMap = CTREventEmitterDefaultEventMap
> extends EventEmitter<E> {
  public override on<K extends keyof E>(
    event: K,
    fn: CTREventEmitterListener<K, E>
  ): this;

  public override on<K>(event: K, fn: CTREventEmitterAnyListener): this;

  public override on<K>(event: K, fn: CTREventEmitterAnyListener): this {
    // @ts-expect-error
    super.on(event, this._wrap(fn));
    return this;
  }

  public override once<K extends keyof E>(
    event: K,
    fn: CTREventEmitterListener<K, E>
  ): this;

  public override once<K>(event: K, fn: CTREventEmitterAnyListener): this;

  public override once<K>(event: K, fn: CTREventEmitterAnyListener): this {
    // @ts-expect-error
    super.once(event, this._wrap(fn));
    return this;
  }

  private _wrap<P extends any[]>(
    fn: (...params: P) => void | Promise<void>
  ): (...params: P) => Promise<void> {
    return async (...params: P): Promise<void> => {
      try {
        await fn(...params);
      } catch (err) {
        this.emit(
          // @ts-expect-error
          "error",
          err instanceof CTRError
            ? err
            : new CTRError("ctr.unknown", null, undefined, err)
        );
      }
    };
  }
}

export {
  CTREventEmitter,
  CTREventEmitter as Emitter,
  CTREventEmitter as EventEmitter
};

export type {
  CTREventEmitterEventMap,
  CTREventEmitterEventMap as EventEmitterEventMap,
  CTREventEmitterListener,
  CTREventEmitterListener as EventEmitterListener,
  CTREventEmitterAnyListener,
  CTREventEmitterAnyListener as EventEmitterAnyListener,
  CTREventEmitterDefaultEventMap,
  CTREventEmitterDefaultEventMap as EventEmitterDefaultEventMap,
  CTREventEmitterListenerParameters,
  CTREventEmitterListenerParameters as EventEmitterListenerParameters
};
