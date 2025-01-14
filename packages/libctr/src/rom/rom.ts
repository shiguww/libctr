import path from "node:path";
import fs from "node:fs/promises";
import type { CTRVFSNode } from "#vfs/vfs";
import { CTRVFS, CTRVFSDirectoryListener } from "#vfs/vfs";
import { CTRROMUnsupportedFormatError } from "#rom/rom-error";
import { CTREventEmitter } from "#event-emitter/event-emitter";
import type { CTREventEmitterDefaultEventMap } from "#event-emitter/event-emitter";

interface CTRROM {
  exefs: null | CTRVFS;
  romfs: null | CTRVFS;
}

interface CTRReadROMOptions {
  exefs?: null | string;
  romfs?: null | string;
  listener?: CTRROMListener;
}

function _throwFormatError(
  rompath: string,
  message?: string,
  cause?: unknown
): never {
  let format: null | string = path.extname(rompath);
  format = format === "" ? null : format;

  throw new CTRROMUnsupportedFormatError({ format }, message, cause);
}

class CTRROMListener extends CTREventEmitter<
  CTREventEmitterDefaultEventMap &
    Record<`${"exefs" | "romfs"}.${"end" | "start"}`, [null]> &
    Record<`${"exefs" | "romfs"}.node.${"end" | "start"}`, [CTRVFSNode]>
> {}

async function readROM(options: CTRReadROMOptions): Promise<CTRROM> {
  let romfs: null | CTRVFS = null;
  let exefs: null | CTRVFS = null;

  const exefspath = options.exefs;
  const romfspath = options.romfs;
  const listener = options.listener;
  const exefsstat = typeof exefspath === "string" && (await fs.stat(exefspath));
  const romfsstat = typeof romfspath === "string" && (await fs.stat(romfspath));

  if(exefsstat) {
    listener?.emit("exefs.start", null);

    if(exefsstat.isDirectory()) {
      exefs = await CTRVFS.fromDirectory(
        exefspath,
        "exefs",
        null,
        new CTRVFSDirectoryListener()
          .on(
            "read.node.end",
            ({ node }) => void listener?.emit("exefs.node.end", node)
          )
          .on(
            "read.node.start",
            ({ node }) => void listener?.emit("exefs.node.start", node)
          )
      );
    }

    if(exefs === null) {
      // TODO: parse exefs and romfs from a file (ie, NCCH)
      _throwFormatError(exefspath);
    }

    listener?.emit("exefs.end", null);
  }

  if(romfsstat) {
    listener?.emit("romfs.start", null);

    if(romfsstat.isDirectory()) {
      romfs = await CTRVFS.fromDirectory(
        romfspath,
        "romfs",
        null,
        new CTRVFSDirectoryListener()
          .on(
            "read.node.end",
            ({ node }) => void listener?.emit("romfs.node.end", node)
          )
          .on(
            "read.node.start",
            ({ node }) => void listener?.emit("romfs.node.start", node)
          )
      );
    }

    if(romfs === null) {
      // TODO: parse exefs and romfs from a file (ie, NCCH)
      _throwFormatError(romfspath);
    }

    listener?.emit("romfs.end", null);
  }

  return { exefs, romfs };
}

async function readEXEFS(
  exefs: string,
  listener?: CTRROMListener
): Promise<CTRVFS> {
  const rom = await readROM({ exefs, listener });

  if (rom.exefs === null) {
    _throwFormatError(exefs);
  }

  return rom.exefs;
}

async function readROMFS(
  romfs: string,
  listener?: CTRROMListener
): Promise<CTRVFS> {
  const rom = await readROM({ romfs, listener });

  if (rom.romfs === null) {
    _throwFormatError(romfs);
  }

  return rom.romfs;
}

export {
  readROM,
  readEXEFS,
  readROMFS,
  CTRROMListener,
  CTRROMListener as ROMListener
};

export type {
  CTRROM,
  CTRROM as ROM,
  CTRReadROMOptions,
  CTRReadROMOptions as ReadROMOptions
};
