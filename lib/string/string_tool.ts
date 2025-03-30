import lodash from "lodash";
import CmpTool from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool";
import DateTool from "../date/date_tool";
import NativeTool from "../native/native_tool";
import SpanTool from "../span/span_tool";
import FunctionTool from "../function/function_tool";
import RegexTool from "../regex/regex_tool";

export default class StringTool {


  static is_english = (s:string):boolean => !!s?.match(/^[\w\-\s]*$/);

  static x2string(x: any) {
    const cls = StringTool;

    if (!x) { return x; }

    if (cls.x2is_string(x)) { return x; }
    if (typeof x === 'number') { return (x as number).toString(); }

    throw new Error(`Unknown value x: ${x}`);
  }

  // https://stackoverflow.com/a/196991
  static toTitlecase = (str:string) => {
    return str?.replace(
      /\w\S*/g,
      x => x.charAt(0).toUpperCase() + x.substring(1).toLowerCase()
    );
  }

  // references:
  //  https://stackoverflow.com/a/2878746
  //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search
  static trisplit_once = (
    splitter:string|RegExp,
    x:string,
    // splitter:Parameters<typeof String.prototype.split>[0],
    // splitter:Parameters<typeof String.prototype.search>[0],
    // option?:{splitlimit?:number},
  ):[string,string?,string?] => {
    const callname = `StringTool.trisplit_once @ ${DateTool.time2iso(new Date())}`;

    if(x == null){ return undefined; }
    if(splitter == null){ return undefined; }

    const span = (splitter instanceof RegExp)
      ? RegexTool.match2span(splitter.exec(x))
      : (i => i>0 ? [i, i+splitter.length] : undefined)(x.indexOf(splitter))
    // if(is_regex){
      
    //   splitter?.exec(s)
    // }
    // const i = is_regex ? s?.exec(splitter) : s?.indexOf(splitter);
    return span == null
      ? [x]
      : [
        x.slice(0,span[0]),
        x.slice(span[0], span[1]),
        x.slice(span[1]),
      ]
      ;
  }

  // static func2stringonly = <X,Y>(func: (s:string) => Y):((x:X) => (X|Y)) => {
  //     const cls = StringTool;
  //     return (x:X) => {
  //         return cls.x2is_string(x) ? func(x as string) : x;
  //     }
  // }

  // static trim = <X>(x:X) => StringTool.func2stringonly<X,string>(s => s.trim())(x);
  // static replace_last(str_target:string, str_from:string, str_to:string){
  //     // https://stackoverflow.com/a/42420501
  //     const last_index = str_target.lastIndexOf(str_from);
  //     if(last_index<0){ return str_target; }

  //     var a = str_target.split("");
  //     var p = str_from.length;

  //     for(var i = last_index; i < last_index + p; i++) {
  //         if(i == last_index) {
  //             a[i] = str_to;
  //         }
  //         else {
  //             delete a[i];
  //         }
  //     }
  //     return a.join("");
  // }

  static equalsIgnorecase = (s1: string, s2: string): boolean => {
    return CmpTool.isBiequal(s1?.toLowerCase(), s2?.toLowerCase());
  }

  static capitalize0(x: string): string {
    return x.charAt(0).toUpperCase() + x.slice(1);
  }

  static substring(x: string, s: number, e?: number): string {
    if (!x) { return undefined; }
    const n = x.length;

    const i2pos = (i: number) => i == null ? i : (i % n + n) % n;

    return x.substring(i2pos(s), i2pos(e));
  }

  static substr(x: string, s: number, p?: number): string {
    if (!x) { return undefined; }
    const n = x.length;

    const i2pos = (i: number) => i == null ? i : (i % n + n) % n;

    return x.substr(i2pos(s), p);
  }

  static terms2items_nonoverlapping(text: string, terms: string[]): { termindex: number, span: [number, number] }[] {
    const callname = `StringTool.terms2items_nonoverlapping @ ${DateTool.time2iso(new Date())}`;

    // console.log({callname, text, terms});

    const items = terms
      ?.filter(x => x != null)
      ?.map((term, j) => StringTool.indexesof(text, term)?.map(i => ({ termindex: j, span: [i, i + term.length] as [number, number] })) ?? [])
      ?.flat();
    const indexes_nonoverlapping = SpanTool.spans2indexes_nonoverlapping(items.map(item => item.span))
    return indexes_nonoverlapping.map(i => items[i]);
  }

  static indexesof(text: string, term: string): number[] {
    const cls = StringTool;
    const callname = `StringTool.indexesof @ ${DateTool.time2iso(new Date())}`;

    if (text == null) { return undefined; }

    const n = text?.length;
    var indexes = [];
    const js = [...Array(term?.length ?? 0).keys()];
    for (var i = 0; i < n; i++) {
      if (js.every(j => text[i + j] === term[j])) {
        indexes.push(i);
      }
    }
    return indexes;
  }
  static is_string(v: any) {
    return (typeof v === 'string' || v instanceof String);
    // return (typeof v === 'string');
  }

  static apply_before(str_target: string, f_transduce: (x: string) => string, index: number,) {
    if (index < 0) { return str_target; }

    return f_transduce(str_target.slice(0, index)) + str_target.slice(index);
  }

  static apply_after(str_target: string, f_transduce: (x: string) => string, index: number,) {
    if (index >= str_target.length) { return str_target; }

    return str_target.slice(0, index) + f_transduce(str_target.slice(index));
  }

  static replace_last(input: string, find: string, replaceWith: string,): string {
    const self = StringTool;

    // console.log({input, find, replaceWith});

    // https://stackoverflow.com/a/56901704
    if (!self.x2is_string(input) || !self.x2is_string(find) || !self.x2is_string(replaceWith)) {
      // returns input on invalid arguments
      return input;
    }

    const lastIndex = input.lastIndexOf(find);
    if (lastIndex < 0) {
      return input;
    }
    return self.apply_after(input, x => replaceWith + x.substr(find.length), lastIndex);
    // return input.substr(0, lastIndex) + replaceWith + input.substr(lastIndex + find.length);
  }
  // static replace_last(input:string, find:string, replaceWith:string,) {
  //     const self = StringTool;
  //     return self.replace_last_with_index(input, find, replaceWith)[0];
  // }

  static replace_after(str_target: string, str_from: string, str_to: string, index: number,) {
    if (str_target.length <= index) { return str_target; }

    return str_target.slice(0, index) + str_target.slice(index).replace(str_from, str_to);
  }

  static x2is_string(x: any) {
    // reference: https://stackoverflow.com/a/9436948/1902064

    if (typeof x === 'string') { return true; }
    if (x instanceof String) { return true; }
    return false;
  }

  static str2lower(s: string): string {
    return !NativeTool.is_null_or_undefined(s) ? s.toLowerCase() : undefined;
  }

  static str2split(delim: string, s: string): string[] {
    if (!s) { return undefined; }
    if (!delim) { return undefined; }

    return s.split(delim);
  }

  static pair2cmp_charwise(a: string, b: string): number {
    // a = a.toString(), b = b.toString();
    const n = Math.max(a.length, b.length);
    for (var i = 0; i < n && a.charAt(i) === b.charAt(i); ++i);
    if (i === n) return 0;
    return a.charAt(i) > b.charAt(i) ? -1 : 1;
  }

  static pair2cmp_simple = (a: string, b: string): number => (a < b ? -1 : (a > b ? 1 : 0));

  // https://stackoverflow.com/questions/2167602/optimum-way-to-compare-strings-in-javascript
  static pair2cmp = StringTool.pair2cmp_simple;

  static len(s: string) {
    return s ? s.length : undefined;
  }

  static shiftleft(s_in: string, count: number): string {
    const self = StringTool;

    if (!s_in) { return undefined; }

    const n = self.len(s_in);
    const p = count % n;
    const s_out: string = [s_in.substring(p), s_in.substring(0, p)].join('');
    return s_out
  }

  static pairs2subbed(
    string_in: string,
    pairs: [string, string][],
  ) {
    const callname = `StringTool.pairs2subbed @ ${DateTool.time2iso(new Date())}`;

    const pairs_reversed = ArrayTool.reversed(pairs);

    const [string_out] = pairs_reversed.reduce(
      ([str_in, last_index_prev], [token_from, token_to],) => {
        const last_index = str_in.slice(0, last_index_prev).lastIndexOf(token_from);
        if (last_index < 0) {
          return [str_in, last_index_prev];
        }

        const str_out = StringTool.apply_before(
          str_in,
          s => StringTool.replace_last(s, token_from, token_to),
          last_index_prev,
        );
        // console.log({callname, str_in, token_from, token_to, str_out, last_index, last_index_prev});
        return [str_out, last_index,];
      },
      [string_in, string_in.length],
    );
    return string_out;
  }

  static camelCase2snakeCase(s: string) {
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static pascalCase2snakeCase(s: string) {
    if (s == null) { return undefined; }
    if (s.length === 0) { return s; }

    return s[0].toLowerCase() + StringTool.camelCase2snakeCase(s.slice(1, s.length));
  }

  static query2clean = (query:string):string => query?.trim(); // need to remove backspace (\b) character
}


