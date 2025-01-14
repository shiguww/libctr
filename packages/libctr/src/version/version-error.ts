import { CTRError } from "@libctr/error";

type CTRVersionErrorCode = typeof CTRVersionError.ERR_INVALID_VERSION_SPECIFIER;

interface CTRVersionErrorMetadata {
  specifier?: unknown;
}

class CTRVersionError<
  C extends CTRVersionErrorCode = CTRVersionErrorCode,
  M extends CTRVersionErrorMetadata = CTRVersionErrorMetadata
> extends CTRError<C, M> {
  public static is<C extends CTRVersionErrorCode>(
    value: unknown,
    code?: C
  ): value is CTRVersionError<C> {
    return (
      value instanceof CTRVersionError &&
      (code === undefined || value.code === code)
    );
  }

  public static readonly ERR_INVALID_VERSION_SPECIFIER =
    "version.err_invalid_version_specifier";
}

interface CTRVersionInvalidSpecifierErrorMetadata {
  specifier: unknown;
}

class CTRVersionInvalidSpecifierError extends CTRVersionError<
  typeof CTRVersionError.ERR_INVALID_VERSION_SPECIFIER,
  CTRVersionInvalidSpecifierErrorMetadata
> {
  public constructor(
    metadata: CTRVersionInvalidSpecifierErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRVersionError.ERR_INVALID_VERSION_SPECIFIER,
      metadata,
      message || `invalid version specifier '${metadata.specifier}'`,
      cause
    );
  }
}

export {
  CTRVersionError,
  CTRVersionError as VersionError,
  CTRVersionInvalidSpecifierError,
  CTRVersionInvalidSpecifierError as VersionInvalidSpecifierError
};

export type {
  CTRVersionErrorCode,
  CTRVersionErrorCode as VersionErrorCode,
  CTRVersionErrorMetadata,
  CTRVersionErrorMetadata as VersionErrorMetadata,
  CTRVersionInvalidSpecifierErrorMetadata,
  CTRVersionInvalidSpecifierErrorMetadata as VersionInvalidSpecifierErrorMetadata
};
