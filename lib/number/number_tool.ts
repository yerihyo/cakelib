import NativeTool from '../native/native_tool';


export default class NumberTool {
  static is_number(v: any): boolean { 
    if(typeof v !== 'number'){ return false; }
    if(isNaN(v)){ return false; }
    return true;
  }
  static x2is_number(v: any): boolean { return NumberTool.is_number(v); }

  static x2is_positive(x:any):boolean{
    const cls = NumberTool;

    if(x == null){ return undefined; }
    if(!cls.x2is_number(x)){ return false; }
    return x>0;
  }
  static negated = (x:number):number => x == null ? undefined : -x;

  static number2str_sign3(v: number): string {
    if (v === 0) { return ''; }
    if (v > 0) { return '+'; }
    return '-';
  }

  static number2str_sign2(v: number): string {
    if (v >= 0) { return '+'; }
    return '-';
  }

  static x2number(v: any): number {
    if (v == null) { return v; }

    if (NumberTool.x2is_number(v)) { return v; }
    if(isNaN(v)){ return NaN; }

    const is_string = ((x: any) => {
      // reference: StringTool.x2is_string
      if (typeof x === 'string') { return true; }
      if (x instanceof String) { return true; }
      return false;
    })(v);
    
    if (is_string) { return parseFloat(v); }

    throw new Error(`v: ${v}`);
  }
  // static alt_if_nan = (v:number, alt:number):number => !isNaN(v) ? v : alt;

  static nan2null = (v:number):number => !isNaN(v) ? v : null;
  static nan2undef = (v:number):number => !isNaN(v) ? v : undefined;

  static number2chkd(v: number) {
    if (NumberTool.is_number(v)) { return v; }
    throw new Error(`v:${v}`);
  }
  static number2suffix(v: number) {
    return ["st", "nd", "rd"][((v + 90) % 100 - 10) % 10 - 1] || "th";
  }

  static number2eng(v: number) {
    return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][v];
    // if (v !== 6) { throw new Error(`v:${v}`); }
    // return 'six';
  };

  static num2str = (v: number): string  => v == null ? undefined : `${v}`;

  static number2delim_inserted(v: number, delim: string,): string {

    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delim);
  }

  static triplezeros2dash(s: string): string {
    return s.replace(/000/g, "-");
  }

  static is_between(v: number, range: [number, number]): boolean {
    if (v === undefined || v === null) { return false; }
    return (v >= range[0] && v < range[1]);
  }
  // Use MathTool
  // 
  // static sum(numbers: number[]): number {
  //   return numbers.reduce((a, b) => {
  //     if(a==null || b == null){ return undefined; }
  //     return a + b;
  //   }, 0);
  // }
  // static add = (...numbers: number[]): number => NumberTool.sum(numbers);

  // static product(numbers: number[]): number {
  //   return numbers.reduce((a, b) => {
  //     if(a==null || b == null){ return undefined; }
  //     return a * b;
  //   }, 0);
  // }
  // static mul = (...numbers: number[]): number => NumberTool.product(numbers);

  static pad(
    n: (string | number),
    width: number,
    pad?: string,
  ) {
    const pad_ = pad ?? '0';
    const s = n + '';
    return s.length >= width ? n : new Array(width - s.length + 1).join(pad_) + n;
  }

  static trunc(x: number) { return ~~x; }

  static modulo_positive(x: number, n: number,) {
    return (x % n + n) % n;
  }

  // static number2str_signed(n:number):string{
  //     if(n>0){ return `+${n}`}
  //     if(n<0){ return `-${n}`}
  //     return '0'
  // }

  static isPowerOf2(v: number) {
    // https://stackoverflow.com/a/30924333/1902064
    return v && !(v & (v - 1));
  }

  static str2float(str_in: string) {
    return NativeTool.is_null_or_undefined(str_in) ? str_in : parseFloat(str_in);
  }

  // static upperbound = function(v, upperbound){
  //     return v>upperbound?upperbound:v
  // }

  /**
   * Format bytes as human-readable text.
   * (https://stackoverflow.com/a/14919494/1902064)
   * 
   * @param bytes Number of bytes.
   * @param standard si:  metric (SI) standard, aka powers of 1000
   *                 iec: binary (IEC) standard, aka powers of 1024.
   * @param dp Number of decimal places to display.
   * 
   * @return Formatted string.
   */
  static number2readable(bytes: number, standard: string = 'iec', dp: number = 1) {
    const thresh = standard === 'si' ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }

    const units = standard === 'si'
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
      bytes /= thresh;
      ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
  }

}
