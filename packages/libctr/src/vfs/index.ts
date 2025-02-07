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

export {
  CTRVFSError as Error,
  CTRVFSMissingFileError as MissingFileError,
  CTRVFSAlreadyExistsError as AlreadyExistsError
} from "#vfs/vfs-error";

export type { CTRVFSErrorCode as ErrorCode } from "#vfs/vfs-error";
