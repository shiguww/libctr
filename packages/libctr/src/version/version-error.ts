import { CTRError } from "@libctr/error";

type CTRVersionErrorCode = typeof CTRVersionError.ERR_INVALID_VERSION_SPECIFIER;

class CTRVersionError extends CTRError {
  public static readonly ERR_INVALID_VERSION_SPECIFIER =
    "version.err_invalid_version_specifier";

  public readonly specifier: unknown;

  public constructor(
    code: null | CTRVersionErrorCode,
    specifier: unknown,
    message?: string,
    cause?: unknown
  ) {
    super(code, message, cause);
    this.specifier = specifier;
  }
}

export {
  CTRVersionError,
  CTRVersionError as VersionError
};

export type {
  CTRVersionErrorCode,
  CTRVersionErrorCode as VersionErrorCode
};
