import StringTool from "../string/string_tool";
import ArrayTool from "../collection/array/array_tool";
import DateTool from "../date/date_tool";
import lodash from "lodash";
import FunctionTool from "../function/function_tool";


export default class PhonenumberTool{
  static x2nodash(v:string):string{
    // return v?.replace(/[^+\d]+/g, "");  // https://stackoverflow.com/a/71202366
    return v?.replace(/[^+a-zA-Z0-9]+/g, "");  // https://stackoverflow.com/a/71202366
    // return v?.replaceAll("[()\\s-]+", ""); // not working
    // return v?.replaceAll("\\D+", ""); // not working
  }

  static string2is_cellphonenumber(phonenumber:string):boolean{
    const cls = PhonenumberTool;
    const callname = `PhonenumberTool.string2is_cellphonenumber @ ${DateTool.time2iso(new Date())}`;

    const nodash = cls.x2nodash(phonenumber);
    const n = nodash?.length;
  
    const is_valid = ArrayTool.all([
      !!n && n>= 10 && n<=11,
      nodash?.startsWith('01'),
    ]);
    // console.log({callname, is_valid, n})
    return is_valid;
  }

  static regex_countrycode = ():RegExp => {
    // https://stackoverflow.com/a/62192894
    // return /(?:\+|00)(1|7|2[07]|3[0123469]|4[013456789]|5[12345678]|6[0123456]|8[1246]|9[0123458]|(?:2[12345689]|3[578]|42|5[09]|6[789]|8[035789]|9[679])\d)/;
    return /(?:\+|00)(?:1|7|2[07]|3[0123469]|4[013456789]|5[12345678]|6[0123456]|8[1246]|9[0123458]|(?:2[12345689]|3[578]|42|5[09]|6[789]|8[035789]|9[679]))/;
  }

  static number_countrycode2e164 = (phonenumber_in:string, countrycode:string):string => {
    const cls = PhonenumberTool;
    if(!phonenumber_in){ return undefined; }

    const phonenumber_nodash = cls.x2nodash(phonenumber_in);

    // const match:RegExpExecArray = cls.regex_countrycode().exec(x_in);
    const has_countrycode = cls.regex_countrycode().test(phonenumber_nodash);
    return has_countrycode ? phonenumber_nodash : `${countrycode}${phonenumber_nodash?.replace(/^0/,'')}`;
  }

  // static splitonce_domestic_countrycode = lodash.flow(
  //   lodash.partial(StringTool.splitonce, PhonenumberTool.regex_countrycode()),
  //   ArrayTool.reversed,
  // )
  static splitonce_domestic_countrycode = (x:string):[string,string?] => {
    const cls = PhonenumberTool;
    const callname = `PhonenumberTool.splitonce_domestic_countrycode @ ${DateTool.time2iso(new Date())}`;

    const tokens = StringTool.trisplit_once(PhonenumberTool.regex_countrycode(), x);
    // console.log({callname, x, tokens});
    // const tokens = PhonenumberTool.regex_countrycode()[Symbol.split](x, 3)?.map(x => x?.trim())

    if(!tokens){ return undefined; }
    if(tokens.length == 1){ return [x]; }

    const countrycode_domestic = tokens?.slice(1,)?.map(x => x?.trim());
    // console.log({callname, x, tokens, countrycode_domestic});
    return ArrayTool.reversed(countrycode_domestic) as [string,string];
  }
}

export class PhonenumberkrTool{
  static is_zdom = (dom:string):boolean => dom?.startsWith('0');
  static dom2zdom = (dom:string):string => dom == null
    ? undefined
    : !dom
      ? dom
      : PhonenumberkrTool.is_zdom(dom)
      ? dom
      : `0${dom}`
      ; // prettier-ignore
  static dom2nzdom = (dom:string):string => dom == null ? undefined : PhonenumberkrTool.is_zdom(dom) ? dom?.substring(1) : dom;
  static x2dom = lodash.flow(
    PhonenumberTool.splitonce_domestic_countrycode,
    x => x?.[0],
  )

  // static zdom2tokens = FunctionTool.deprecated((zdom:string):string[] => {
  //   // https://jhlov.github.io/전화번호-입력시-자동으로-하이픈(-)-삽입하는-자바스크립트-코드/
  //   // this is the original form but prefer dom2tokens as long as it works
  //   const match = PhonenumberTool.x2nodash(zdom)?.match(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,);
  //   return match?.slice(1);
  // })

  static dom2tokens = (dom:string):string[] => {
    const cls = PhonenumberkrTool;
    const callname = `PhonenumberkrTool.dom2tokens @ ${DateTool.time2iso(new Date())}`;
    // https://jhlov.github.io/전화번호-입력시-자동으로-하이픈(-)-삽입하는-자바스크립트-코드/
    
    if(dom == null){ return undefined; }
    if(!dom){ return undefined; }

    const match = PhonenumberTool.x2nodash(dom)?.match(/(^0?2.{0}|^0?1.{1}|[0-9]{2,3})([0-9]+)([0-9]{4})/,);

    // console.log({callname, match});

    if(match == null){ return [dom]; }
    return match?.slice(1);
  }

  static x2dashed = (x:string):string => {
    const cls = PhonenumberkrTool;
    const callname = `PhonenumberkrTool.x2dashed @ ${DateTool.time2iso(new Date())}`;
    
    if(x == null){ return undefined; }

    
    const [dom, countrycode] = PhonenumberTool.splitonce_domestic_countrycode(x)
    // const zdom = cls.dom2zdom(dom);
    const dom_dashed = cls.dom2tokens(dom)?.join('-');
    
    // return countrycode
    //   ? [countrycode, dom]?.filter(x => x!=null)?.join(' ')
    //   : cls.zdom2tokens(cls.dom2zdom(dom))
    // const zdomestic_dashed = cls.zdom2tokens(zdom)?.join('-');
    const dashed = [countrycode, dom_dashed]?.filter(x => x!=null)?.join(' '); // since ZERO is false

    // console.log({callname, x, dom, countrycode, dom_dashed, dashed})
    return dashed;
  }
    
}
