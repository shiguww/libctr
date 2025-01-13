import { CTRError } from "@libctr/error";
import type { CTRMemory } from "@libctr/memory";

type CTRBLZErrorCode =
  | typeof CTRBLZError.ERR_UNKNOWN
  | typeof CTRBLZError.ERR_INVALID_HEADER
  | typeof CTRBLZError.ERR_MALFORMED_FILE
  | typeof CTRBLZError.ERR_NOT_A_BLZ_FILE
  | typeof CTRBLZError.ERR_BUFFER_TOO_LARGE
  | typeof CTRBLZError.ERR_BUFFER_TOO_SMALL
  | typeof CTRBLZError.ERR_UNEXPECTED_END_OF_FILE;

interface CTRBLZErrorMetadata {
  buffer: CTRMemory;
}

class CTRBLZError<C extends CTRBLZErrorCode = CTRBLZErrorCode> extends CTRError<
  C,
  CTRBLZErrorMetadata
> {
  public static is<C extends CTRBLZErrorCode>(
    value: unknown,
    code?: C
  ): value is CTRBLZError<C> {
    return (
      value instanceof CTRBLZError &&
      (code === undefined || value.code === code)
    );
  }

  public static readonly ERR_UNKNOWN = "blz.err_unknown";
  public static readonly ERR_MALFORMED_FILE = "blz.err_malformed_file";
  public static readonly ERR_INVALID_HEADER = "blz.err_invalid_header";
  public static readonly ERR_NOT_A_BLZ_FILE = "blz.err_not_a_blz_file";

  public static readonly ERR_BUFFER_TOO_LARGE = "blz.err_buffer_too_large";

  public static readonly ERR_BUFFER_TOO_SMALL = "blz.err_buffer_too_small";

  public static readonly ERR_UNEXPECTED_END_OF_FILE =
    "blz.unexpected_end_of_file";

  public constructor(
    code: C,
    metadata: CTRBLZErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(code, metadata, message, cause);
  }
}

export { CTRBLZError, CTRBLZError as BLZError };

export type {
  CTRBLZErrorCode,
  CTRBLZErrorCode as BLZErrorCode,
  CTRBLZErrorMetadata,
  CTRBLZErrorMetadata as BLZErrorMetadata
};
