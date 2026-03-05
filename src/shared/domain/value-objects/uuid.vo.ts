import { AppError } from "../errors/AppError";


export abstract class UuidVO {
    protected constructor(readonly value:string) {
        this.ensureIsValidUuid(value);
    }

    private ensureIsValidUuid(id:string):void{
        if(!this.validate(id)){
            throw new AppError('Invalid UUID format', 400, 'INVALID_UUID');
        }
    }

    protected validate(id:string):boolean{
        if(!id) return false;
        // version: 1-8 | variant: 8, 9, a, b (RFC 4122)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    public equals(other: UuidVO): boolean {
        return this.constructor === other.constructor && this.value === other.value;
    }

    public toString():string {
        return this.value
    }
}