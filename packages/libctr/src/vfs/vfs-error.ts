import { CTRError } from "@libctr/error";
import type { CTRVFSNode } from "#vfs/vfs";

type CTRVFSErrorCode = typeof CTRVFSError.ERR_ALREADY_EXISTS;

interface CTRVFSErrorMetadata {
  child?: CTRVFSNode;
  parent?: CTRVFSNode;
}

class CTRVFSError<
  C extends CTRVFSErrorCode = CTRVFSErrorCode,
  M extends CTRVFSErrorMetadata = CTRVFSErrorMetadata
> extends CTRError<C, M> {
  public static is<C extends CTRVFSErrorCode>(
    value: unknown,
    code?: C
  ): value is CTRVFSError<C> {
    return (
      value instanceof CTRVFSError &&
      (code === undefined || value.code === code)
    );
  }

  public static readonly ERR_ALREADY_EXISTS = "vfs.err_already_exists";
}

interface CTRVFSAlreadyExistsErrorMetadata
  extends Required<CTRVFSErrorMetadata> {}

class CTRVFSAlreadyExistsError extends CTRVFSError<
  typeof CTRVFSError.ERR_ALREADY_EXISTS,
  CTRVFSAlreadyExistsErrorMetadata
> {
  public constructor(
    metadata: CTRVFSAlreadyExistsErrorMetadata,
    message?: string,
    cause?: unknown
  ) {
    super(
      CTRVFSError.ERR_ALREADY_EXISTS,
      metadata,
      message ||
        `'${metadata.child.name}' already exists${metadata.parent.path && ` in '${metadata.parent.path}'`}`,
      cause
    );
  }
}

export {
  CTRVFSError,
  CTRVFSError as VFSError,
  CTRVFSAlreadyExistsError,
  CTRVFSAlreadyExistsError as VFSAlreadyExistsError
};

export type {
  CTRVFSErrorCode,
  CTRVFSErrorCode as VFSErrorCode,
  CTRVFSErrorMetadata,
  CTRVFSErrorMetadata as VFSErrorMetadata,
  CTRVFSAlreadyExistsErrorMetadata,
  CTRVFSAlreadyExistsErrorMetadata as VFSAlreadyExistsErrorMetadata
};
