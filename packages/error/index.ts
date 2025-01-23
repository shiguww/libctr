class CTRError extends Error {
  public readonly cause: unknown;
  public readonly code: null | string;

  public constructor(code: null | string, message?: string, cause?: unknown) {
    super(
      message !== undefined
        ? message
        : cause instanceof Error
          ? cause.message
          : undefined
    );

    this.code = code;
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

export { CTRError, CTRError as Error };
