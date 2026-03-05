import { AppError } from "../errors/AppError";


export abstract class StringVo {
    protected constructor(readonly value:string) {
        this.ensureIsValidString(value);
    }

    private ensureIsValidString(value:string):void{
        if(!this.validate(value)){
            throw new AppError('Invalid string value', 400, 'INVALID_STRING');
        }
    }

    protected validate(value:string):boolean{
        return !!value && value.trim() !== '';
    }

    public equals(other: StringVo): boolean {
        return this.constructor === other.constructor && this.value === other.value;
    }

    public toString():string {
        return this.value
    }
}