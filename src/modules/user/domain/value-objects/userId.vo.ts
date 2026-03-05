import { v7 as uuidv7 } from 'uuid';
import { UuidVO } from '../../../../shared/domain/value-objects/uuid.vo';

export class UserIdVO extends UuidVO {
  private constructor(value: string) {
    super(value);
  }

  public static generate(): UserIdVO {
    return new UserIdVO(uuidv7());
  }

  public static fromString(id: string): UserIdVO {
    return new UserIdVO(id);
  }
}
