import { CTRError } from "@libctr/error";

type CTRROMErrorCode =
  | typeof CTRROMError.ERR_READ
  | typeof CTRROMError.ERR_UNKNOWN_FORMAT;

class CTRROMError extends CTRError {
  public static readonly ERR_READ = "rom.err_read";
  public static readonly ERR_UNKNOWN_FORMAT = "rom.err_unknown_format";

  public constructor(code: CTRROMErrorCode, message?: string, cause?: unknown) {
    super(code, message, cause);
  }
}

class CTRROMUnknownFormatError extends CTRError {
  private static _makeMessage(
    message: string | undefined,
    format: null | string
  ): string {
    if (message !== undefined) {
      return message;
    }

    return `unsupported format '${format}'`;
  }

  public readonly format: null | string;

  public constructor(
    code: CTRROMErrorCode,
    format: null | string,
    message?: string,
    cause?: unknown
  ) {
    super(code, CTRROMUnknownFormatError._makeMessage(message, format), cause);
    this.format = format;
  }
}

export {
  CTRROMError,
  CTRROMError as ROMError,
  CTRROMUnknownFormatError,
  CTRROMUnknownFormatError as ROMUnknownFormatError
};

export type { CTRROMErrorCode, CTRROMErrorCode as ROMErrorCode };
