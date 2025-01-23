export {
  readROM,
  readEXEFS,
  readROMFS,
  readROM as read,
  CTRROMListener as Listener
} from "#rom/rom";

export type { CTRROM as ROM, CTRReadROMOptions as ReadOptions } from "#rom/rom";

export { CTRROMError as Error } from "#rom/rom-error";
export type { CTRROMErrorCode as ErrorCode } from "#rom/rom-error";
