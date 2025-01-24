import { CTRError } from "@libctr/error";
import type { CTRMemory } from "@libctr/memory";

type CTRBLZErrorCode =
  | typeof CTRBLZError.ERR_DECODE
  | typeof CTRBLZError.ERR_ENCODE
  | typeof CTRBLZError.ERR_UNKNOWN
  | typeof CTRBLZError.ERR_INVALID_HEADER
  | typeof CTRBLZError.ERR_MALFORMED_FILE
  | typeof CTRBLZError.ERR_NOT_A_BLZ_FILE
  | typeof CTRBLZError.ERR_BUFFER_TOO_LARGE
  | typeof CTRBLZError.ERR_BUFFER_TOO_SMALL
  | typeof CTRBLZError.ERR_UNEXPECTED_END_OF_FILE;

class CTRBLZError extends CTRError {
  public static readonly ERR_DECODE = "blz.err_decode";
  public static readonly ERR_ENCODE = "blz.err_encode";
  public static readonly ERR_UNKNOWN = "blz.err_unknown";
  public static readonly ERR_MALFORMED_FILE = "blz.err_malformed_file";
  public static readonly ERR_INVALID_HEADER = "blz.err_invalid_header";
  public static readonly ERR_NOT_A_BLZ_FILE = "blz.err_not_a_blz_file";
  public static readonly ERR_BUFFER_TOO_LARGE = "blz.err_buffer_too_large";
  public static readonly ERR_BUFFER_TOO_SMALL = "blz.err_buffer_too_small";

  public static readonly ERR_UNEXPECTED_END_OF_FILE =
    "blz.unexpected_end_of_file";

  public override readonly code: CTRBLZErrorCode;

  public constructor(
    code?: null | CTRBLZErrorCode,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);
    this.code = code || CTRBLZError.ERR_UNKNOWN;
  }
}

type CTRBLZFormatErrorCode =
  | typeof CTRBLZError.ERR_DECODE
  | typeof CTRBLZError.ERR_ENCODE;

class CTRBLZFormatError extends CTRError {
  public readonly buffer: CTRMemory;
  public override readonly code: CTRBLZFormatErrorCode;

  public constructor(
    code: CTRBLZFormatErrorCode,
    buffer: CTRMemory,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.code = code;
    this.buffer = buffer;
  }
}

export {
  CTRBLZError,
  CTRBLZError as BLZError,
  CTRBLZFormatError,
  CTRBLZFormatError as BLZFormatError
};

export type {
  CTRBLZErrorCode,
  CTRBLZErrorCode as BLZErrorCode,
  CTRBLZFormatErrorCode,
  CTRBLZFormatErrorCode as BLZFormatErrorCode
};
