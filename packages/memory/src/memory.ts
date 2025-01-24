import { constants } from "node:buffer";
import type { CTRMemoryAction, CTRMemoryRange } from "#memory-error";

import {
  CTRMemoryError,
  CTRMemoryOOBError,
  CTRMemoryUsedError,
  CTRMemoryCountFailError,
  CTRMemoryOutOfRangeError,
  CTRMemoryUnknownTypeError,
  CTRMemoryUnknownBOMMarkError,
  CTRMemoryUnknownEncodingError,
  CTRMemoryInvalidOperationError,
  CTRMemoryUnknownEndiannessError
} from "#memory-error";

type CTRMemoryEndianness = "BE" | "LE";
type CTRMemoryBOMDataType = "u16" | "u32";
type CTRMemoryTerminator = boolean | string;
type CTRMemorySource = number | CTRMemoryArray;
type CTRMemoryMix<A, B> = (A & B) | (A | B) | A | B;
type CTRMemoryDataType = (typeof CTR_MEMORY_DATA_TYPES)[number];

type CTRMemoryArray =
  | string
  | number[]
  | CTRMemory
  | Uint8Array
  | readonly number[];

type CTRMemoryEncoding =
  | "hex"
  | "ascii"
  | `ucs${"" | "-"}2`
  | `utf${"" | "-"}8`
  | `latin${"" | "-"}1`
  | `base${"" | "-"}64${"" | `${"" | "-"}url`}`
  | `utf${"" | "-"}16${"" | `${"" | "-"}be` | `${"" | "-"}le`}`
  | (string & {});

//#region
interface CTRMemoryOptions {
  lenient?: boolean;
  growth?: boolean | number;
  encoding?: CTRMemoryEncoding;
  endianness?: CTRMemoryEndianness;
  terminator?: CTRMemoryTerminator;
}

interface CTRMemoryLazyOptions {
  size?: number;
  fill?: CTRMemorySource;
}

interface CTRMemoryCreateOptions
  extends CTRMemoryOptions,
    CTRMemoryLazyOptions {
  offset?: number;
  source?: CTRMemorySource;
}
//#endregion

//#region
interface CTRMemoryBOMReadOptions
  extends Omit<CTRMemoryNumericReadOptions, "endianness"> {}

interface CTRMemoryRawReadOptions
  extends CTRMemoryBoundedReadBaseOptions,
    CTRMemoryCreateOptions {}

interface CTRMemoryBoundedReadBaseOptions extends CTRMemoryNumericReadOptions {
  count?: number;
  limit?: number;
}

interface CTRMemoryNumericReadOptions {
  lenient?: boolean;
  endianness?: CTRMemoryEndianness;
}

interface CTRMemoryStringReadOptions extends CTRMemoryBoundedReadBaseOptions {
  chunks?: number;
  encoding?: CTRMemoryEncoding;
  endianness?: CTRMemoryEndianness;
  terminator?: CTRMemoryTerminator;
  strip?: string | boolean | RegExp;
}
//#endregion

//#region
interface CTRMemoryBOMWriteOptions
  extends Omit<CTRMemoryNumericWriteOptions, "endianness"> {}

interface CTRMemoryNumericWriteOptions {
  grow?: boolean;
  lenient?: boolean;
  endianness?: CTRMemoryEndianness;
}

interface CTRMemoryStringWriteOptions extends CTRMemoryRawWriteOptions {
  endianness?: CTRMemoryEndianness;
  terminator?: boolean | CTRMemoryTerminator;
}

interface CTRMemoryRawWriteOptions
  extends Omit<CTRMemoryNumericWriteOptions, "endianness"> {
  count?: number;
  limit?: number;
  partial?: boolean;
  padding?: CTRMemorySource;
  encoding?: CTRMemoryEncoding;
}
//#endregion

//#region
const { MAX_LENGTH } = constants;

const CTR_MEMORY_DEFAULT_GROWTH = 1.5;
const CTR_MEMORY_DEFAULT_ENCODING = "utf8";
const CTR_MEMORY_DEFAULT_TERMINATOR = "\0";

const CTR_MEMORY_BOM_BE = 0xfeff;
const CTR_MEMORY_BOM_LE = 0xfffe;

const CTR_MEMORY_I8_SIZE = 1;
const CTR_MEMORY_U8_SIZE = 1;
const CTR_MEMORY_I16_SIZE = 2;
const CTR_MEMORY_U16_SIZE = 2;
const CTR_MEMORY_I24_SIZE = 3;
const CTR_MEMORY_U24_SIZE = 3;
const CTR_MEMORY_F32_SIZE = 4;
const CTR_MEMORY_I32_SIZE = 4;
const CTR_MEMORY_U32_SIZE = 4;
const CTR_MEMORY_I40_SIZE = 5;
const CTR_MEMORY_U40_SIZE = 5;
const CTR_MEMORY_I48_SIZE = 6;
const CTR_MEMORY_U48_SIZE = 6;
const CTR_MEMORY_F64_SIZE = 8;
const CTR_MEMORY_I64_SIZE = 8;
const CTR_MEMORY_U64_SIZE = 8;

const CTR_MEMORY_SIZE = new Map<CTRMemoryDataType, number>([
  ["i8", CTR_MEMORY_I8_SIZE],
  ["u8", CTR_MEMORY_U8_SIZE],
  ["i16", CTR_MEMORY_I16_SIZE],
  ["u16", CTR_MEMORY_U16_SIZE],
  ["i24", CTR_MEMORY_I24_SIZE],
  ["u24", CTR_MEMORY_U24_SIZE],
  ["f32", CTR_MEMORY_F32_SIZE],
  ["i32", CTR_MEMORY_I32_SIZE],
  ["u32", CTR_MEMORY_U32_SIZE],
  ["i40", CTR_MEMORY_I40_SIZE],
  ["u40", CTR_MEMORY_U40_SIZE],
  ["i48", CTR_MEMORY_I48_SIZE],
  ["u48", CTR_MEMORY_U48_SIZE],
  ["f64", CTR_MEMORY_F64_SIZE],
  ["i64", CTR_MEMORY_I64_SIZE],
  ["u64", CTR_MEMORY_U64_SIZE]
]);

const CTR_MEMORY_I8_MAX = 127;
const CTR_MEMORY_U8_MAX = 255;
const CTR_MEMORY_I16_MAX = 32767;
const CTR_MEMORY_U16_MAX = 65535;
const CTR_MEMORY_I24_MAX = 8388607;
const CTR_MEMORY_U24_MAX = 16777215;
const CTR_MEMORY_F32_MAX = +Infinity;
const CTR_MEMORY_F64_MAX = +Infinity;
const CTR_MEMORY_I32_MAX = 2147483647;
const CTR_MEMORY_U32_MAX = 4294967295;
const CTR_MEMORY_I40_MAX = 549755813887;
const CTR_MEMORY_U40_MAX = 1099511627775;
const CTR_MEMORY_I48_MAX = 140737488355327;
const CTR_MEMORY_U48_MAX = 281474976710655;
const CTR_MEMORY_I64_MAX = 9223372036854775807n;
const CTR_MEMORY_U64_MAX = 18446744073709551615n;

const CTR_MEMORY_MAX = new Map<CTRMemoryDataType, bigint | number>([
  ["i8", CTR_MEMORY_I8_MAX],
  ["u8", CTR_MEMORY_U8_MAX],
  ["i16", CTR_MEMORY_I16_MAX],
  ["u16", CTR_MEMORY_U16_MAX],
  ["i24", CTR_MEMORY_I24_MAX],
  ["u24", CTR_MEMORY_U24_MAX],
  ["f32", CTR_MEMORY_F32_MAX],
  ["i32", CTR_MEMORY_I32_MAX],
  ["u32", CTR_MEMORY_U32_MAX],
  ["i40", CTR_MEMORY_I40_MAX],
  ["u40", CTR_MEMORY_U40_MAX],
  ["i48", CTR_MEMORY_I48_MAX],
  ["u48", CTR_MEMORY_U48_MAX],
  ["f64", CTR_MEMORY_F64_MAX],
  ["i64", CTR_MEMORY_I64_MAX],
  ["u64", CTR_MEMORY_U64_MAX]
]);

const CTR_MEMORY_U8_MIN = 0;
const CTR_MEMORY_U32_MIN = 0;
const CTR_MEMORY_U16_MIN = 0;
const CTR_MEMORY_U24_MIN = 0;
const CTR_MEMORY_U40_MIN = 0;
const CTR_MEMORY_U48_MIN = 0;
const CTR_MEMORY_U64_MIN = 0n;
const CTR_MEMORY_I8_MIN = -128;
const CTR_MEMORY_I16_MIN = -32768;
const CTR_MEMORY_I24_MIN = -8388608;
const CTR_MEMORY_F32_MIN = -Infinity;
const CTR_MEMORY_F64_MIN = -Infinity;
const CTR_MEMORY_I32_MIN = -2147483648;
const CTR_MEMORY_I40_MIN = -549755813888;
const CTR_MEMORY_I48_MIN = -140737488355328;
const CTR_MEMORY_I64_MIN = -9223372036854775808n;

const CTR_MEMORY_MIN = new Map<CTRMemoryDataType, bigint | number>([
  ["i8", CTR_MEMORY_I8_MIN],
  ["u8", CTR_MEMORY_U8_MIN],
  ["i16", CTR_MEMORY_I16_MIN],
  ["u16", CTR_MEMORY_U16_MIN],
  ["i24", CTR_MEMORY_I24_MIN],
  ["u24", CTR_MEMORY_U24_MIN],
  ["f32", CTR_MEMORY_F32_MIN],
  ["i32", CTR_MEMORY_I32_MIN],
  ["u32", CTR_MEMORY_U32_MIN],
  ["i40", CTR_MEMORY_I40_MIN],
  ["u40", CTR_MEMORY_U40_MIN],
  ["i48", CTR_MEMORY_I48_MIN],
  ["u48", CTR_MEMORY_U48_MIN],
  ["f64", CTR_MEMORY_F64_MIN],
  ["i64", CTR_MEMORY_I64_MIN],
  ["u64", CTR_MEMORY_U64_MIN]
]);

const CTR_MEMORY_DATA_TYPES = [
  "i8",
  "u8",
  "i16",
  "raw",
  "u16",
  "i24",
  "u24",
  "f32",
  "i32",
  "u32",
  "i40",
  "u40",
  "i48",
  "u48",
  "f64",
  "i64",
  "u64",
  "string"
] as const;

const CTR_MEMORY_EMPTY = Buffer.alloc(0);
//#endregion

class CTRMemory {
  public static readonly MAX_SIZE = MAX_LENGTH;
  public static readonly MAX_LENGTH = MAX_LENGTH;

  public static readonly BOM_BE = CTR_MEMORY_BOM_BE;
  public static readonly BOM_LE = CTR_MEMORY_BOM_LE;
  public static readonly DATA_TYPES = CTR_MEMORY_DATA_TYPES;

  public static readonly I8_MAX = CTR_MEMORY_I8_MAX;
  public static readonly U8_MAX = CTR_MEMORY_U8_MAX;
  public static readonly I16_MAX = CTR_MEMORY_I16_MAX;
  public static readonly U16_MAX = CTR_MEMORY_U16_MAX;
  public static readonly I24_MAX = CTR_MEMORY_I24_MAX;
  public static readonly U24_MAX = CTR_MEMORY_U24_MAX;
  public static readonly F32_MAX = CTR_MEMORY_F32_MAX;
  public static readonly F64_MAX = CTR_MEMORY_F64_MAX;
  public static readonly I32_MAX = CTR_MEMORY_I32_MAX;
  public static readonly U32_MAX = CTR_MEMORY_U32_MAX;
  public static readonly I40_MAX = CTR_MEMORY_I40_MAX;
  public static readonly U40_MAX = CTR_MEMORY_U40_MAX;
  public static readonly I48_MAX = CTR_MEMORY_I48_MAX;
  public static readonly U48_MAX = CTR_MEMORY_U48_MAX;
  public static readonly I64_MAX = CTR_MEMORY_I64_MAX;
  public static readonly U64_MAX = CTR_MEMORY_U64_MAX;

  public static readonly I8_MIN = CTR_MEMORY_I8_MIN;
  public static readonly U8_MIN = CTR_MEMORY_U8_MIN;
  public static readonly U32_MIN = CTR_MEMORY_U32_MIN;
  public static readonly U16_MIN = CTR_MEMORY_U16_MIN;
  public static readonly U24_MIN = CTR_MEMORY_U24_MIN;
  public static readonly U40_MIN = CTR_MEMORY_U40_MIN;
  public static readonly U48_MIN = CTR_MEMORY_U48_MIN;
  public static readonly U64_MIN = CTR_MEMORY_U64_MIN;
  public static readonly I16_MIN = CTR_MEMORY_I16_MIN;
  public static readonly I24_MIN = CTR_MEMORY_I24_MIN;
  public static readonly F32_MIN = CTR_MEMORY_F32_MIN;
  public static readonly F64_MIN = CTR_MEMORY_F64_MIN;
  public static readonly I32_MIN = CTR_MEMORY_I32_MIN;
  public static readonly I40_MIN = CTR_MEMORY_I40_MIN;
  public static readonly I48_MIN = CTR_MEMORY_I48_MIN;
  public static readonly I64_MIN = CTR_MEMORY_I64_MIN;

  public static readonly I8_SIZE = CTR_MEMORY_I8_SIZE;
  public static readonly U8_SIZE = CTR_MEMORY_U8_SIZE;
  public static readonly I16_SIZE = CTR_MEMORY_I16_SIZE;
  public static readonly U16_SIZE = CTR_MEMORY_U16_SIZE;
  public static readonly I24_SIZE = CTR_MEMORY_I24_SIZE;
  public static readonly U24_SIZE = CTR_MEMORY_U24_SIZE;
  public static readonly F32_SIZE = CTR_MEMORY_F32_SIZE;
  public static readonly I32_SIZE = CTR_MEMORY_I32_SIZE;
  public static readonly U32_SIZE = CTR_MEMORY_U32_SIZE;
  public static readonly I40_SIZE = CTR_MEMORY_I40_SIZE;
  public static readonly U40_SIZE = CTR_MEMORY_U40_SIZE;
  public static readonly I48_SIZE = CTR_MEMORY_I48_SIZE;
  public static readonly U48_SIZE = CTR_MEMORY_U48_SIZE;
  public static readonly F64_SIZE = CTR_MEMORY_F64_SIZE;
  public static readonly I64_SIZE = CTR_MEMORY_I64_SIZE;
  public static readonly U64_SIZE = CTR_MEMORY_U64_SIZE;

  public static readonly BITS = 8;
  public static readonly I8_SIZE_BITS = CTRMemory.I8_SIZE * CTRMemory.BITS;
  public static readonly U8_SIZE_BITS = CTRMemory.U8_SIZE * CTRMemory.BITS;
  public static readonly I16_SIZE_BITS = CTRMemory.I16_SIZE * CTRMemory.BITS;
  public static readonly U16_SIZE_BITS = CTRMemory.U16_SIZE * CTRMemory.BITS;
  public static readonly I24_SIZE_BITS = CTRMemory.I24_SIZE * CTRMemory.BITS;
  public static readonly U24_SIZE_BITS = CTRMemory.U24_SIZE * CTRMemory.BITS;
  public static readonly F32_SIZE_BITS = CTRMemory.F32_SIZE * CTRMemory.BITS;
  public static readonly I32_SIZE_BITS = CTRMemory.I32_SIZE * CTRMemory.BITS;
  public static readonly U32_SIZE_BITS = CTRMemory.U32_SIZE * CTRMemory.BITS;
  public static readonly I40_SIZE_BITS = CTRMemory.I40_SIZE * CTRMemory.BITS;
  public static readonly U40_SIZE_BITS = CTRMemory.U40_SIZE * CTRMemory.BITS;
  public static readonly I48_SIZE_BITS = CTRMemory.I48_SIZE * CTRMemory.BITS;
  public static readonly U48_SIZE_BITS = CTRMemory.U48_SIZE * CTRMemory.BITS;
  public static readonly F64_SIZE_BITS = CTRMemory.F64_SIZE * CTRMemory.BITS;
  public static readonly I64_SIZE_BITS = CTRMemory.I64_SIZE * CTRMemory.BITS;
  public static readonly U64_SIZE_BITS = CTRMemory.U64_SIZE * CTRMemory.BITS;

  public static max(type: CTRMemoryDataType): bigint | number {
    const max = CTR_MEMORY_MAX.get(type);
    return max !== undefined ? max : Infinity;
  }

  public static min(type: CTRMemoryDataType): bigint | number {
    const min = CTR_MEMORY_MIN.get(type);
    return min !== undefined ? min : -Infinity;
  }

  public static align(offset: number, alignment: number): number {
    return Math.ceil(offset / alignment) * alignment;
  }

  public static sizeof(type: CTRMemoryDataType): number {
    const size = CTR_MEMORY_SIZE.get(type);
    return size !== undefined ? size : NaN;
  }

  public static isSource(value: unknown): value is CTRMemorySource {
    return (
      Array.isArray(value) ||
      value instanceof CTRMemory ||
      typeof value === "string" ||
      typeof value === "number" ||
      value instanceof Uint8Array
    );
  }

  public static bitlength(string: string, encoding: CTRMemoryEncoding): number {
    return this.bytelength(string, encoding) * CTRMemory.BITS;
  }

  public static bytelength(
    string: string,
    encoding: CTRMemoryEncoding
  ): number {
    return new CTRMemory(string, encoding).length;
  }

  public static sizeofbits(type: CTRMemoryBOMDataType): number {
    return this.sizeof(type) * CTRMemory.BITS;
  }

  public static normalizeEncoding(
    buffer: CTRMemory,
    encoding: string,
    endianness: CTRMemoryEndianness
  ): "utf16be" | BufferEncoding {
    let _encoding = encoding.toLowerCase().replace(/[^0-9a-z]/g, "");

    if (_encoding === "utf16") {
      _encoding += endianness.toLowerCase();
    }

    if (_encoding !== "utf16be" && !Buffer.isEncoding(_encoding)) {
      throw new CTRMemoryUnknownEncodingError(buffer, encoding);
    }

    return _encoding;
  }

  public static normalizeEndianness(
    buffer: CTRMemory,
    endianness: string
  ): CTRMemoryEndianness {
    let _endianness = endianness.toUpperCase();

    if (_endianness === "BE" || _endianness === "LE") {
      return _endianness;
    }

    throw new CTRMemoryUnknownEndiannessError(buffer, endianness);
  }

  private static _decode(
    buffer: CTRMemory,
    input: Buffer,
    encoding: string,
    endianness: CTRMemoryEndianness
  ): string {
    const _encoding = CTRMemory.normalizeEncoding(buffer, encoding, endianness);

    if (_encoding === "utf16be") {
      const tmp = Buffer.from(input);

      for (let i = 0; i + 1 < buffer.length; i += CTR_MEMORY_U16_SIZE) {
        tmp.writeUInt16LE(tmp.readUint16BE(i), i);
      }

      return tmp.toString("utf16le");
    }

    return input.toString(_encoding);
  }

  private static _encode(
    buffer: CTRMemory,
    string: string,
    encoding: string,
    endianness: CTRMemoryEndianness
  ): Buffer {
    const _encoding = CTRMemory.normalizeEncoding(buffer, encoding, endianness);

    if (_encoding === "utf16be") {
      const buffer = Buffer.from(string, "utf16le");

      for (let i = 0; i + 1 < buffer.length; i += CTR_MEMORY_U16_SIZE) {
        buffer.writeUInt16BE(buffer.readUint16LE(i), i);
      }

      return buffer;
    }

    return Buffer.from(string, _encoding);
  }

  private static _source(
    buffer: CTRMemory,
    source: CTRMemorySource,
    encoding: CTRMemoryEncoding,
    endianness: CTRMemoryEndianness
  ): Uint8Array {
    return source instanceof Uint8Array
      ? source
      : source instanceof CTRMemory
        ? source.buffer
        : typeof source === "string"
          ? CTRMemory._encode(buffer, source, encoding, endianness)
          : typeof source === "object"
            ? new Uint8Array(source)
            : new Uint8Array([source]);
  }

  private static _validateCount(
    buffer: CTRMemory,
    count: number | undefined,
    actual: number,
    action: CTRMemoryAction
  ): void {
    if (count !== undefined && actual !== count) {
      throw new CTRMemoryCountFailError(buffer, count, actual, action);
    }
  }

  private static _validateRange(
    buffer: CTRMemory,
    type: CTRMemoryDataType,
    value: bigint | number
  ): void {
    const max = CTRMemory.max(type);
    const min = CTRMemory.min(type);

    if (value < min || value > max) {
      throw new CTRMemoryOutOfRangeError(buffer, value, type, <CTRMemoryRange>[
        min,
        max
      ]);
    }
  }

  private static _validateSizeofOrGrow(
    buffer: CTRMemory,
    sizeof: number,
    action: CTRMemoryAction,
    type: CTRMemoryDataType,
    count: number | undefined,
    actual: number,
    allowGrow: boolean,
    options?: CTRMemoryNumericWriteOptions
  ): boolean {
    if (
      buffer.offset + sizeof > buffer.capacity ||
      (action !== "write" && buffer.offset + sizeof > buffer.length)
    ) {
      if (
        allowGrow &&
        (options?.grow === undefined ? buffer._options.growth : options.grow)
      ) {
        buffer._grow(buffer._offset + sizeof);
        return true;
      }

      if (options?.lenient || buffer._options.lenient) {
        return false;
      }

      CTRMemory._validateCount(buffer, count, actual, action);
      throw new CTRMemoryOOBError(buffer, buffer._offset, type, action);
    }

    return true;
  }

  private _size: number;
  private _used: boolean;
  private _offset: number;
  private _memory: Buffer;
  private _lastread: number;
  private _allocated: boolean;
  private _lastwritten: number;
  private _lazyoptions: null | CTRMemoryLazyOptions;
  private _options: Required<CTRMemoryOptions & { growth: number }>;

  public constructor(options?: CTRMemoryCreateOptions);

  public constructor(
    size: number,
    options?: Omit<CTRMemoryCreateOptions, "size">
  );

  public constructor(
    source: Exclude<CTRMemorySource, string | number>,
    options?: Omit<CTRMemoryCreateOptions, "source">
  );

  public constructor(
    string: string,
    encoding?: CTRMemoryEncoding,
    options?: Omit<CTRMemoryCreateOptions, "source">
  );

  public constructor(
    optionsOrSizeOrSourceOrString?: CTRMemorySource | CTRMemoryCreateOptions,
    optionsOrEncoding?: CTRMemoryEncoding | CTRMemoryCreateOptions,
    options?: CTRMemoryCreateOptions
  );

  public constructor(
    _optionsOrSizeOrSourceOrString?: CTRMemorySource | CTRMemoryCreateOptions,
    _optionsOrEncoding?: CTRMemoryEncoding | CTRMemoryCreateOptions,
    _options?: CTRMemoryCreateOptions
  ) {
    this._size = 0;
    this._offset = 0;
    this._used = false;
    this._lastread = NaN;
    this._lastwritten = NaN;
    this._allocated = false;
    this._lazyoptions = null;
    this._memory = CTR_MEMORY_EMPTY;

    this._options = {
      lenient: false,
      endianness: "LE",
      terminator: false,
      growth: CTR_MEMORY_DEFAULT_GROWTH,
      encoding: CTR_MEMORY_DEFAULT_ENCODING
    };

    const options =
      _optionsOrSizeOrSourceOrString !== undefined &&
      !CTRMemory.isSource(_optionsOrSizeOrSourceOrString)
        ? _optionsOrSizeOrSourceOrString
        : typeof _optionsOrEncoding === "object"
          ? _optionsOrEncoding
          : _options || {};

    const size =
      typeof _optionsOrSizeOrSourceOrString === "number"
        ? _optionsOrSizeOrSourceOrString
        : options.size;

    const source =
      typeof _optionsOrSizeOrSourceOrString !== "number" &&
      CTRMemory.isSource(_optionsOrSizeOrSourceOrString)
        ? _optionsOrSizeOrSourceOrString
        : options.source;

    const encoding =
      typeof _optionsOrEncoding === "string"
        ? _optionsOrEncoding
        : options.encoding || CTR_MEMORY_DEFAULT_ENCODING;

    this._init(size, encoding, source, options);
  }

  public get size(): number {
    this._check();

    if (this._allocated) {
      return this._size;
    }

    return this._lazyoptions?.size || 0;
  }

  public set size(size: number) {
    this._check();

    if (this._allocated) {
      this.reallocate(size);
      return;
    }

    if (this._lazyoptions === null) {
      this._lazyoptions = {};
    }

    this._lazyoptions.size = size;
  }

  public get array(): number[] {
    return Array.from(this.values);
  }

  public get ended(): boolean {
    return this._offset >= this.size;
  }

  public get buffer(): Buffer {
    this._lazyalloc();
    return this._memory.subarray(0, this.length);
  }

  public get length(): number {
    return this.size;
  }

  public set length(length: number) {
    this._check();
    this.size = length;
  }

  public get offset(): number {
    return this._offset;
  }

  public set offset(offset: number) {
    this.seek(offset);
  }

  public get growth(): number {
    this._check();
    return this._options.growth;
  }

  public set growth(growth: boolean | number) {
    this._check();

    if (typeof growth === "number" && growth !== 0 && growth < 1) {
      throw new CTRMemoryOutOfRangeError(
        this,
        growth,
        null,
        [1, Infinity],
        `growth factor must be 0 or equal to or more than 1`
      );
    }

    if (growth === true) {
      growth = CTR_MEMORY_DEFAULT_GROWTH;
    }

    if (growth === false) {
      growth = 0;
    }

    this._options.growth = growth;
  }

  public get lenient(): boolean {
    this._check();
    return this._options.lenient;
  }

  public set lenient(lenient: boolean) {
    this._check();
    this._options.lenient = lenient;
  }

  public get values(): ArrayIterator<number> {
    this._check();
    return this.buffer.values();
  }

  public get capacity(): number {
    this._lazyalloc();
    return this._memory.length;
  }

  public get encoding(): CTRMemoryEncoding {
    this._check();
    return this._options.encoding;
  }

  public set encoding(encoding: CTRMemoryEncoding) {
    this._check();

    this._options.encoding = CTRMemory.normalizeEncoding(
      this,
      encoding,
      this._options.endianness
    );
  }

  public get lastread(): number {
    return this._lastread;
  }

  public get allocated(): boolean {
    return this._allocated;
  }

  public get endianness(): CTRMemoryEndianness {
    this._check();
    return this._options.endianness;
  }

  public set endianness(endianness: CTRMemoryEndianness) {
    this._check();
    this._options.endianness = CTRMemory.normalizeEndianness(this, endianness);
  }

  public get terminator(): CTRMemoryTerminator {
    this._check();
    return this._options.terminator;
  }

  public set terminator(terminator: CTRMemoryTerminator) {
    this._check();
    this._options.terminator = terminator;
  }

  public get lastwritten(): number {
    this._check();
    return this._lastwritten;
  }

  public at<T>(offset: number, fn: (buf: this) => T): T;
  public at(offset: number, datatype: "i8" | "u8"): number;

  public at(
    offset: number,
    datatype: "raw",
    options?: CTRMemoryRawReadOptions
  ): CTRMemory;

  public at(
    offset: number,
    datatype: "string",
    options?: CTRMemoryStringReadOptions
  ): CTRMemory;

  public at(
    offset: number,
    datatype: "i64" | "u64",
    options?: CTRMemoryNumericReadOptions
  ): bigint;

  public at(
    offset: number,
    datatype: `${"f" | "i" | "u"}${"8" | "16" | "24" | "32" | "40" | "48" | "64"}` &
      CTRMemoryDataType,
    options?: CTRMemoryNumericReadOptions
  ): number;

  public at<T>(
    offset: number,
    fnOrDatatype: CTRMemoryDataType | ((buf: this) => T),
    options?: CTRMemoryMix<
      CTRMemoryMix<CTRMemoryRawReadOptions, CTRMemoryStringReadOptions>,
      CTRMemoryNumericReadOptions
    >
  ): T | string | bigint | number | CTRMemory;

  public at<T>(
    offset: number,
    _fnOrDatatype: CTRMemoryDataType | ((buf: this) => T),
    options?: CTRMemoryMix<
      CTRMemoryMix<CTRMemoryRawReadOptions, CTRMemoryStringReadOptions>,
      CTRMemoryNumericReadOptions
    >
  ): T | string | bigint | number | CTRMemory {
    const fn = typeof _fnOrDatatype === "function" ? _fnOrDatatype : undefined;

    const datatype =
      typeof _fnOrDatatype === "string" ? _fnOrDatatype : undefined;

    const oldOffset = this._offset;
    this.seek(offset);

    try {
      if (datatype !== undefined) {
        return this.read(datatype, options);
      }

      if (fn !== undefined) {
        return fn(this);
      }

      throw new CTRMemoryInvalidOperationError(
        this,
        null,
        "seek",
        null,
        "expected either 'fn' or 'datatype' to be passed but none was passed"
      );
    } finally {
      this._offset = oldOffset;
    }
  }

  public i8(options?: CTRMemoryNumericReadOptions): number;
  public i8(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i8(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i8(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI8(options);
    }

    return this.writeI8(value, options);
  }

  public u8(options?: CTRMemoryNumericReadOptions): number;
  public u8(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u8(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u8(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU8(options);
    }

    return this.writeU8(value, options);
  }

  public i16(options?: CTRMemoryNumericReadOptions): number;
  public i16(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i16(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i16(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI16(options);
    }

    return this.writeI16(value, options);
  }

  public bom(
    type: CTRMemoryBOMDataType,
    options?: CTRMemoryBOMReadOptions
  ): CTRMemoryEndianness;

  public bom(
    type: CTRMemoryBOMDataType,
    value?: CTRMemoryEndianness,
    options?: CTRMemoryBOMWriteOptions
  ): this;

  public bom(
    type: CTRMemoryBOMDataType,
    valueOrOptions?: CTRMemoryEndianness | CTRMemoryBOMReadOptions,
    options?: CTRMemoryMix<CTRMemoryBOMReadOptions, CTRMemoryBOMWriteOptions>
  ): this | CTRMemoryEndianness;

  public bom(
    type: CTRMemoryBOMDataType,
    _valueOrOptions?: CTRMemoryEndianness | CTRMemoryBOMReadOptions,
    _options?: CTRMemoryMix<CTRMemoryBOMReadOptions, CTRMemoryBOMWriteOptions>
  ): this | CTRMemoryEndianness {
    const value =
      typeof _valueOrOptions === "string" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readBOM(type, options);
    }

    return this.writeBOM(type, value, options);
  }

  public pad(
    byte: number,
    count: number,
    options?: CTRMemoryRawWriteOptions
  ): this {
    return this.raw(Buffer.alloc(count, byte), { ...options, count });
  }

  public raw(options?: CTRMemoryBoundedReadBaseOptions): CTRMemory;
  public raw(value: CTRMemorySource, options?: CTRMemoryRawWriteOptions): this;

  public raw(
    valueOrOptions?: CTRMemorySource | CTRMemoryBoundedReadBaseOptions,
    options?: CTRMemoryRawWriteOptions
  ): this | CTRMemory;

  public raw(
    _valueOrOptions?: CTRMemorySource | CTRMemoryBoundedReadBaseOptions,
    _options?: CTRMemoryRawWriteOptions
  ): this | CTRMemory {
    const value = CTRMemory.isSource(_valueOrOptions)
      ? _valueOrOptions
      : undefined;

    const options =
      !CTRMemory.isSource(_valueOrOptions) &&
      typeof _valueOrOptions === "object"
        ? _valueOrOptions
        : _options;

    if (value === undefined) {
      return this.readRaw(options);
    }

    return this.writeRaw(value, options);
  }

  public u16(options?: CTRMemoryNumericReadOptions): number;
  public u16(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u16(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u16(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU16(options);
    }

    return this.writeU16(value, options);
  }

  public i24(options?: CTRMemoryNumericReadOptions): number;
  public i24(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i24(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i24(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI24(options);
    }

    return this.writeI24(value, options);
  }

  public u24(options?: CTRMemoryNumericReadOptions): number;
  public u24(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u24(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u24(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU24(options);
    }

    return this.writeU24(value, options);
  }

  public f32(options?: CTRMemoryNumericReadOptions): number;
  public f32(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public f32(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public f32(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readF32(options);
    }

    return this.writeF32(value, options);
  }

  public i32(options?: CTRMemoryNumericReadOptions): number;
  public i32(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i32(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i32(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI32(options);
    }

    return this.writeI32(value, options);
  }

  public u32(options?: CTRMemoryNumericReadOptions): number;
  public u32(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u32(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u32(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU32(options);
    }

    return this.writeU32(value, options);
  }

  public i40(options?: CTRMemoryNumericReadOptions): number;
  public i40(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i40(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i40(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI40(options);
    }

    return this.writeI40(value, options);
  }

  public u40(options?: CTRMemoryNumericReadOptions): number;
  public u40(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u40(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u40(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU40(options);
    }

    return this.writeU40(value, options);
  }

  public i48(options?: CTRMemoryNumericReadOptions): number;
  public i48(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public i48(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public i48(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI48(options);
    }

    return this.writeI48(value, options);
  }

  public u48(options?: CTRMemoryNumericReadOptions): number;
  public u48(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public u48(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public u48(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU48(options);
    }

    return this.writeU48(value, options);
  }

  public f64(options?: CTRMemoryNumericReadOptions): number;
  public f64(value: number, options?: CTRMemoryNumericWriteOptions): this;

  public f64(
    valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | number;

  public f64(
    _valueOrOptions?: number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | number {
    const value =
      typeof _valueOrOptions === "number" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readF64(options);
    }

    return this.writeF64(value, options);
  }

  public i64(options?: CTRMemoryNumericReadOptions): bigint;

  public i64(
    value: bigint | number,
    options?: CTRMemoryNumericWriteOptions
  ): this;

  public i64(
    valueOrOptions?: bigint | number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | bigint;

  public i64(
    _valueOrOptions?: bigint | number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | bigint {
    const value =
      typeof _valueOrOptions === "bigint" || typeof _valueOrOptions === "number"
        ? _valueOrOptions
        : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readI64(options);
    }

    return this.writeI64(value, options);
  }

  public u64(options?: CTRMemoryNumericReadOptions): bigint;

  public u64(
    value: bigint | number,
    options?: CTRMemoryNumericWriteOptions
  ): this;

  public u64(
    valueOrOptions?: bigint | number | undefined | CTRMemoryNumericReadOptions,
    options?: CTRMemoryNumericWriteOptions
  ): this | bigint;

  public u64(
    _valueOrOptions?: bigint | number | undefined | CTRMemoryNumericReadOptions,
    _options?: CTRMemoryNumericWriteOptions
  ): this | bigint {
    const value =
      typeof _valueOrOptions === "bigint" || typeof _valueOrOptions === "number"
        ? _valueOrOptions
        : undefined;

    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readU64(options);
    }

    return this.writeU64(value, options);
  }

  public read(datatype: "raw", options?: CTRMemoryRawReadOptions): CTRMemory;
  public read(datatype: "string", options?: CTRMemoryStringReadOptions): string;

  public read(
    datatype: "i64" | "u64",
    options?: CTRMemoryNumericReadOptions
  ): bigint;

  public read(
    datatype: `${"f" | "i" | "u"}${"8" | "16" | "24" | "32" | "40" | "48" | "64"}` &
      CTRMemoryDataType,
    options?: CTRMemoryNumericReadOptions
  ): number;

  public read(
    datatype: CTRMemoryDataType,
    options?: CTRMemoryMix<
      CTRMemoryStringReadOptions,
      CTRMemoryMix<CTRMemoryRawReadOptions, CTRMemoryNumericReadOptions>
    >
  ): string | number | CTRMemory;

  public read(
    datatype: CTRMemoryDataType,
    options?: CTRMemoryMix<
      CTRMemoryStringReadOptions,
      CTRMemoryMix<CTRMemoryRawReadOptions, CTRMemoryNumericReadOptions>
    >
  ): string | bigint | number | CTRMemory {
    switch (datatype) {
      case "i8":
        return this.readI8(options);
      case "u8":
        return this.readU8(options);
      case "i16":
        return this.readI16(options);
      case "raw":
        return this.readRaw(options);
      case "u16":
        return this.readU16(options);
      case "i24":
        return this.readI24(options);
      case "u24":
        return this.readU24(options);
      case "f32":
        return this.readF32(options);
      case "i32":
        return this.readI32(options);
      case "u32":
        return this.readU32(options);
      case "i40":
        return this.readI40(options);
      case "u40":
        return this.readU40(options);
      case "i48":
        return this.readI48(options);
      case "u48":
        return this.readU48(options);
      case "f64":
        return this.readI64(options);
      case "i64":
        return this.readI64(options);
      case "u64":
        return this.readU64(options);
      case "string":
        return this.readString(<CTRMemoryStringReadOptions>options);
      default:
        throw new CTRMemoryUnknownTypeError(this, datatype);
    }
  }

  public seek(offset: number): this {
    this._check();

    if (offset >= 0 && offset > this._size) {
      throw new CTRMemoryOOBError(this, offset, null, "seek");
    }

    if (offset < 0) {
      if (-offset > this._size) {
        throw new CTRMemoryOOBError(this, offset, null, "seek");
      }

      offset = this._size + offset;
    }

    this._offset = offset;
    return this;
  }

  public trim(): this {
    this._lazyalloc();
    return this.reallocate(this._size);
  }

  public with<T>(fn: (buf: Buffer) => T): T {
    return fn(this.buffer);
  }

  public clone(): CTRMemory {
    return new CTRMemory(this.slice(undefined, undefined, this._options));
  }

  public slice(
    start?: number,
    end?: number,
    options?: CTRMemoryCreateOptions
  ): CTRMemory {
    if (end !== undefined) {
      end = Math.min(end, this.length);
    } else if (end === undefined) {
      end = this.length;
    }

    return new CTRMemory(
      Buffer.from(this.buffer.subarray(start, end)),
      options
    );
  }

  public steal(): Buffer {
    this.trim();

    const buffer = this.buffer;
    this.deallocate();

    return buffer;
  }

  public write(value: string, options?: CTRMemoryStringWriteOptions): this;

  public write(
    value: Exclude<CTRMemorySource, number>,
    options?: CTRMemoryRawWriteOptions
  ): this;

  public write(
    value: string | bigint | number | CTRMemorySource,
    datatype: CTRMemoryDataType,
    options?: CTRMemoryMix<
      CTRMemoryNumericWriteOptions,
      CTRMemoryMix<CTRMemoryRawWriteOptions, CTRMemoryStringWriteOptions>
    >
  ): this;

  public write(
    value: bigint | CTRMemorySource,
    optionsOrDatatype?:
      | CTRMemoryDataType
      | CTRMemoryMix<CTRMemoryRawWriteOptions, CTRMemoryStringWriteOptions>,
    options?: CTRMemoryMix<
      CTRMemoryNumericWriteOptions,
      CTRMemoryMix<CTRMemoryRawWriteOptions, CTRMemoryStringWriteOptions>
    >
  ): this;

  public write(
    value: bigint | CTRMemorySource,
    _optionsOrDatatype?:
      | CTRMemoryDataType
      | CTRMemoryMix<CTRMemoryRawWriteOptions, CTRMemoryStringWriteOptions>,
    _options?: CTRMemoryMix<
      CTRMemoryNumericWriteOptions,
      CTRMemoryMix<CTRMemoryRawWriteOptions, CTRMemoryStringWriteOptions>
    >
  ): this {
    const options =
      typeof _optionsOrDatatype === "object" ? _optionsOrDatatype : _options;

    const datatype =
      typeof _optionsOrDatatype === "string" ? _optionsOrDatatype : undefined;

    if (datatype !== undefined && typeof value === "bigint") {
      if (datatype === "i64") {
        return this.writeI64(value, options);
      } else if (datatype === "u64") {
        return this.writeU64(value, options);
      }
    } else if (datatype !== undefined && typeof value === "number") {
      if (datatype === "i8") {
        return this.writeI8(value, options);
      } else if (datatype === "u8") {
        return this.writeU8(value, options);
      } else if (datatype === "i16") {
        return this.writeI16(value, options);
      } else if (datatype === "u16") {
        return this.writeU16(value, options);
      } else if (datatype === "i24") {
        return this.writeI24(value, options);
      } else if (datatype === "u24") {
        return this.writeU24(value, options);
      } else if (datatype === "f32") {
        return this.writeF32(value, options);
      } else if (datatype === "i32") {
        return this.writeI32(value, options);
      } else if (datatype === "u32") {
        return this.writeU32(value, options);
      } else if (datatype === "i40") {
        return this.writeI40(value, options);
      } else if (datatype === "u40") {
        return this.writeU40(value, options);
      } else if (datatype === "i48") {
        return this.writeI48(value, options);
      } else if (datatype === "u48") {
        return this.writeU48(value, options);
      } else if (datatype === "i64") {
        return this.writeI64(value, options);
      } else if (datatype === "u64") {
        return this.writeU64(value, options);
      }
    } else if (typeof value === "string") {
      if (datatype === undefined || datatype === "string") {
        return this.writeString(value, options);
      }
    } else if (CTRMemory.isSource(value)) {
      return this.writeRaw(value, options);
    }

    if (datatype === undefined) {
      throw new CTRMemoryInvalidOperationError(
        this,
        value,
        "write",
        null,
        `argument 'datatype' is required when writing a ${typeof value}`
      );
    }

    throw new CTRMemoryInvalidOperationError(
      this,
      value,
      "write",
      datatype,
      `cannot write a ${typeof value} as a ${datatype}`
    );
  }

  public equals(other: CTRMemoryArray, encoding?: CTRMemoryEncoding): boolean {
    return (
      this.compare(
        other,
        undefined,
        undefined,
        undefined,
        undefined,
        encoding
      ) === 0
    );
  }

  public readI8(
    options?: Pick<CTRMemoryNumericReadOptions, "lenient">
  ): number {
    return this._readNumeric("i8", options);
  }

  public readU8(
    options?: Pick<CTRMemoryNumericReadOptions, "lenient">
  ): number {
    return this._readNumeric("u8", options);
  }

  public skip(size: number): this {
    this.offset += size;
    return this;
  }

  public string(options?: CTRMemoryStringReadOptions): string;
  public string(value: string, options?: CTRMemoryStringWriteOptions): this;

  public string(
    valueOrOptions?: string | undefined | CTRMemoryStringReadOptions,
    options?: CTRMemoryStringWriteOptions
  ): this | string;

  public string(
    _valueOrOptions?: string | undefined | CTRMemoryStringReadOptions,
    _options?: CTRMemoryStringWriteOptions
  ): this | string {
    const value =
      typeof _valueOrOptions === "string" ? _valueOrOptions : undefined;
    const options =
      typeof _valueOrOptions === "object" ? _valueOrOptions : _options;

    if (value === undefined) {
      return this.readString(<CTRMemoryStringReadOptions>options);
    }

    return this.writeString(value, options);
  }

  public compare(
    other: CTRMemoryArray,
    targetStart?: number,
    targetEnd?: number,
    sourceStart?: number,
    sourceEnd?: number,
    encoding?: CTRMemoryEncoding
  ): -1 | 0 | 1 {
    other = new CTRMemory(other, encoding).steal();

    return this.buffer.compare(
      other,
      targetStart,
      targetEnd,
      sourceStart,
      sourceEnd
    );
  }

  public readBOM(
    type: CTRMemoryBOMDataType,
    options?: CTRMemoryBOMReadOptions
  ): CTRMemoryEndianness {
    return this.withEndianness("BE", () => {
      let mark: number;

      if (type === "u16") {
        mark = this.readU16({ ...options, endianness: undefined });
      } else if (type === "u32") {
        mark = this.readU32({ ...options, endianness: undefined });
      } else {
        throw new CTRMemoryInvalidOperationError(
          this,
          null,
          "read",
          type,
          `cannot read a BOM as a ${type}`
        );
      }
      if (mark === CTR_MEMORY_BOM_BE) {
        return "BE";
      }

      if (mark === CTR_MEMORY_BOM_LE) {
        return "LE";
      }

      throw new CTRMemoryUnknownBOMMarkError(this, mark);
    });
  }

  public readI16(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("i16", options);
  }

  public readRaw(options?: CTRMemoryBoundedReadBaseOptions): CTRMemory {
    this._lastread = NaN;
    this._lazyalloc();

    const count = options?.count;
    const limit = options?.limit || Infinity;

    if (
      !CTRMemory._validateSizeofOrGrow(
        this,
        1,
        "read",
        "raw",
        count,
        0,
        false,
        options
      )
    ) {
      this._lastread = 0;
      return new CTRMemory([], options);
    }

    const subarray = this.buffer.subarray(
      this._offset,
      this._offset +
        Math.min(
          limit,
          this._size - this._offset,
          count !== undefined ? count : Infinity
        )
    );

    CTRMemory._validateCount(this, count, subarray.length, "read");

    this._lastread = subarray.length;
    this._offset += this._lastread;

    return new CTRMemory(subarray, options);
  }

  public readU16(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("u16", options);
  }

  public readI24(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("i24", options);
  }

  public readU24(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("u24", options);
  }

  public readF32(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("f32", options);
  }

  public readI32(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("i32", options);
  }

  public readU32(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("u32", options);
  }

  public readI40(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("i40", options);
  }

  public readU40(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("u40", options);
  }

  public readI48(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("i48", options);
  }

  public readU48(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("u48", options);
  }

  public readF64(options?: CTRMemoryNumericReadOptions): number {
    return this._readNumeric("f64", options);
  }

  public readI64(options?: CTRMemoryNumericReadOptions): bigint {
    return this._readNumeric("i64", options);
  }

  public readU64(options?: CTRMemoryNumericReadOptions): bigint {
    return this._readNumeric("u64", options);
  }

  public reverse(): this {
    this._lazyalloc();
    this.trim();

    this._memory = this._memory.reverse();
    return this;
  }

  public writeI8(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i8", value, options);
  }

  public allocate(): this {
    this._lazyalloc();
    return this;
  }

  public subarray(
    options?: Omit<CTRMemoryCreateOptions, "fill" | "size" | "source">
  ): CTRMemory;

  public subarray(
    start?: number,
    end?: number,
    options?: Omit<CTRMemoryCreateOptions, "fill" | "size" | "source">
  ): CTRMemory;

  public subarray(
    _optionsOrStart?:
      | number
      | Omit<CTRMemoryCreateOptions, "fill" | "size" | "source">,
    end?: number,
    _options?: Omit<CTRMemoryCreateOptions, "fill" | "size" | "source">
  ): CTRMemory {
    this._lazyalloc();

    const start =
      typeof _optionsOrStart === "number" ? _optionsOrStart : undefined;

    const options =
      typeof _optionsOrStart === "object" ? _optionsOrStart : _options;

    if (end !== undefined) {
      end = Math.min(end, this.length);
    } else if (end === undefined) {
      end = this.length;
    }

    const subarray = this.buffer.subarray(start, end);

    const other = new CTRMemory({
      ...this._options,
      ...options,
      fill: undefined,
      size: undefined,
      source: undefined
    });

    other._allocated = true;
    other._memory = subarray;
    other._size = subarray.length;

    return other;
  }

  public writeU8(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u8", value, options);
  }

  public toString(
    encoding: CTRMemoryEncoding,
    start?: number,
    end?: number
  ): string {
    this._lazyalloc();

    return CTRMemory._decode(
      this,
      this.buffer.subarray(start, end),
      encoding,
      this.endianness
    );
  }

  public writeBOM(
    type: CTRMemoryBOMDataType,
    order?: CTRMemoryEndianness,
    options?: CTRMemoryBOMWriteOptions
  ): this {
    const mark =
      (order || this._options.endianness) === "BE"
        ? CTR_MEMORY_BOM_BE
        : CTR_MEMORY_BOM_LE;

    return this.withEndianness("BE", () => {
      if (type === "u16") {
        this.writeU16(mark, { ...options, endianness: undefined });
      } else if (type === "u32") {
        this.writeU32(mark, { ...options, endianness: undefined });
      } else {
        throw new CTRMemoryInvalidOperationError(
          this,
          mark,
          "write",
          type,
          `cannot write a BOM as a ${type}`
        );
      }

      return this;
    });
  }

  public writeI16(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i16", value, options);
  }

  public writeRaw(
    value: CTRMemorySource,
    options?: CTRMemoryRawWriteOptions
  ): this {
    this._lastwritten = NaN;
    this._lazyalloc();

    const start = this._offset;
    const count = options?.count;
    const limit = options?.limit || Infinity;
    const partial = Boolean(options?.partial);

    const encoding =
      options?.encoding !== undefined
        ? options.encoding
        : this._options.encoding;

    const data = Buffer.from(
      CTRMemory._source(this, value, encoding, this.endianness)
    );
    const subarray = data.subarray(0, Math.min(limit, data.length));

    if (
      (!partial || count !== undefined) &&
      !CTRMemory._validateSizeofOrGrow(
        this,
        subarray.length,
        "write",
        "raw",
        count,
        0,
        true,
        options
      )
    ) {
      this._lastwritten = 0;
      return this;
    }

    let written = subarray.copy(this._memory, this._offset);
    this._lastwritten = written;

    if (this._offset + written > this._size) {
      this._size = this._offset + written;
    }

    this._offset += this._lastwritten;

    const padding =
      options?.padding !== undefined ? options.padding : undefined;

    if (
      count !== undefined &&
      padding !== undefined &&
      this._offset - start < count
    ) {
      const size = count - this._offset - start;

      if (
        !CTRMemory._validateSizeofOrGrow(
          this,
          size,
          "write",
          "string",
          count,
          this._lastwritten,
          true,
          options
        )
      ) {
        return this;
      }

      this._memory.fill(
        CTRMemory._source(this, padding, encoding, this.endianness),
        this._offset,
        this._offset + size
      );

      if (this._offset + size > this._size) {
        this._size = this._offset + size;
      }

      this._lastwritten += size;
      this._offset += size;
    }

    CTRMemory._validateCount(this, count, this._lastwritten, "write");
    return this;
  }

  public writeU16(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u16", value, options);
  }

  public writeI24(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i24", value, options);
  }

  public writeU24(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u24", value, options);
  }

  public writeF32(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("f32", value, options);
  }

  public writeI32(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i32", value, options);
  }

  public writeU32(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u32", value, options);
  }

  public writeI40(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i40", value, options);
  }

  public writeU40(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u40", value, options);
  }

  public writeI48(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("i48", value, options);
  }

  public writeU48(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("u48", value, options);
  }

  public writeF64(value: number, options?: CTRMemoryNumericWriteOptions): this {
    return this._writeNumeric("f64", value, options);
  }

  public writeI64(
    value: bigint | number,
    options?: CTRMemoryNumericWriteOptions
  ): this {
    return this._writeNumeric("i64", value, options);
  }

  public writeU64(
    value: bigint | number,
    options?: CTRMemoryNumericWriteOptions
  ): this {
    return this._writeNumeric("u64", value, options);
  }

  public deallocate(): void {
    this._check();

    this._size = 0;
    this._used = true;
    this._offset = NaN;
    this._lastread = NaN;
    this._allocated = false;
    this._lastwritten = NaN;
    this._options = <any>null;
    this._lazyoptions = <any>null;
    this._memory = CTR_MEMORY_EMPTY;
  }

  public readString(options?: CTRMemoryStringReadOptions): string {
    this._lastread = NaN;
    this._lazyalloc();

    const start = this._offset;
    const count = options?.count;

    if (
      !CTRMemory._validateSizeofOrGrow(
        this,
        1,
        "read",
        "string",
        count,
        0,
        false,
        options
      )
    ) {
      this._lastread = 0;
      return "";
    }

    let string: string;

    const limit = options?.limit || Infinity;
    const encoding = options?.encoding || this._options.encoding;
    const endianness = options?.endianness || this._options.endianness;

    if (count === undefined) {
      const chunks = options?.chunks || Infinity;

      const _terminator =
        options?.terminator !== undefined
          ? options?.terminator
          : this._options.terminator;

      const terminator =
        _terminator === true
          ? CTR_MEMORY_DEFAULT_TERMINATOR
          : _terminator === false
            ? undefined
            : _terminator;

      if (terminator === undefined) {
        throw new CTRMemoryInvalidOperationError(
          this,
          null,
          "read",
          "string",
          "unable to read string; terminator is undefined but count was not given"
        );
      }

      string = "";

      while (this._offset < this.capacity && this._offset - start < limit) {
        const end =
          this._offset + Math.min(limit, chunks, this.capacity - this._offset);

        const subarray = this._memory.subarray(this._offset, end);
        const chunk = CTRMemory._decode(this, subarray, encoding, endianness);
        const terminatorIndex = chunk.indexOf(terminator);

        if (terminatorIndex !== -1) {
          const substring = chunk.slice(0, terminatorIndex);
          string += substring;

          this._offset += CTRMemory._encode(
            this,
            substring + terminator,
            encoding,
            endianness
          ).length;

          break;
        }

        string += chunk;
        this._offset += subarray.length;
      }
    } else {
      const subarray = this._memory.subarray(
        this._offset,
        this._offset + Math.min(count, limit)
      );

      this._offset += subarray.length;
      CTRMemory._validateCount(this, count, subarray.length, "read");

      string = CTRMemory._decode(this, subarray, encoding, endianness);
    }

    const strip = options?.strip !== undefined ? options?.strip : true;
    this._lastread = this._offset - start;

    if (strip === true) {
      return string.replace(/\0*$/, "");
    } else if (strip) {
      if (typeof strip === "string") {
        return string.replace(new RegExp(`${strip}*$`), "");
      }

      return string.replace(strip, "");
    }

    return string;
  }

  public reallocate(size?: number): this {
    if (size === undefined) {
      size = this.capacity;
    }

    this._lazyalloc();
    this._reallocate(size);

    this._size = size;
    return this;
  }

  public writeString(
    value: string,
    options?: CTRMemoryStringWriteOptions
  ): this {
    this._lastwritten = NaN;
    this._lazyalloc();

    const start = this._offset;
    const count = options?.count;
    const limit = options?.limit || Infinity;
    const partial = Boolean(options?.partial);
    const endianness = options?.endianness || this.endianness;
    const encoding = options?.encoding || this._options.encoding;
    const _terminator = options?.terminator || this._options.terminator;

    const terminator =
      typeof _terminator === "boolean"
        ? _terminator === true
          ? Buffer.from(
              CTRMemory._source(
                this,
                CTR_MEMORY_DEFAULT_TERMINATOR,
                encoding,
                endianness
              )
            )
          : undefined
        : Buffer.from(
            CTRMemory._source(this, _terminator, encoding, endianness)
          );

    const terminatorsize = terminator !== undefined ? terminator.length : 0;
    const buffer = CTRMemory._encode(this, value, encoding, endianness);

    const subarray = buffer.subarray(
      0,
      Math.min(limit - terminatorsize, buffer.length)
    );

    if (
      (!partial || count !== undefined) &&
      !CTRMemory._validateSizeofOrGrow(
        this,
        subarray.length + terminatorsize,
        "write",
        "string",
        count,
        0,
        true,
        options
      )
    ) {
      this._lastwritten = 0;
      return this;
    }

    let written = subarray.copy(this._memory, this._offset);

    if (this._offset + written > this._size) {
      this._size = this._offset + written;
    }

    this._offset += written;
    this._lastwritten = written;

    if (terminator !== undefined) {
      written = terminator.copy(this._memory, this._offset);

      if (this._offset + written > this._size) {
        this._size = this._offset + written;
      }

      this._offset += written;
      this._lastwritten += written;
    }

    const padding =
      options?.padding !== undefined ? options.padding : undefined;

    if (
      count !== undefined &&
      padding !== undefined &&
      this._offset - start < count
    ) {
      const size = count - this._lastwritten;

      if (
        !CTRMemory._validateSizeofOrGrow(
          this,
          size,
          "write",
          "string",
          count,
          this._lastwritten,
          true,
          options
        )
      ) {
        return this;
      }

      this._memory.fill(
        CTRMemory._source(this, padding, encoding, endianness),
        this._offset,
        this._offset + size
      );

      if (this._offset + size > this._size) {
        this._size = this._offset + size;
      }

      this._offset += size;
      this._lastwritten += size;
    }

    CTRMemory._validateCount(this, count, this._lastwritten, "write");
    return this;
  }

  public withEndianness<T>(
    endianness: CTRMemoryEndianness,
    fn: (buf: this) => T
  ): T {
    this._check();

    const oldEndianness = this._options.endianness;
    this._options.endianness = CTRMemory.normalizeEndianness(this, endianness);

    try {
      return fn(this);
    } finally {
      this._options.endianness = oldEndianness;
    }
  }

  public _grow(size: number): this {
    this._lazyalloc();

    if (this.capacity >= size) {
      return this;
    }

    this._reallocate(
      Math.max(size, Math.ceil(this.capacity * this._options.growth))
    );

    return this;
  }

  private _init(
    size: number | undefined,
    encoding: CTRMemoryEncoding,
    source: undefined | CTRMemorySource,
    options: CTRMemoryCreateOptions
  ): void {
    if (options.growth !== undefined) {
      this.growth = options.growth;
    }

    if (options.lenient !== undefined) {
      this.lenient = options.lenient;
    }

    if (options.terminator !== undefined) {
      this.terminator = options.terminator;
    }

    if (options.endianness !== undefined) {
      this.endianness = options.endianness;
    }

    if (options.encoding !== undefined) {
      this.encoding = options.encoding;
    }

    this._lazyoptions = {};
    this._lazyoptions.size = size;
    this._lazyoptions.fill = options.fill;

    if (source !== undefined) {
      const sourcebuf = CTRMemory._source(
        this,
        source,
        encoding,
        this.endianness
      );

      const terminatorbuf = CTRMemory.isSource(this.terminator)
        ? CTRMemory._source(this, this.terminator, encoding, this.endianness)
        : this.terminator === true
          ? CTRMemory._source(
              this,
              CTR_MEMORY_DEFAULT_TERMINATOR,
              encoding,
              this.endianness
            )
          : new Uint8Array();

      const buffer = Buffer.concat([sourcebuf, terminatorbuf]);

      if (this._lazyoptions.size === undefined) {
        this._lazyoptions.size = buffer.length;
      }

      this._lazyalloc();

      this._memory.fill(
        buffer,
        0,
        Math.min(buffer.length, this._memory.length)
      );
    }

    if (options.offset !== undefined) {
      this.seek(options.offset);
    }
  }

  private _check(): void {
    if (this._used) {
      throw new CTRMemoryUsedError(this);
    }
  }

  private _lazyalloc(): Buffer {
    this._check();

    if (!this._allocated) {
      this._reallocate(this._lazyoptions?.size || 0);
      const fill = this._lazyoptions?.fill;

      if (fill !== undefined) {
        this._memory.fill(
          CTRMemory._source(this, fill, this._options.encoding, this.endianness)
        );
      }

      this._size = this._lazyoptions?.size || 0;
      this._lazyoptions = null;
      this._allocated = true;
    }

    return this._memory;
  }

  private _readNumeric(
    type: "i64" | "u64",
    options?: CTRMemoryNumericReadOptions
  ): bigint;

  private _readNumeric(
    type: Exclude<CTRMemoryDataType, "raw" | "string">,
    options?: CTRMemoryNumericReadOptions
  ): number;

  private _readNumeric(
    type: Exclude<CTRMemoryDataType, "raw" | "string">,
    options?: CTRMemoryNumericReadOptions
  ): bigint | number {
    this._lastread = NaN;
    this._lazyalloc();

    const sizeof = CTRMemory.sizeof(type);

    if (
      !CTRMemory._validateSizeofOrGrow(
        this,
        sizeof,
        "read",
        type,
        undefined,
        0,
        false,
        options
      )
    ) {
      this._lastread = 0;
      return 0;
    }

    const endianness =
      options?.endianness !== undefined
        ? CTRMemory.normalizeEndianness(this, options.endianness)
        : this._options.endianness;

    let read: bigint | number;

    if (type === "i64") {
      read = (
        endianness === "BE"
          ? this.buffer.readBigInt64BE
          : this.buffer.readBigInt64LE
      ).bind(this.buffer)(this._offset);
    } else if (type === "u64") {
      read = (
        endianness === "BE"
          ? this.buffer.readBigUInt64BE
          : this.buffer.readBigUInt64LE
      ).bind(this.buffer)(this._offset);
    } else if (type === "f64") {
      read = (
        endianness === "BE"
          ? this.buffer.readDoubleBE
          : this.buffer.readDoubleLE
      ).bind(this.buffer)(this._offset);
    } else if (type === "f32") {
      read = (
        endianness === "BE" ? this.buffer.readFloatBE : this.buffer.readFloatLE
      ).bind(this.buffer)(this._offset);
    } else if (type.startsWith("i")) {
      read = (
        endianness === "BE" ? this.buffer.readIntBE : this.buffer.readIntLE
      ).bind(this.buffer)(this._offset, sizeof);
    } else {
      read = (
        endianness === "BE" ? this.buffer.readUIntBE : this.buffer.readUIntLE
      ).bind(this.buffer)(this._offset, sizeof);
    }

    this._lastread = sizeof;
    this._offset += this._lastread;

    return read;
  }

  private _reallocate(size: number): void {
    this._check();

    if (!Number.isInteger(size)) {
      throw new CTRMemoryOutOfRangeError(
        this,
        size,
        null,
        [1, CTRMemory.MAX_LENGTH],
        `expected size to be an integer but got ${size} instead`
      );
    }

    if (size < 0 || size > MAX_LENGTH) {
      throw new CTRMemoryOutOfRangeError(
        this,
        size,
        null,
        [1, CTRMemory.MAX_LENGTH],
        `size must be between 0 and ${MAX_LENGTH} but got ${size} instead`
      );
    }

    try {
      const other = Buffer.allocUnsafe(size);

      this._memory.copy(other);
      this._memory = other;
    } catch (err) {
      throw new CTRMemoryError(
        this,
        CTRMemoryError.ERR_OUT_OF_MEMORY,
        "ran out of memory",
        err
      );
    }
  }

  private _writeNumeric(
    type: Exclude<CTRMemoryDataType, "raw" | "string">,
    value: bigint | number,
    options?: CTRMemoryNumericWriteOptions
  ): this {
    this._lastwritten = NaN;
    this._lazyalloc();

    CTRMemory._validateRange(this, type, value);

    const sizeof = CTRMemory.sizeof(type);

    if (
      !CTRMemory._validateSizeofOrGrow(
        this,
        sizeof,
        "write",
        type,
        undefined,
        0,
        true,
        options
      )
    ) {
      this._lastwritten = 0;
      return this;
    }

    const endianness = options?.endianness || this._options.endianness;

    if (type === "i64") {
      endianness === "BE"
        ? this._memory.writeBigInt64BE(<bigint>value, this._offset)
        : this._memory.writeBigInt64LE(<bigint>value, this._offset);
    } else if (type === "u64") {
      endianness === "BE"
        ? this._memory.writeBigUInt64BE(<bigint>value, this._offset)
        : this._memory.writeBigUInt64LE(<bigint>value, this._offset);
    } else if (type === "f32") {
      endianness === "BE"
        ? this._memory.writeFloatBE(<number>value, this._offset)
        : this._memory.writeFloatLE(<number>value, this._offset);
    } else if (type === "f64") {
      endianness === "BE"
        ? this._memory.writeDoubleBE(<number>value, this._offset)
        : this._memory.writeDoubleLE(<number>value, this._offset);
    } else if (type.startsWith("i")) {
      endianness === "BE"
        ? this._memory.writeIntBE(<number>value, this._offset, sizeof)
        : this._memory.writeIntLE(<number>value, this._offset, sizeof);
    } else {
      endianness === "BE"
        ? this._memory.writeUIntBE(<number>value, this._offset, sizeof)
        : this._memory.writeUIntLE(<number>value, this._offset, sizeof);
    }

    this._lastwritten = sizeof;

    if (this._offset + this._lastwritten > this._size) {
      this._size = this._offset + this._lastwritten;
    }

    this._offset += this._lastwritten;
    return this;
  }
}

export { CTRMemory, CTRMemory as Memory };

export type {
  CTRMemoryArray,
  CTRMemoryArray as MemoryArray,
  CTRMemorySource,
  CTRMemorySource as MemorySource,
  CTRMemoryDataType,
  CTRMemoryDataType as MemoryDataType,
  CTRMemoryEncoding,
  CTRMemoryEncoding as MemoryEncoding,
  CTRMemoryEndianness,
  CTRMemoryEndianness as MemoryEndianness,
  CTRMemoryBOMDataType,
  CTRMemoryBOMDataType as MemoryBOMDataType,
  CTRMemoryBOMReadOptions,
  CTRMemoryBOMReadOptions as MemoryBOMReadOptions,
  CTRMemoryRawReadOptions,
  CTRMemoryRawReadOptions as MemoryRawReadOptions,
  CTRMemoryBOMWriteOptions,
  CTRMemoryBOMWriteOptions as MemoryBOMWriteOptions,
  CTRMemoryRawWriteOptions,
  CTRMemoryRawWriteOptions as MemoryRawWriteOptions,
  CTRMemoryStringReadOptions,
  CTRMemoryStringReadOptions as MemoryStringReadOptions,
  CTRMemoryNumericReadOptions,
  CTRMemoryNumericReadOptions as MemoryNumericReadOptions,
  CTRMemoryStringWriteOptions,
  CTRMemoryStringWriteOptions as MemoryStringWriteOptions,
  CTRMemoryNumericWriteOptions,
  CTRMemoryNumericWriteOptions as MemoryNumericWriteOptions
};
