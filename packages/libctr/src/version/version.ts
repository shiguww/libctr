import { CTRMemory } from "@libctr/memory";
import { CTRBinarySerializable } from "#utils/binary-serializable";
import { CTRVersionInvalidSpecifierError } from "#version/version-error";

class CTRVersion extends CTRBinarySerializable {
  public major: number = 0;
  public micro: number = 0;
  public minor: number = 0;
  public patch: number = 0;

  public constructor(buffer?: CTRMemory);
  public constructor(version: string | CTRVersion);

  public constructor(versionOrBuffer?: string | CTRMemory | CTRVersion) {
    super();
    this._init(versionOrBuffer);
  }

  public is(other: string | CTRVersion): boolean {
    other = typeof other === "string" ? other : other.toString();
    return this.toString() === other;
  }

  public set(other: string | CTRVersion): this {
    return this._fromString(
      typeof other === "string" ? other : other.toString()
    );
  }

  public override toString(): string {
    return `${this.major}.${this.minor}.${this.patch}.${this.micro}`;
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

  private _init(versionOrBuffer?: string | CTRMemory | CTRVersion): void {
    if (versionOrBuffer instanceof CTRMemory) {
      this.parse(versionOrBuffer);
    }

    if (
      typeof versionOrBuffer === "string" ||
      versionOrBuffer instanceof CTRVersion
    ) {
      this.set(versionOrBuffer);
    }
  }

  private _fromString(specifier: string): this {
    const [_major, _minor, _patch, _micro] = specifier.split(".");

    if (
      _major === undefined ||
      _minor === undefined ||
      _patch === undefined ||
      _micro === undefined
    ) {
      throw new CTRVersionInvalidSpecifierError({ specifier });
    }

    const major = Number.parseInt(_major);
    const minor = Number.parseInt(_minor);
    const patch = Number.parseInt(_patch);
    const micro = Number.parseInt(_micro);

    if (
      Number.isNaN(major) ||
      Number.isNaN(minor) ||
      Number.isNaN(patch) ||
      Number.isNaN(micro)
    ) {
      throw new CTRVersionInvalidSpecifierError({ specifier });
    }

    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.micro = micro;

    return this;
  }
}

export { CTRVersion, CTRVersion as Version };
