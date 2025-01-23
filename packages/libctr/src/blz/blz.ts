import type { CTRMemoryArray } from "@libctr/memory";
import { CTRMemory, CTRMemoryOOBError } from "@libctr/memory";
import { CTRBLZError, CTRBLZFormatError } from "#blz/blz-error";

const BLZ_SHIFT = 1;
const BLZ_MASK = 0x80;
const BLZ_THRESHOLD = 2;

const BLZ_HDR_MAX = 0x0b;
const BLZ_HDR_MIN = 0x08;
const BLZ_MAX = 0x01400000;
const BLZ_MIN = 0x00000008;
const BLZ_RAW_MAX = 0x00ffffff;

function decode(_buffer: CTRMemoryArray): CTRMemory {
  const buffer = new CTRMemory(_buffer);
  buffer.endianness = "LE";

  try {
    return _decode(buffer);
  } catch (err) {
    throw _decodeerr(buffer, err);
  }
}

function encode(_buffer: CTRMemoryArray): CTRMemory {
  const buffer = new CTRMemory(_buffer);
  buffer.endianness = "LE";

  try {
    return _encode(buffer);
  } catch (err) {
    throw _encodeerr(buffer, err);
  }
}

function _decode(buffer: CTRMemory): CTRMemory {
  if (buffer.length < BLZ_MIN) {
    throw new CTRBLZError(CTRBLZError.ERR_BUFFER_TOO_SMALL);
  }

  if (buffer.length > BLZ_MAX) {
    throw new CTRBLZError(CTRBLZError.ERR_BUFFER_TOO_LARGE);
  }

  const inc = buffer.at(-4, "u32");

  if (inc === 0) {
    throw new CTRBLZError(CTRBLZError.ERR_NOT_A_BLZ_FILE);
  }

  const hdr = buffer.at(-5, "u8");

  if (hdr < BLZ_HDR_MIN || hdr > BLZ_HDR_MAX) {
    throw new CTRBLZError(CTRBLZError.ERR_INVALID_HEADER);
  }

  const enc = buffer.at(-8, "u24");
  const dec = buffer.length - enc;
  const raw = new CTRMemory(dec + enc + inc);
  const pak = buffer.subarray(0, dec + enc - hdr);

  if (raw.length > BLZ_RAW_MAX) {
    throw new CTRBLZError(CTRBLZError.ERR_INVALID_HEADER);
  }

  for (let i = 0; i < dec; i += 1) {
    raw.u8(pak.u8());
  }

  pak.subarray(dec, pak.length).reverse();

  let mask = 0;
  let flags = 0;

  while (!raw.ended) {
    mask >>= BLZ_SHIFT;

    if (mask === 0) {
      flags = pak.u8();
      mask = BLZ_MASK;
    }

    if (flags & mask) {
      let pos = pak.u8() << 8;
      pos |= pak.u8();

      const len = (pos >> 12) + BLZ_THRESHOLD + 1;

      if (raw.offset + len > raw.length) {
        throw new CTRBLZError(CTRBLZError.ERR_MALFORMED_FILE);
      }

      pos = (pos & 0xfff) + 3;

      for (let i = 0; i < len; i += 1) {
        raw.u8(raw.at(raw.offset - pos, "u8"));
      }
    } else {
      raw.u8(pak.u8());
    }
  }

  raw.subarray(dec, raw.size).reverse();
  return raw.seek(0);
}

function _encode(raw: CTRMemory): CTRMemory {
  if (raw.length > BLZ_RAW_MAX) {
    throw new CTRBLZError(CTRBLZError.ERR_BUFFER_TOO_LARGE);
  }

  let paktmp = 0;
  let rawtmp = raw.length;

  const pak = new CTRMemory(
    Math.trunc(raw.length + (raw.length + 7) / 8 + 11),
    {
      growth: false
    }
  );

  let flg = 0;
  let mask = 0;

  raw.reverse();

  while (!raw.ended) {
    mask >>= BLZ_SHIFT;

    if (mask === 0) {
      flg = pak.offset;

      pak.u8();
      pak.at(flg, () => pak.u8(0));

      mask = BLZ_MASK;
    }

    const [lenbest, posbest] = _search(raw);
    pak.at(flg, () => pak.u8(pak.at(flg, "u8") << 1));

    if (lenbest > BLZ_THRESHOLD) {
      raw.offset += lenbest;

      pak.at(flg, () => pak.u8(pak.at(flg, "u8") | 1));
      pak.u8(((lenbest - (BLZ_THRESHOLD + 1)) << 4) | ((posbest - 3) >> 8));
      pak.u8((posbest - 3) & 0xff);
    } else {
      pak.u8(raw.u8());
    }

    if (pak.offset + raw.length - raw.offset < paktmp + rawtmp) {
      paktmp = pak.offset;
      rawtmp = raw.length - raw.offset;
    }
  }

  while (mask && mask !== 1) {
    mask >>= BLZ_SHIFT;
    pak.at(flg, () => pak.u8(pak.at(flg, "u8") << 1));
  }

  const _pakoffset = pak.offset;

  raw.reverse();
  pak.subarray(0, _pakoffset).reverse();

  if (paktmp === 0 || raw.length + 4 < ((paktmp + rawtmp + 3) & -4) + 8) {
    pak.seek(0);
    raw.seek(0);

    while (!raw.ended) {
      pak.u8(raw.u8());
    }

    while (pak.offset & 3) {
      pak.u8(0);
    }

    pak.u32(0);
    return pak.subarray(0, pak.offset);
  }

  const out = new CTRMemory(rawtmp + paktmp + 11, { growth: false });

  for (let i = 0; i < rawtmp; i += 1) {
    out.u8(raw.at(i, "u8"));
  }

  for (let i = 0; i < paktmp; i += 1) {
    out.u8(pak.at(i + _pakoffset - paktmp, "u8"));
  }

  let hdr: number;

  for (hdr = 8; out.offset & 3; hdr += 1) {
    out.u8(0xff);
  }

  out.u24(paktmp + hdr);
  out.u8(hdr);

  out.u32(raw.length - paktmp - rawtmp - hdr);
  out.reallocate(out.offset).seek(0);

  return out;
}

function _search(raw: CTRMemory): [number, number] {
  const BLZ_F = 0x12;
  const BLZ_N = 0x1002;

  let posbest = 0;
  let lenbest = BLZ_THRESHOLD;

  const max = raw.offset >= BLZ_N ? BLZ_N : raw.offset;

  for (let pos = 3; pos <= max; pos += 1) {
    let len = 0;

    while (len < BLZ_F) {
      if (len >= pos || raw.offset + len >= raw.length) {
        break;
      }

      if (
        raw.at(raw.offset + len, "u8") !== raw.at(raw.offset + len - pos, "u8")
      ) {
        break;
      }

      len += 1;
    }

    if (len > lenbest) {
      lenbest = len;
      posbest = pos;

      if (lenbest === BLZ_F) {
        break;
      }
    }
  }

  return [lenbest, posbest];
}

function _decodeerr(buffer: CTRMemory, err: unknown): CTRBLZError {
  return new CTRBLZFormatError(
    CTRBLZError.ERR_DECODE,
    buffer,
    undefined,
    err instanceof CTRMemoryOOBError
      ? new CTRBLZError(CTRBLZError.ERR_UNEXPECTED_END_OF_FILE, undefined, err)
      : err
  );
}

function _encodeerr(buffer: CTRMemory, err: unknown): CTRBLZError {
  return new CTRBLZFormatError(CTRBLZError.ERR_ENCODE, buffer, undefined, err);
}

export { decode, encode };
