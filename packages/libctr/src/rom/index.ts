export {
  readROM,
  readEXEFS,
  readROMFS,
  readROM as read,
  CTRROMListener as Listener
} from "#rom/rom";

export type { CTRROM as ROM, CTRReadROMOptions as ReadOptions } from "#rom/rom";

export {
  CTRROMError as Error,
  CTRROMUnsupportedFormatError as UnsupportedFormatError
} from "#rom/rom-error";

export type {
  CTRROMErrorCode as ErrorCode,
  CTRROMErrorMetadata as ErrorMetadata,
  CTRROMUnsupportedFormatErrorMetadata as UnsupportedFormatErrorMetadata
} from "#rom/rom-error";
