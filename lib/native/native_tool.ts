import { CSSProperties } from "react";

export type Dictkey = string|number|symbol;
export type PotentialPromise<T> = T | Promise<T>
export type Pair<T> = [T, T];
export type Triple<T> = [T, T, T];

export default class NativeTool {
  static var2name = (variable: any): string => {
    return Object.keys(variable)[0]
  }

  static x2is_boolean(x:any):boolean{
    // https://stackoverflow.com/a/28814615
    return typeof x == "boolean"
  }

  static is_null_or_undefined(value: any): value is (null | undefined) {
    return value == null;
    // return value === undefined || value === null
  }

  // static getattr(x: any, key: string): any {
  //   if (this.is_null_or_undefined(x)) { return x; }

  //   return x[key];
  // }

  // static default_if_undefined<X>(v: X, v_default: X): X {
  //   return v === undefined ? v_default : v;
  // }

  // static default_if_undef<X>(v: X, v_default: X): X {
  //   return NativeTool.default_if_undefined(v, v_default);
  // }

  static default_if_invalid<X>(v: X, v2is_valid: (x: X) => boolean, v_default: X): X {
    return v2is_valid(v) ? v : v_default;
  }

  static default_if_false<X>(v: X, v_default: X): X {
    return NativeTool.default_if_invalid(v, x => !!x, v_default);
  }

  static undef_unless_valid<X>(x:X, x2is_valid: (x:X) => boolean,):X{
    return x2is_valid(x) ? x : undefined;
  }

  static setTimeoutIfPositive(f: () => any, duration: number) {
    duration > 0 ? setTimeout(f, duration) : f();
  }

  static is_boolean(obj: any) {
    return (typeof obj == 'boolean');
  }

  static codec_undefined2null<T>():{
    encode:(t:T) => T,
    decode:(t:T) => T,
  } {
    return {encode: (x:T) => (x!=null) ? x : null, decode: (x:T) => (x!=null) ? x : undefined,};
  }

  /**
   * https://stackoverflow.com/a/19717946
   * https://stackoverflow.com/a/7356528
   * @param x 
   */
  static x2is_function(x:any):boolean{
    return x instanceof Function;
    // return x && {}.toString.call(x) === '[object Function]';
  }

  static error_if_null<T,>(x: T,): T {
    if (x == null) {
        throw new Error(`value is null! ${x}`)
    }
    return x;
  }

  static bool3 = (x:any):boolean => x == null ? undefined : !!x;
  static negate3 = (b:boolean):boolean => (b == null ? b : !b);
}

export class GriddisplayTool{
  static width2cssprop_center = (width:string):CSSProperties => {
    return {
      display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${width}, max-content))`, justifyContent: 'center',
    }
  }
}