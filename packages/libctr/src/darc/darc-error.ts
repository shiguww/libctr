import { CTRError } from "@libctr/error";
import type { CTRMemory } from "@libctr/memory";
import type { CTRVersion } from "#version/version";

type CTRDARCErrorCode =
  | typeof CTRDARCError.ERR_BUILD
  | typeof CTRDARCError.ERR_PARSE
  | typeof CTRDARCError.ERR_UNKNOWN
  | typeof CTRDARCError.ERR_INVALID_STATE
  | typeof CTRDARCError.ERR_INVALID_HEADER
  | typeof CTRDARCError.ERR_MALFORMED_FILE
  | typeof CTRDARCError.ERR_NOT_A_DARC_FILE
  | typeof CTRDARCError.ERR_UNSUPPORTED_VERSION
  | typeof CTRDARCError.ERR_UNEXPECTED_END_OF_FILE
  | typeof CTRDARCError.ERR_ROOT_IS_NOT_A_DIRECTORY;

class CTRDARCError extends CTRError {
  public static readonly ERR_BUILD = "darc.err_build";
  public static readonly ERR_PARSE = "darc.err_parse";
  public static readonly ERR_UNKNOWN = "darc.err_unknown";
  public static readonly ERR_INVALID_STATE = "darc.err_invalid_state";
  public static readonly ERR_INVALID_HEADER = "darc.err_invalid_header";
  public static readonly ERR_MALFORMED_FILE = "darc.err_malformed_file";
  public static readonly ERR_NOT_A_DARC_FILE = "darc.err_not_a_darc_file";

  public static readonly ERR_UNSUPPORTED_VERSION =
    "darc.err_unsupported_version";

  public static readonly ERR_UNEXPECTED_END_OF_FILE =
    "darc.err_unexpected_end_of_file";

  public static readonly ERR_ROOT_IS_NOT_A_DIRECTORY =
    "darc.err_root_is_not_a_directory";

  public override readonly code: CTRDARCErrorCode;

  public constructor(
    code?: null | CTRDARCErrorCode,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);
    this.code = code || CTRDARCError.ERR_UNKNOWN;
  }
}

type CTRDARCFormatErrorCode =
  | typeof CTRDARCError.ERR_BUILD
  | typeof CTRDARCError.ERR_PARSE;

class CTRDARCFormatError extends CTRDARCError {
  public readonly buffer: CTRMemory;
  public override readonly code: CTRDARCFormatErrorCode;

  public constructor(
    code: CTRDARCFormatErrorCode,
    buffer: CTRMemory,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.code = code;
    this.buffer = buffer;
  }
}

class CTRDARCInvalidStateError extends CTRDARCError {
  public readonly state: unknown;
  public override readonly code: typeof CTRDARCError.ERR_INVALID_STATE;

  public constructor(state: unknown, message?: string, cause?: unknown) {
    super(null, message || `Invalid state '${state}'`, cause);

    this.state = state;
    this.code = CTRDARCError.ERR_INVALID_STATE;
  }
}

class CTRDARCUnsupportedVersionError extends CTRDARCError {
  public readonly version: CTRVersion;
  public override readonly code: typeof CTRDARCError.ERR_UNSUPPORTED_VERSION;

  public constructor(version: CTRVersion, message?: string, cause?: unknown) {
    super(
      null,
      message || `version ${version.toString()} is not supported`,
      cause
    );

    this.version = version;
    this.code = CTRDARCError.ERR_UNSUPPORTED_VERSION;
  }
}

export {
  CTRDARCError,
  CTRDARCError as DARCError,
  CTRDARCFormatError,
  CTRDARCFormatError as DARCFormatError,
  CTRDARCInvalidStateError,
  CTRDARCInvalidStateError as DARCInvalidStateError,
  CTRDARCUnsupportedVersionError,
  CTRDARCUnsupportedVersionError as DARCUnsupportedVersionError
};

export type {
  CTRDARCErrorCode,
  CTRDARCErrorCode as DARCErrorCode,
  CTRDARCFormatErrorCode,
  CTRDARCFormatErrorCode as DARCFormatErrorCode
};
