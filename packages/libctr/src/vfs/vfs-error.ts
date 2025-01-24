import { CTRError } from "@libctr/error";
import type { CTRVFSDirectory, CTRVFSNode } from "#vfs/vfs";

type CTRVFSErrorCode =
  | typeof CTRVFSError.ERR_UNKNOWN
  | typeof CTRVFSError.ERR_ALREADY_EXISTS;

class CTRVFSError extends CTRError {
  public static readonly ERR_UNKNOWN = "vfs.err_unknown";
  public static readonly ERR_ALREADY_EXISTS = "vfs.err_already_exists";

  public readonly node: CTRVFSNode;
  public readonly target: CTRVFSDirectory;
  public override readonly code: CTRVFSErrorCode;

  public constructor(
    code: null | undefined | CTRVFSErrorCode,
    node: CTRVFSNode,
    target: CTRVFSDirectory,
    message?: string,
    cause?: unknown
  ) {
    super(null, message, cause);

    this.node = node;
    this.target = target;
    this.code = code || CTRVFSError.ERR_UNKNOWN;
  }
}

export { CTRVFSError, CTRVFSError as VFSError };
export type { CTRVFSErrorCode, CTRVFSErrorCode as VFSErrorCode };
