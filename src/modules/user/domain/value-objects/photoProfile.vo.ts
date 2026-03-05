import { StringVo } from '../../../../shared/domain/value-objects/string.vo';

export class PhotoProfileVO extends StringVo {
  private constructor(value: string) {
    super(value);
  }

  protected override validate(value: string): boolean {
    if (!super.validate(value)) return false;
    // S3 key: sin espacios, sin caracteres no permitidos por S3
    return /^[a-zA-Z0-9!\-_.*'()/]+$/.test(value);
  }

  public static create(value: string): PhotoProfileVO {
    return new PhotoProfileVO(value.trim());
  }
}
