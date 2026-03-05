import { StringVo } from '../../../../shared/domain/value-objects/string.vo';

export class UsernameVO extends StringVo {
  private constructor(value: string) {
    super(value);
  }

  protected override validate(value: string): boolean {
    if (!super.validate(value)) return false;
    return /^[a-z0-9_-]{3,30}$/i.test(value);
  }

  public static create(value: string): UsernameVO {
    return new UsernameVO(value.trim().toLowerCase());
  }
}
