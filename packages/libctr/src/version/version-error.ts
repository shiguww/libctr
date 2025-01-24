import { CTRError } from "@libctr/error";

type CTRVersionErrorCode =
  | typeof CTRVersionError.ERR_UNKNOWN
  | typeof CTRVersionError.ERR_INVALID_VERSION_SPECIFIER;

class CTRVersionError extends CTRError {
  public static readonly ERR_UNKNOWN = "version.err_unknown";

  public static readonly ERR_INVALID_VERSION_SPECIFIER =
    "version.err_invalid_version_specifier";

  public readonly specifier: unknown;
  public override readonly code: CTRVersionErrorCode;

  public constructor(
    code: null | undefined | CTRVersionErrorCode,
    specifier: unknown,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.specifier = specifier;
    this.code = code || CTRVersionError.ERR_UNKNOWN;
  }
}

export { CTRVersionError, CTRVersionError as VersionError };

export type { CTRVersionErrorCode, CTRVersionErrorCode as VersionErrorCode };
