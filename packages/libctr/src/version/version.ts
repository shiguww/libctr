import { CTRMemory } from "@libctr/memory";
import type { CTRMemoryArray } from "@libctr/memory";
import { CTRBinarySerializable } from "#utils/binary-serializable";
import { CTRVersionInvalidSpecifierError } from "#version/version-error";

const CTR_VERSION_SPECIFIER_REGEXP =
  /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

type CTRVersionSpecifier = `${number}.${number}.${number}.${number}`;

class CTRVersion extends CTRBinarySerializable<CTRVersionSpecifier> {
  public major: number = 0;
  public micro: number = 0;
  public minor: number = 0;
  public patch: number = 0;

  public constructor(specifier?: CTRVersionSpecifier);
  public constructor(buffer?: Exclude<CTRMemoryArray, string>);

  public constructor(init?: CTRVersionSpecifier | CTRMemoryArray) {
    super();
    this._init(init);
  }

  public is(other: string | CTRVersion): boolean {
    other = typeof other === "string" ? other : other.toString();
    return this.toString() === other;
  }

  public override toString(): CTRVersionSpecifier {
    return this._get();
  }

  protected override _get(): CTRVersionSpecifier {
    return `${this.major}.${this.minor}.${this.patch}.${this.micro}`;
  }

  protected override _set(state: CTRVersionSpecifier): void {
    const [major, minor, patch, micro] =
      CTR_VERSION_SPECIFIER_REGEXP.exec(state)!;

    this.major = Number(major);
    this.minor = Number(minor);
    this.patch = Number(patch);
    this.micro = Number(micro);
  }

  protected override _build(buffer: CTRMemory): void {
    buffer.u8(this.micro);
    buffer.u8(this.patch);
    buffer.u8(this.minor);
    buffer.u8(this.major);
  }

  protected override _parse(buffer: CTRMemory): void {
    this.micro = buffer.u8();
    this.patch = buffer.u8();
    this.minor = buffer.u8();
    this.major = buffer.u8();
  }

  protected override _sizeof(): number {
    return 4 * CTRMemory.U8_SIZE;
  }

  protected override _validate(specifier: unknown): CTRVersionSpecifier {
    if (
      typeof specifier !== "string" ||
      !CTR_VERSION_SPECIFIER_REGEXP.test(specifier)
    ) {
      throw new CTRVersionInvalidSpecifierError({ specifier });
    }

    return <CTRVersionSpecifier>specifier;
  }

  private _init(
    specifierOrBuffer?: CTRMemoryArray | CTRVersionSpecifier
  ): void {
    if (specifierOrBuffer === undefined) {
      return;
    }

    if (typeof specifierOrBuffer === "string") {
      this.set(<CTRVersionSpecifier>specifierOrBuffer);
      return;
    }

    this.parse(specifierOrBuffer);
  }
}

export { CTRVersion, CTRVersion as Version };
export type { CTRVersionSpecifier, CTRVersionSpecifier as VersionSpecifier };
