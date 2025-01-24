class CTRError extends Error {
  public readonly code: string;
  public readonly cause: unknown;

  public constructor(code?: null | string, message?: string, cause?: unknown) {
    super(
      message !== undefined
        ? message
        : cause instanceof Error
          ? cause.message
          : undefined
    );

    this.cause = cause;
    this.name = this.constructor.name;
    this.code = code || "ctr.err_unknown";
  }
}

export { CTRError, CTRError as Error };
