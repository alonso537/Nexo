import { PasswordPort } from "../../domain/ports/password.port";
import bcrypt from 'bcryptjs';


export class BcryptAdapter implements PasswordPort {
    constructor(private readonly saltRounds: number = 10) {}

    async hash(plain: string): Promise<string> {
        const salt = await bcrypt.genSalt(this.saltRounds);
        return bcrypt.hash(plain, salt);
    }

    async compare(plain: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plain, hashed);
    }
}