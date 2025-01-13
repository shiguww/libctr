type CTRErrorCode = "ctr.unknown" | "ctr.not_implemented" | (string & {});

class CTRError<
  C extends CTRErrorCode = CTRErrorCode,
  M = unknown
> extends Error {
  public readonly code: C;
  public readonly cause: unknown;
  public readonly metadata: Readonly<M>;

  public constructor(code: C, metadata: M, message?: string, cause?: unknown) {
    super(
      message !== undefined
        ? message
        : cause instanceof Error
          ? cause.message
          : code
    );

    this.code = code;
    this.cause = cause;
    this.metadata = metadata;
  }
}

export { CTRError, CTRError as Error };
export type { CTRErrorCode, CTRErrorCode as ErrorCode };
