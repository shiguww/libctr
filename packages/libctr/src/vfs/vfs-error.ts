import { CTRError } from "@libctr/error";
import type { CTRVFSDirectory, CTRVFSNode } from "#vfs/vfs";

type CTRVFSErrorCode =
  | typeof CTRVFSError.ERR_UNKNOWN
  | typeof CTRVFSError.ERR_MISSING_FILE
  | typeof CTRVFSError.ERR_ALREADY_EXISTS;

abstract class CTRVFSError extends CTRError {
  public static readonly ERR_UNKNOWN = "vfs.err_unknown";
  public static readonly ERR_MISSING_FILE = "vfs.err_missing_file";
  public static readonly ERR_ALREADY_EXISTS = "vfs.err_already_exists";

  public override readonly code: CTRVFSErrorCode;

  public constructor(
    code: null | undefined | CTRVFSErrorCode,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);
    this.code = code || CTRVFSError.ERR_UNKNOWN;
  }
}

class CTRVFSMissingFileError extends CTRVFSError {
  public readonly path: string;
  public readonly target: CTRVFSDirectory;
  public override readonly code: typeof CTRVFSError.ERR_MISSING_FILE;

  public constructor(
    path: string,
    target: CTRVFSDirectory,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.path = path;
    this.target = target;
    this.code = CTRVFSError.ERR_MISSING_FILE;
  }
}

class CTRVFSAlreadyExistsError extends CTRVFSError {
  public readonly node: CTRVFSNode;
  public readonly target: CTRVFSDirectory;
  public override readonly code: typeof CTRVFSError.ERR_ALREADY_EXISTS;

  public constructor(
    node: CTRVFSNode,
    target: CTRVFSDirectory,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.node = node;
    this.target = target;
    this.code = CTRVFSError.ERR_ALREADY_EXISTS;
  }
}

export {
  CTRVFSError,
  CTRVFSError as VFSError,
  CTRVFSMissingFileError,
  CTRVFSMissingFileError as VFSMissingFileError,
  CTRVFSAlreadyExistsError,
  CTRVFSAlreadyExistsError as VFSAlreadyExistsError
};

export type { CTRVFSErrorCode, CTRVFSErrorCode as VFSErrorCode };
