import { CTRError } from "@libctr/error";
import type { CTRMemory, CTRMemoryDataType } from "#memory";

type CTRMemoryAction = "read" | "write";
type CTRMemoryRange = [bigint, bigint] | [number, number];

type CTRMemoryErrorCode =
  | typeof CTRMemoryError.ERR_DEALLOCATED
  | typeof CTRMemoryError.ERR_COUNT_FAIL
  | typeof CTRMemoryError.ERR_OUT_OF_RANGE
  | typeof CTRMemoryError.ERR_OUT_OF_MEMORY
  | typeof CTRMemoryError.ERR_OUT_OF_BOUNDS
  | typeof CTRMemoryError.ERR_INVALID_ARGUMENT
  | typeof CTRMemoryError.ERR_UNSUPPORTED_ENCODING;

interface CTRMemoryErrorMetadata {
  count?: number;
  actual?: number;
  offset?: number;
  encoding?: string;
  buffer?: CTRMemory;
  range?: CTRMemoryRange;
  value?: bigint | number;
  action?: CTRMemoryAction;
  datatype?: CTRMemoryDataType;
}

class CTRMemoryError<
  C extends CTRMemoryErrorCode = CTRMemoryErrorCode,
  M extends CTRMemoryErrorMetadata = CTRMemoryErrorMetadata
> extends CTRError<C, M> {
  public static is<C extends CTRMemoryErrorCode>(
    value: unknown,
    code?: C
  ): value is CTRMemoryError<C> {
    return (
      value instanceof CTRMemoryError &&
      (code === undefined || value.code === code)
    );
  }

  public static readonly ERR_COUNT_FAIL = "memory.err_count_fail";
  public static readonly ERR_DEALLOCATED = "memory.err_deallocated";
  public static readonly ERR_OUT_OF_RANGE = "memory.err_out_of_range";
  public static readonly ERR_OUT_OF_MEMORY = "memory.err_out_of_memory";
  public static readonly ERR_OUT_OF_BOUNDS = "memory.err_out_of_bounds";

  public static readonly ERR_UNSUPPORTED_ENCODING =
    "memory.err_unsupported_encoding";

  public static readonly ERR_INVALID_ARGUMENT = "memory.err_invalid_argument";

  public constructor(code: C, metadata: M, message?: string, cause?: unknown) {
    super(code, metadata, message, cause);
  }
}

class CTRMemoryUsedError extends CTRMemoryError<
  typeof CTRMemoryError.ERR_DEALLOCATED,
  {}
> {
  public constructor(message?: string, cause?: unknown) {
    super(CTRMemoryError.ERR_DEALLOCATED, {}, message, cause);
  }
}

interface CTRMemoryUnsupportedEncodingErrorMetadata
  extends Required<Pick<CTRMemoryErrorMetadata, "encoding">>,
    Pick<CTRMemoryErrorMetadata, "buffer"> {}

class CTRMemoryUnsupportedEncodingError extends CTRMemoryError<
  typeof CTRMemoryError.ERR_UNSUPPORTED_ENCODING,
  CTRMemoryUnsupportedEncodingErrorMetadata
> {
  public constructor(
    metadata: CTRMemoryUnsupportedEncodingErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRMemoryError.ERR_UNSUPPORTED_ENCODING,
      metadata,
      message || `unknown encoding '${metadata.encoding}'`,
      cause
    );
  }
}

interface CTRMemoryCountFailErrorMetadata
  extends Required<
    Pick<CTRMemoryErrorMetadata, "count" | "action" | "actual" | "buffer">
  > {}

class CTRMemoryCountFailError extends CTRMemoryError<
  typeof CTRMemoryError.ERR_COUNT_FAIL,
  CTRMemoryCountFailErrorMetadata
> {
  public constructor(
    metadata: CTRMemoryCountFailErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRMemoryError.ERR_COUNT_FAIL,
      metadata,
      message || `failed to ${metadata.action} exactly ${metadata.count} bytes`,
      cause
    );
  }
}

interface CTRMemoryOOBErrorMetadata
  extends Required<
      Pick<CTRMemoryErrorMetadata, "action" | "buffer" | "offset">
    >,
    Pick<CTRMemoryErrorMetadata, "datatype"> {}

class CTRMemoryOOBError extends CTRMemoryError<
  typeof CTRMemoryError.ERR_OUT_OF_BOUNDS,
  CTRMemoryOOBErrorMetadata
> {
  public constructor(
    metadata: CTRMemoryOOBErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRMemoryError.ERR_OUT_OF_BOUNDS,
      metadata,
      message || metadata.datatype !== undefined
        ? `out of bounds ${metadata.action} of a ${metadata.datatype} at offset ${metadata.offset}`
        : `offset ${metadata.offset} is out of bounds`,
      cause
    );
  }
}

interface CTRMemoryOutOfRangeErrorMetadata
  extends Required<Pick<CTRMemoryErrorMetadata, "range" | "value" | "buffer">>,
    Pick<CTRMemoryErrorMetadata, "datatype"> {}

class CTRMemoryOutOfRangeError extends CTRMemoryError<
  typeof CTRMemoryError.ERR_OUT_OF_RANGE,
  CTRMemoryOutOfRangeErrorMetadata
> {
  public constructor(
    metadata: CTRMemoryOutOfRangeErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRMemoryError.ERR_OUT_OF_RANGE,
      metadata,
      message || metadata.datatype !== undefined
        ? `${metadata.value} is out of the allowed range for ${metadata.datatype} ([${metadata.range[0]}; ${metadata.range[1]}])`
        : `${metadata.value} is out of the allowed range ([${metadata.range[0]}; ${metadata.range[1]}])`,
      cause
    );
  }
}

export {
  CTRMemoryError,
  CTRMemoryError as MemoryError,
  CTRMemoryOOBError,
  CTRMemoryOOBError as MemoryOOBError,
  CTRMemoryUsedError,
  CTRMemoryUsedError as MemoryUsedError,
  CTRMemoryOutOfRangeError,
  CTRMemoryOutOfRangeError as MemoryOutOfRangeError,
  CTRMemoryCountFailError,
  CTRMemoryCountFailError as MemoryCountFailError,
  CTRMemoryUnsupportedEncodingError,
  CTRMemoryUnsupportedEncodingError as MemoryUnsupportedEncodingError
};

export type {
  CTRMemoryRange,
  CTRMemoryRange as MemoryRange,
  CTRMemoryAction,
  CTRMemoryAction as MemoryAction,
  CTRMemoryErrorCode,
  CTRMemoryErrorCode as MemoryErrorCode,
  CTRMemoryErrorMetadata,
  CTRMemoryErrorMetadata as MemoryErrorMetadata,
  CTRMemoryOOBErrorMetadata,
  CTRMemoryOOBErrorMetadata as MemoryOOBErrorMetadata,
  CTRMemoryOutOfRangeErrorMetadata,
  CTRMemoryOutOfRangeErrorMetadata as MemoryOutOfRangeErrorMetadata,
  CTRMemoryCountFailErrorMetadata,
  CTRMemoryCountFailErrorMetadata as MemoryCountFailErrorMetadata,
  CTRMemoryUnsupportedEncodingErrorMetadata,
  CTRMemoryUnsupportedEncodingErrorMetadata as MemoryUnsupportedEncodingErrorMetadata
};
