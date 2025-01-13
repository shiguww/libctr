import { CTRError } from "@libctr/error";

type CTRROMErrorCode = typeof CTRROMError.ERR_UNSUPPORTED_FORMAT;

interface CTRROMErrorMetadata {
  format: null | string;
}

class CTRROMError<
  C extends CTRROMErrorCode,
  M extends CTRROMErrorMetadata
> extends CTRError<C, M> {
  public static readonly ERR_UNSUPPORTED_FORMAT = "rom.err_unsupported_format";
}

interface CTRROMUnsupportedFormatErrorMetadata
  extends Pick<CTRROMErrorMetadata, "format"> {}

class CTRROMUnsupportedFormatError extends CTRROMError<
  typeof CTRROMError.ERR_UNSUPPORTED_FORMAT,
  CTRROMUnsupportedFormatErrorMetadata
> {
  public constructor(
    metadata: CTRROMUnsupportedFormatErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(CTRROMError.ERR_UNSUPPORTED_FORMAT, metadata, message, cause);
  }
}

export {
  CTRROMError,
  CTRROMError as ROMError,
  CTRROMUnsupportedFormatError,
  CTRROMUnsupportedFormatError as ROMUnsupportedFormatError
};

export type {
  CTRROMErrorCode,
  CTRROMErrorCode as ROMErrorCode,
  CTRROMErrorMetadata,
  CTRROMErrorMetadata as ROMErrorMetadata,
  CTRROMUnsupportedFormatErrorMetadata,
  CTRROMUnsupportedFormatErrorMetadata as ROMUnsupportedFormatErrorMetadata
};
