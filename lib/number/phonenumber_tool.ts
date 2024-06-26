import ArrayTool from "../collection/array/array_tool";
import DateTool from "../date/date_tool";

export default class PhonenumberTool{
  static x2nodash(v:string):string{
    // return v?.replace(/[^+\d]+/g, "");  // https://stackoverflow.com/a/71202366
    return v?.replace(/[^+a-zA-Z0-9]+/g, "");  // https://stackoverflow.com/a/71202366
    // return v?.replaceAll("[()\\s-]+", ""); // not working
    // return v?.replaceAll("\\D+", ""); // not working
  }
  
  static x2tokens(v:string):string[]{
    const cls = PhonenumberTool;
    
    const match = cls.x2nodash(v)?.match(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,);
    return match?.slice(1);
  }

  static x2dashed(v:string):string{
    const cls = PhonenumberTool;
    const callname = `PhonenumberTool.x2dashed @ ${DateTool.time2iso(new Date())}`;
    // https://jhlov.github.io/전화번호-입력시-자동으로-하이픈(-)-삽입하는-자바스크립트-코드/
    
    // const v_nodash = cls.x2nodash(v);
    const v_dashed = cls.x2tokens(v)?.join('-');
    // console.log({callname,
    //   v,
    //   '"(123) 456-7890".replace(/[^+\d]+/g, "")':"(123) 456-7890".replace(/[^+\d]+/g, ""),
    //   'v.replace(/[^+\d]+/g, "")':v.replace(/[^+\d]+/g, ""),
    //   v_nodash,
    //   v_dashed});
    return v_dashed;
    // return self.x2nodash(v)?.replace(
    //   /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
    //   "$1-$2-$3"
    // );
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
    return /(?:\+|00)(1|7|2[07]|3[0123469]|4[013456789]|5[12345678]|6[0123456]|8[1246]|9[0123458]|(?:2[12345689]|3[578]|42|5[09]|6[789]|8[035789]|9[679])\d)/;
  }
  static number_countrycode2e164 = (phonenumber_in:string, countrycode:string):string => {
    const cls = PhonenumberTool;
    if(!phonenumber_in){ return undefined; }

    const phonenumber_nodash = cls.x2nodash(phonenumber_in);

    // const match:RegExpExecArray = cls.regex_countrycode().exec(x_in);
    const has_countrycode = cls.regex_countrycode().test(phonenumber_nodash);
    return has_countrycode ? phonenumber_nodash : `${countrycode}${phonenumber_nodash?.replace(/^0/,'')}`;
  }
}