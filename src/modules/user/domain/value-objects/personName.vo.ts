import { StringVo } from "../../../../shared/domain/value-objects/string.vo";


export class PersonNameVO extends StringVo {
    private constructor(value:string){
        super(value)
    }

    protected override validate(value:string):boolean {
        if(!super.validate(value)) return false;
        if(value.length < 2 || value.length > 50) return false;
        // letras (con acentos y ñ), espacios, guion y apóstrofe (para "O'Brien", "De la Cruz")
        return /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/.test(value);
    }

    public static create(value:string): PersonNameVO {
        return new PersonNameVO(value.trim());
    }
}