import { CTRError } from "@libctr/error";
import { CTRMemory, CTRMemoryDataType } from "#memory";

type CTRMemoryAction = "read" | "seek" | "write";
type CTRMemoryRange = [bigint, bigint] | [number, number];

type CTRMemoryErrorCode =
  | typeof CTRMemoryError.ERR_UNKNOWN
  | typeof CTRMemoryError.ERR_COUNT_FAIL
  | typeof CTRMemoryError.ERR_DEALLOCATED
  | typeof CTRMemoryError.ERR_OUT_OF_RANGE
  | typeof CTRMemoryError.ERR_UNKNOWN_TYPE
  | typeof CTRMemoryError.ERR_OUT_OF_MEMORY
  | typeof CTRMemoryError.ERR_OUT_OF_BOUNDS
  | typeof CTRMemoryError.ERR_INVALID_ARGUMENT
  | typeof CTRMemoryError.ERR_UNKNOWN_ENCODING
  | typeof CTRMemoryError.ERR_UNKNOWN_BOM_MARK
  | typeof CTRMemoryError.ERR_INVALID_OPERATION
  | typeof CTRMemoryError.ERR_UNKNOWN_ENDIANNESS;

class CTRMemoryError extends CTRError {
  public static readonly ERR_UNKNOWN = "memory.err_unknown";
  public static readonly ERR_COUNT_FAIL = "memory.err_count_fail";
  public static readonly ERR_DEALLOCATED = "memory.err_deallocated";
  public static readonly ERR_OUT_OF_RANGE = "memory.err_out_of_range";
  public static readonly ERR_UNKNOWN_TYPE = "memory.err_unknown_type";
  public static readonly ERR_OUT_OF_MEMORY = "memory.err_out_of_memory";
  public static readonly ERR_OUT_OF_BOUNDS = "memory.err_out_of_bounds";
  public static readonly ERR_INVALID_ARGUMENT = "memory.err_invalid_argument";
  public static readonly ERR_UNKNOWN_ENCODING = "memory.err_unknown_encoding";
  public static readonly ERR_UNKNOWN_BOM_MARK = "memory.err_unknown_bom_mark";
  public static readonly ERR_INVALID_OPERATION = "memory.err_invalid_operation";

  public static readonly ERR_UNKNOWN_ENDIANNESS =
    "memory.err_unknown_endianness";

  public readonly buffer: CTRMemory;
  public override readonly code: CTRMemoryErrorCode;

  public constructor(
    buffer: CTRMemory,
    code?: null | CTRMemoryErrorCode,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.buffer = buffer;
    this.code = code || CTRMemoryError.ERR_UNKNOWN;
  }
}

class CTRMemoryUsedError extends CTRMemoryError {
  public override readonly code: typeof CTRMemoryError.ERR_DEALLOCATED;

  public constructor(buffer: CTRMemory, message?: string, cause?: unknown) {
    super(buffer, null, message, cause);
    this.code = CTRMemoryError.ERR_DEALLOCATED;
  }
}

class CTRMemoryInvalidOperationError extends CTRMemoryError {
  public readonly action: CTRMemoryAction;
  public readonly type: null | CTRMemoryDataType;
  public readonly value: null | string | bigint | number;
  public override readonly code: typeof CTRMemoryError.ERR_UNKNOWN_BOM_MARK;

  public constructor(
    buffer: CTRMemory,
    value: null | string | bigint | number,
    action: CTRMemoryAction,
    type: null | CTRMemoryDataType,
    message: string,
    cause?: unknown
  ) {
    super(buffer, null, message, cause);

    this.type = type;
    this.value = value;
    this.action = action;
    this.code = CTRMemoryError.ERR_UNKNOWN_BOM_MARK;
  }
}

class CTRMemoryUnknownBOMMarkError extends CTRMemoryError {
  private static _makeMessage(bom: number, message?: string): string {
    if (message !== undefined) {
      return message;
    }

    return `unknown BOM mark 0x${bom.toString(16)}`;
  }

  public readonly bom: number;
  public override readonly code: typeof CTRMemoryError.ERR_UNKNOWN_BOM_MARK;

  public constructor(
    buffer: CTRMemory,
    bom: number,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryUnknownBOMMarkError._makeMessage(bom, message),
      cause
    );

    this.bom = bom;
    this.code = CTRMemoryError.ERR_UNKNOWN_BOM_MARK;
  }
}

class CTRMemoryUnknownTypeError extends CTRMemoryError {
  private static _makeMessage(type: string, message?: string): string {
    if (message !== undefined) {
      return message;
    }

    return `unknown type '${type}'`;
  }

  public readonly type: string;
  public override readonly code: typeof CTRMemoryError.ERR_UNKNOWN_TYPE;

  public constructor(
    buffer: CTRMemory,
    type: string,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryUnknownTypeError._makeMessage(type, message),
      cause
    );

    this.type = type;
    this.code = CTRMemoryError.ERR_UNKNOWN_TYPE;
  }
}

class CTRMemoryUnknownEncodingError extends CTRMemoryError {
  private static _makeMessage(encoding: string, message?: string): string {
    if (message !== undefined) {
      return message;
    }

    return `unknown encoding '${encoding}'`;
  }

  public readonly encoding: string;
  public override readonly code: typeof CTRMemoryError.ERR_UNKNOWN_ENCODING;

  public constructor(
    buffer: CTRMemory,
    encoding: string,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryUnknownEncodingError._makeMessage(encoding, message),
      cause
    );

    this.encoding = encoding;
    this.code = CTRMemoryError.ERR_UNKNOWN_ENCODING;
  }
}

class CTRMemoryUnknownEndiannessError extends CTRMemoryError {
  private static _makeMessage(endianness: string, message?: string): string {
    if (message !== undefined) {
      return message;
    }

    return `unknown endianness '${endianness}'`;
  }

  public readonly endianness: string;
  public override readonly code: typeof CTRMemoryError.ERR_UNKNOWN_ENDIANNESS;

  public constructor(
    buffer: CTRMemory,
    endianness: string,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryUnknownEndiannessError._makeMessage(endianness, message),
      cause
    );

    this.endianness = endianness;
    this.code = CTRMemoryError.ERR_UNKNOWN_ENDIANNESS;
  }
}

class CTRMemoryCountFailError extends CTRMemoryError {
  private static _makeMessage(
    count: number,
    action: CTRMemoryAction,
    message?: string
  ): string {
    if (message !== undefined) {
      return message;
    }

    return `failed to ${action} exactly ${count} bytes`;
  }

  public readonly count: number;
  public readonly actual: number;
  public readonly action: CTRMemoryAction;
  public override readonly code: typeof CTRMemoryError.ERR_COUNT_FAIL;

  public constructor(
    buffer: CTRMemory,
    count: number,
    actual: number,
    action: CTRMemoryAction,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryCountFailError._makeMessage(count, action, message),
      cause
    );

    this.count = count;
    this.action = action;
    this.actual = actual;
    this.code = CTRMemoryError.ERR_COUNT_FAIL;
  }
}

class CTRMemoryOOBError extends CTRMemoryError {
  private static _makeMessage(
    offset: number,
    type: null | CTRMemoryDataType,
    action: CTRMemoryAction,
    message?: string
  ): string {
    if (message !== undefined) {
      return message;
    }

    return type !== null
      ? `out of bounds ${action} of a ${type} at offset ${offset}`
      : `offset ${offset} is out of bounds`;
  }

  public readonly offset: number;
  public readonly action: CTRMemoryAction;
  public readonly type: null | CTRMemoryDataType;
  public override readonly code: typeof CTRMemoryError.ERR_OUT_OF_BOUNDS;

  public constructor(
    buffer: CTRMemory,
    offset: number,
    type: null | CTRMemoryDataType,
    action: CTRMemoryAction,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      null,
      CTRMemoryOOBError._makeMessage(offset, type, action, message),
      cause
    );

    this.type = type;
    this.action = action;
    this.offset = offset;
    this.code = CTRMemoryError.ERR_OUT_OF_BOUNDS;
  }
}

class CTRMemoryOutOfRangeError extends CTRMemoryError {
  private static _makeMessage(
    this: void,
    value: bigint | number,
    type: null | CTRMemoryDataType,
    range: null | CTRMemoryRange,
    message?: string
  ): string {
    if (message !== undefined) {
      return message;
    }

    message = `${value} is out of the allowed range`;

    if (type !== null) {
      message += ` for ${type}`;
    }

    if (range !== null) {
      message += ` ([${range[0]}; ${range[1]}])`;
    }

    return message;
  }

  public readonly value: bigint | number;
  public readonly range: null | CTRMemoryRange;
  public readonly type: null | CTRMemoryDataType;
  public override readonly code: typeof CTRMemoryError.ERR_OUT_OF_RANGE;

  public constructor(
    buffer: CTRMemory,
    value: bigint | number,
    type: null | CTRMemoryDataType,
    range: null | CTRMemoryRange,
    message?: string,
    cause?: unknown
  ) {
    super(
      buffer,
      CTRMemoryError.ERR_OUT_OF_RANGE,
      CTRMemoryOutOfRangeError._makeMessage(value, type, range, message),
      cause
    );

    this.type = type;
    this.range = range;
    this.value = value;
    this.code = CTRMemoryError.ERR_OUT_OF_RANGE;
  }
}

export {
  CTRMemoryInvalidOperationError,
  CTRMemoryInvalidOperationError as MemoryInvalidOperationError,
  CTRMemoryUnknownBOMMarkError,
  CTRMemoryUnknownBOMMarkError as MemoryUnknownBOMMarkError,
  CTRMemoryUnknownTypeError,
  CTRMemoryUnknownTypeError as MemoryUnknownTypeError,
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
  CTRMemoryUnknownEncodingError,
  CTRMemoryUnknownEncodingError as MemoryUnknownEncodingError,
  CTRMemoryUnknownEndiannessError,
  CTRMemoryUnknownEndiannessError as MemoryUnknownEndiannessError
};

export type {
  CTRMemoryRange,
  CTRMemoryRange as MemoryRange,
  CTRMemoryAction,
  CTRMemoryAction as MemoryAction,
  CTRMemoryErrorCode,
  CTRMemoryErrorCode as MemoryErrorCode
};
