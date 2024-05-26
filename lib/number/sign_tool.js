export default class SignTool{
    static Value = class {
        static POS = 1
        static ZERO = 0
        static NEG = -1
    }
    
    static number2sign(v){
        if(v>0){ return SignTool.Value.POS }
        if(v==0){ return SignTool.Value.ZERO }
        if(v<0){ return SignTool.Value.NEG }

        throw new Error(`Invalid value: ${v}`)
    }

    static sign2str(v){
        if (v==SignTool.Value.POS){ return '+' }
        if (v==SignTool.Value.NEG){ return '-' }
        if (v==SignTool.Value.ZERO){ return null }
        
        throw new Error(`Invalid value: ${v}`)
    }

    static value2signed(v, s){
        if(s==SignTool.Value.POS){ return v }
        if(s==SignTool.Value.ZERO){ return v }
        if(s==SignTool.Value.NEG){ return -v }

        throw new Error(`Invalid sign: ${s}`)
    }
}