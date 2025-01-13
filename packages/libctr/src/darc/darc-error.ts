import { CTRError } from "@libctr/error";
import type { CTRMemory } from "@libctr/memory";
import type { CTRVersion } from "#version/version";

type CTRDARCErrorCode =
  | typeof CTRDARCError.ERR_UNKNOWN
  | typeof CTRDARCError.ERR_INVALID_HEADER
  | typeof CTRDARCError.ERR_MALFORMED_FILE
  | typeof CTRDARCError.ERR_NOT_A_DARC_FILE
  | typeof CTRDARCError.ERR_UNSUPPORTED_VERSION
  | typeof CTRDARCError.ERR_UNEXPECTED_END_OF_FILE
  | typeof CTRDARCError.ERR_ROOT_IS_NOT_A_DIRECTORY;

interface CTRDARCErrorMetadata {
  buffer: CTRMemory;
  version?: CTRVersion;
}

class CTRDARCError<
  C extends CTRDARCErrorCode = CTRDARCErrorCode,
  M extends CTRDARCErrorMetadata = CTRDARCErrorMetadata
> extends CTRError<C, M> {
  public static is<C extends CTRDARCErrorCode>(
    value: unknown,
    code?: C
  ): value is CTRDARCError<C> {
    return (
      value instanceof CTRDARCError &&
      (code === undefined || value.code === code)
    );
  }

  public static readonly ERR_UNKNOWN = "darc.err_unknown";
  public static readonly ERR_INVALID_HEADER = "darc.err_invalid_header";
  public static readonly ERR_MALFORMED_FILE = "darc.err_malformed_file";
  public static readonly ERR_NOT_A_DARC_FILE = "darc.err_not_a_darc_file";

  public static readonly ERR_UNSUPPORTED_VERSION =
    "darc.err_unsupported_version";

  public static readonly ERR_UNEXPECTED_END_OF_FILE =
    "darc.err_unexpected_end_of_file";

  public static readonly ERR_ROOT_IS_NOT_A_DIRECTORY =
    "darc.err_root_is_not_a_directory";
}

interface CTRDARCUnsupportedVersionErrorMetadata
  extends Required<CTRDARCErrorMetadata> {}

class CTRDARCUnsupportedVersionError<
  M extends CTRDARCUnsupportedVersionErrorMetadata
> extends CTRDARCError<typeof CTRDARCError.ERR_UNSUPPORTED_VERSION, M> {
  public constructor(metadata: M, message?: string, cause?: unknown) {
    super(
      CTRDARCError.ERR_UNSUPPORTED_VERSION,
      metadata,
      message || `version ${metadata.version.toString()} is not supported`,
      cause
    );
  }
}

export {
  CTRDARCError,
  CTRDARCError as DARCError,
  CTRDARCUnsupportedVersionError,
  CTRDARCUnsupportedVersionError as DARCUnsupportedVersionError
};

export type {
  CTRDARCErrorCode,
  CTRDARCErrorCode as DARCErrorCode,
  CTRDARCErrorMetadata,
  CTRDARCErrorMetadata as DARCErrorMetadata,
  CTRDARCUnsupportedVersionErrorMetadata,
  CTRDARCUnsupportedVersionErrorMetadata as DARCUnsupportedVersionErrorMetadata
};
