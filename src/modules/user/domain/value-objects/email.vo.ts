import { StringVo } from "../../../../shared/domain/value-objects/string.vo";


export class EmailVo extends StringVo {
    private constructor(value:string){
        super(value)
    }

    protected override validate(value:string):boolean {
        if(!super.validate(value)) return false;
        // Validación básica de formato de correo electrónico
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    public static create(value:string):EmailVo {
        return new EmailVo(value.trim().toLowerCase());
    }
}