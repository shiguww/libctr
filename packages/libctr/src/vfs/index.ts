export {
  CTRVFS as VFS,
  CTRVFSFile as File,
  CTRVFSDirectory as Directory
} from "#vfs/vfs";

export type {
  CTRVFSNode as Node,
  CTRVFSNodeKind as NodeKind,
  CTRVFSDirectoryListener as DirectoryListener,
  CTRVFSDirectoryMergeMode as DirectoryMergeMode,
  CTRVFSDirectoryAppendMode as DirectoryAppendMode,
  CTRVFSDirectoryAppendOptions as DirectoryAppendOptions
} from "#vfs/vfs";

export { CTRVFSError as Error } from "#vfs/vfs-error";

export type {
  CTRVFSErrorCode as ErrorCode,
  CTRVFSErrorMetadata as ErrorMetadata,
  CTRVFSAlreadyExistsErrorMetadata as AlreadyExistsErrorMetadata
} from "#vfs/vfs-error";
