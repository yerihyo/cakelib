import lodash from "lodash";
import FunctionTool from "../function/function_tool";
import { Dictkey } from "../native/native_tool";
import MathTool from "../number/math/math_tool";
import NumberTool from "../number/number_tool";

export type Decider<T> = ((t: T) => boolean);
export type Appraiser<T> = ((t: T) => number);
export type Comparator<T> = ((t1: T, t2: T) => number);
export type Bicomparator<T> = ((t1: T, t2: T) => boolean);
export type Aggregator<T> = ((l:T[]) => T);
// export type Aggregator<T> = ((...args:T[]) => T);

class DateToolLocal {
  static time2iso = (d: Date): string => d?.toISOString()?.split("T")?.[1];
}

export default class CmpTool {
  static f_always_equal = <X>(x1: X, x2: X):number => 0;
  static pair2cmp_always_eq = CmpTool.f_always_equal;

  static isBiequal = <X>(x1: X, x2: X): boolean => (x1 == x2);
  static isBinotequal = <X>(x1: X, x2: X): boolean => (x1 != x2);

  static isTriequal = <X>(x1: X, x2: X): boolean => (x1 === x2);
  static isTrinotequal = <X>(x1: X, x2: X): boolean => (x1 !== x2);
  static f_bicmp_alwaysfalse = <X>(x1: X, x2: X) => false;

  // static f_eq2f_eq_array = <X>(f_eq:Bicomparator<X>):Bicomparator<X[]> => {
  //   return (l1:X[], l2:X[]) => {
  //     if(l1 === l2){ return true; }
  //     if(l1 == null && l2 == null){ return true; }
  //     if(l1 == null || l2 == null){ return false; }

  //     if(l1.length !== l2.length){ return false; }
  //     return l1.every((x1,i) => f_eq(x1, l2[i]));
  //   }
  // }


  // static tuplepair2cmp(x1: any[], x2: any[]): number {
  //   const n1 = x1?.length ?? 0;
  //   const n2 = x2?.length ?? 0;

  //   for (const i of Array.from(Array(Math.min(n1, n2)).keys())) {
  //     if (x1[i] < x2[i]) { return -1; }
  //     if (x1[i] > x2[i]) { return 1; }
  //     if (x1[i] == x2[i]) { continue; }
  //     return undefined;
  //   }

  //   if (n1 < n2) { return -1; }
  //   if (n1 > n2) { return 1; }
  //   if (n1 == n2) { return 0; }
  //   return undefined;
  // }

  // static f_cmp2funcs_richcmp = <T>(f_cmp:(t1:T, t2:T) => number):{
  //     gt: (t1:T, t2:T) => boolean,
  //     gte: (t1:T, t2:T) => boolean,
  //     lt: (t1:T, t2:T) => boolean,
  //     lte: (t1:T, t2:T) => boolean,
  // } => {
  //     const cmp2bool_to_pair2cmp = (cmp2bool: (cmp:number) => boolean) => {
  //         return (t1:T, t2:T) => {
  //             const cmp = f_cmp(t1,t2);
  //             return cmp == null ? undefined : cmp2bool(cmp);
  //         }
  //     }
  //     return {
  //         gt: cmp2bool_to_pair2cmp((cmp: number) => cmp > 0),
  //         gte: cmp2bool_to_pair2cmp((cmp: number) => cmp >= 0),
  //         lt: cmp2bool_to_pair2cmp((cmp: number) => cmp < 0),
  //         lte: cmp2bool_to_pair2cmp((cmp: number) => cmp <= 0),
  //     }
  // }

  // static f_cmp2f_gt = <T,>(f_cmp: Comparator<T>): Bicomparator<T> => (...p: Pair<T>) => { const c = f_cmp(...p); return c != null ? c > 0 : undefined; };
  // static f_cmp2f_gte = <T,>(f_cmp: Comparator<T>): Bicomparator<T> => (...p: Pair<T>) => { const c = f_cmp(...p); return c != null ? c >= 0 : undefined; };
  // static f_cmp2f_lt = <T,>(f_cmp: Comparator<T>): Bicomparator<T> => (...p: Pair<T>) => { const c = f_cmp(...p); return c != null ? c < 0 : undefined; };
  // static f_cmp2f_lte = <T,>(f_cmp: Comparator<T>): Bicomparator<T> => (...p: Pair<T>) => { const c = f_cmp(...p); return c != null ? c <= 0 : undefined; };

  static f_cmp2f_gt = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.gt(c,0));
  static f_cmp2f_gte = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.gte(c,0));
  static f_cmp2f_lt = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.lt(c,0));
  static f_cmp2f_lte = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.lte(c,0));

  static f_cmp2f_eq = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.eq(c,0));
  static f_cmp2f_ne = <A extends any[]>(f_cmp: (...args:A) => number) => lodash.flow(f_cmp, (c:number) => MathTool.ne(c,0));

  static f_cmp2f_max = <X,>(f_cmp: Comparator<X>): Aggregator<X> => (l: X[]) => {
    return l?.reduce(
      (x0, x1, i) => {
        if(i === 0) return x1;
        const cmp = f_cmp(x0,x1);

        if(cmp == null) return undefined;
        return MathTool.gtezero(cmp) ? x0 : x1;
      },
      undefined,
    );
  };

  static f_cmp2f_min = <X,>(f_cmp: Comparator<X>): Aggregator<X> => (l: X[]) => {
    return l?.reduce(
      (x0, x1, i) => i === 0 ? x1 : (f_cmp(x0,x1)<=0 ? x0 : x1),
      undefined,
    );
  };

  static gt_default = CmpTool.f_cmp2f_gt(CmpTool.pair2cmp_default);
  static gte_default = CmpTool.f_cmp2f_gte(CmpTool.pair2cmp_default);
  static lt_default = CmpTool.f_cmp2f_lt(CmpTool.pair2cmp_default);
  static lte_default = CmpTool.f_cmp2f_lte(CmpTool.pair2cmp_default);

  static eq_default = CmpTool.f_cmp2f_eq(CmpTool.pair2cmp_default);
  static ne_default = CmpTool.f_cmp2f_ne(CmpTool.pair2cmp_default);

  // static f_cmp2f_gt = <T>(f_cmp: (t1: T, t2: T) => number): ((t1: T, t2: T) => boolean) => CmpTool.f_cmp2funcs_richcmp(f_cmp).gt;
  // static f_cmp2f_gte = <T>(f_cmp: (t1: T, t2: T) => number): ((t1: T, t2: T) => boolean) => CmpTool.f_cmp2funcs_richcmp(f_cmp).gte;
  // static f_cmp2f_lt = <T>(f_cmp: (t1: T, t2: T) => number): ((t1: T, t2: T) => boolean) => CmpTool.f_cmp2funcs_richcmp(f_cmp).lt;
  // static f_cmp2f_lte = <T>(f_cmp: (t1: T, t2: T) => number): ((t1: T, t2: T) => boolean) => CmpTool.f_cmp2funcs_richcmp(f_cmp).lte;

  static f_cmp2f_cmp_tuple<T>(
    f_cmp: (t1: T, t2: T) => number,
  ): (l1: T[], l2: T[]) => number {

    return (l1: T[], l2: T[]) => {
      const n1 = l1?.length ?? 0;
      const n2 = l2?.length ?? 0;

      for (const i of Array.from(Array(Math.min(n1, n2)).keys())) {
        const cmp = f_cmp(l1[i], l2[i]);
        if (cmp !== 0) { return cmp; }
      }

      return n1 - n2;
    };
  }

  // static array2f_cmp<X>(array:X[]){
  //     return (x1:X, x2:X) => {
  //         const i1 = array.indexOf(x1);
  //         const i2 = array.indexOf(x2);
  //     }
  // }
  static subtract_typeignore<X>(x1: X, x2: X): number {
    return (x1 as unknown as number) - (x2 as unknown as number);
  }

  // static Option = class {
  //     pair2cmp: (x1, x2) => number;
  //     item2key: (x) => any;

  //     static option2f_cmp<K, X>(option: {
  //         pair2cmp?: (x1:X, x2:X) => number,
  //         item2key?: (x:X) => K,
  //     }): (x: X, y: X) => number {
  //         const self = MinimaxTool;
  //         if(!DictTool.bool(options)){ return CmpTool.pair2cmp_default }

  //         const {cmp, key} = options;


  //         const cmp = DictTool.get(options, 'cmp') as (x: any, y: any) => number;
  //         if(cmp){ return cmp }

  //         const key = DictTool.get(options, 'key')
  //         if(key){ return CmpTool.f_key2f_cmp(key) }

  //         return self.cmp_default
  //     }
  // }

  static cmp2reversed(cmp: number) {
    return cmp != null ? -cmp : cmp;
  }

  static f_cmp2f_cmp_abs<X>(
    f_cmp: (x1: X, x2: X) => number,
    option: {
      is_absmin?: (x: X) => boolean,
      is_absmax?: (x: X) => boolean,
    }
  ) {
    const callname = `CmpTool.f_cmp2f_cmp_abs @ ${DateToolLocal.time2iso(new Date())}`;

    return (x1: X, x2: X) => {


      if (option.is_absmin) {

        // console.log({
        //     callname, x1, x2, 'option.is_absmin(x1)': option.is_absmin(x1), 'option.is_absmin(x2)': option.is_absmin(x2),
        //     '[x1,x2].every(option.is_absmin)': [x1, x2].every(option.is_absmin),
        // });

        if ([x1, x2].every(option.is_absmin)) { return 0; }
        if (option.is_absmin(x1)) { return -1; }
        if (option.is_absmin(x2)) { return 1; }
      }

      if (option.is_absmax) {
        // console.log({callname, x1, x2, 'option.is_absmax(x1)':option.is_absmax(x1), 'option.is_absmax(x2)':option.is_absmax(x2)})
        if ([x1, x2].every(option.is_absmax)) { return 0; }
        if (option.is_absmax(x1)) { return 1; }
        if (option.is_absmax(x2)) { return -1; }
      }

      return f_cmp(x1, x2);
    }

  }

  // static pair2cmp_absolutemin<X>(v1: X, v2: X, is_absolutemin: (x: X) => boolean) {
  //   const b1 = is_absolutemin(v1);
  //   const b2 = is_absolutemin(v2);
  //   if (b1 && b2) { return 0; }
  //   if (b1) { return -1; }
  //   if (b2) { return 1; }
  //   return undefined;
  // }

  // static funcs2f_cmp<K, X>(funcs: {
  //     pair2cmp?: (x1:X, x2:X) => number,
  //     item2key?: (x:X) => K,
  // }): (x: X, y: X) => number {
  //     const self = CmpTool;

  //     const dict2bool = (h) => !!h && Object.keys(h).length > 0;
  //     if(!dict2bool(funcs)){ return self.pair2cmp_default }

  //     const {pair2cmp, item2key} = funcs;
  //     if(pair2cmp){ return pair2cmp; }
  //     if(item2key){ return CmpTool.f_key2f_cmp(item2key); }
  //     return self.pair2cmp_default
  // }

  static pair2eq_strict = <X>(x1: X, x2: X): boolean => x1 === x2;
  static pair2cmp_default<X>(x1: X, x2: X): number {
    if (x1 === x2) { return 0; }
    // if (x1 == null && x2 == null) { return 0; }
    if (x1 == null || x2 == null) { return undefined; }

    if (x1 < x2) { return -1; }
    if (x1 > x2) { return 1; }

    return undefined;

    throw new Error(`x1:${x1}, x2:${x2}`);
  }


  static cmplist2cmp(cmplist: number[]) {
    const n = cmplist.length;
    for (let i = 0; i < n; i++) {
      const c = cmplist[i];
      if (c < 0) { return -1; }
      if (c > 0) { return 1; }
      if (c === 0) { continue; }
      throw new Error(`c:${c}`);
    }
  }

  static f_cmps2f_cmp<X>(
    f_cmps: ((x1: X, x2: X) => number)[],
  ): (x1: X, x2: X) => number {
    const callname = `CmpTool.f_cmps2f_cmp @ ${DateToolLocal.time2iso(new Date())}`;
    if(f_cmps == null){ return undefined; }

    const n = f_cmps.length;

    return (x1: X, x2: X) => {
      for (let i = 0; i < n; i++) {
        const f_cmp = f_cmps[i];
        const c = f_cmp(x1, x2);
        if (c < 0) { return -1; }
        if (c > 0) { return 1; }
        if (c === 0) { continue; }

        console.debug({ callname, c, i, x1, x2 });
        throw new Error(`c:${c}, i:${i}, x1:${x1}, x2:${x2},`);
      }
      return 0;
    }
  }

  // static listpair2cmp(
  //     l1: any[],
  //     l2: any[],
  //     comparators?:((x1:any,x2:any) => number)[],
  // ): number {
  //     const cls = CmpTool;
  //     assert(l1.length === l2.length);

  //     const n = l1.length;

  //     for(let i=0; i<n; i++){
  //         const x1 = l1[i];
  //         const x2 = l2[i];

  //         const comparator = comparators?.[i] ?? cls.pair2cmp_default;

  //         const cmp = comparator(x1, x2);
  //         if(cmp !== 0){ return cmp; }
  //         else{ continue; }
  //     }

  //     return 0;
  // }

  static f_cmp_key2f_cmp_item<K, X>(
    keys2cmp: Comparator<K>,
    item2key: (x: X) => K,
  ): (x: X, y: X) => number {
    return (x, y) => keys2cmp(item2key(x), item2key(y))
  }

  static f_key2f_cmp<X,K=any>(
    item2key: (x: X) => K,
    pair2cmp?: Comparator<K>,
  ): Comparator<X> {
    // const pair2cmp = option?.pair2cmp ?? CmpTool.pair2cmp_default;
    return CmpTool.f_cmp_key2f_cmp_item(
      pair2cmp ?? CmpTool.pair2cmp_default,
      item2key,
    );
  }

  // static f_cmp2f_eq = <X,>(f_cmp: Comparator<X>): Bicomparator<X> => {
  //   return (x1, x2) => {
  //     const cmp = f_cmp(x1, x2);
  //     return cmp != null ? cmp === 0 : undefined;
  //   }
  // }
  // static f_cmp2f_ne = <X,>(f_cmp: Comparator<X>): Bicomparator<X> => {
  //   return (x1, x2) => {
  //     const cmp = f_cmp(x1, x2);
  //     return cmp != null ? (cmp > 0 || cmp < 0) : undefined;
  //   }
  // }
  // static f_cmp2f_eq = <X,>(f_cmp:Comparator<X>): Bicomparator<X> => (x1,x2) => (f_cmp(x1, x2) === 0);

  static f_key2f_eq<X, K=any>(
    f_key: (x: X) => K,
    config?: {
      f_eq?: Bicomparator<K>,
    }
  ): Bicomparator<X> {
    const f_eq = config?.f_eq ?? CmpTool.isTriequal;
    return (x1: X, x2: X) => f_eq(f_key(x1), f_key(x2));
  }

  static f_key2f_ne<X, K=any>(
    f_key: (x: X) => K,
    config?: {
      f_ne?: Bicomparator<K>,
    }
  ): (x1: X, x2: X) => boolean {
    const f_ne = config?.f_ne ?? CmpTool.isTrinotequal;
    return (x1: X, x2: X) => f_ne(f_key(x1), f_key(x2));
  }

  static f_eq2f_changed = <A>(f_eq: Bicomparator<A>,): Bicomparator<A> => FunctionTool.func2negated3(f_eq);
  static f_key2f_changed = lodash.flow(CmpTool.f_key2f_eq, CmpTool.f_eq2f_changed);
  
  // static f_list2f_cmp<X,Y>(
  //     item2list: (x:X) => Y[],
  // ): (x1:X, x2:X) => number{
  //     return CmpTool.f_cmp_key2f_cmp_item(ArrayTool.arrays2cmp, item2list,);
  // }

  static f_cmp2reversed = <X>(f_cmp: Comparator<X>,): Comparator<X> => lodash.flow(f_cmp, NumberTool.negated);

  static f_cmp2f_cmp_stable<X>(
    f_cmp: (x1: X, x2: X) => number,
  ): (xi1: [X, number], xi2: [X, number]) => number {
    return (xi1: [X, number], xi2: [X, number]) => {
      const [x1, i1] = xi1;
      const [x2, i2] = xi2;
      const cmp_x = f_cmp(x1, x2);
      if (cmp_x !== 0) { return cmp_x; }

      return i1 - i2;
    }
  }

  static numdict2f_cmp<X extends Dictkey>(
    numdict: Record<X, number>,
  ): (x1: X, x2: X) => number {
    const lookup = (k: X) => (k in numdict) ? numdict[k] : 0;
    return (k1, k2) => lookup(k1) - lookup(k2);
    // return (k1, k2) => {
    //     const v1 = lookup(k1);
    //     const v2 = lookup(k2);
    //     const v = v1 - v2;
    //     console.log({ k1, k2, v1, v2, v, })
    //     return v;
    // }
  }

  static numdict2f_cmp_desc<X extends Dictkey>(
    numdict: Record<X, number>,
  ): (x1: X, x2: X) => number {
    return CmpTool.f_cmp2reversed(CmpTool.numdict2f_cmp(numdict))
  }

  // static AbsoluteOrder = class {
  //     static f_cmp2absoluted = <T>(
  //         f_cmp: (t1:T, t2:T) => number,
  //         abs: {
  //             item2is_absmin?: (t:T) => boolean,
  //             item2is_absmax?: (t:T) => boolean,
  //         },
  //     ) : ((t1:T, t2:T) => number) => {
  //         const callname = `CmpTool.AbsoluteOrder.f_cmp2absoluted @ ${DateTool.time2iso(new Date())}`;

  //         return (x1:T, x2:T) => {
  //             if(abs.item2is_absmin){
  //                 // console.log({callname, x1, x2});

  //                 const m1 = abs.item2is_absmin(x1);
  //                 const m2 = abs.item2is_absmin(x2);
  //                 if(m1 && m2){ return 0; }
  //                 if(m1){ return -1; }
  //                 if(m2){ return 1; }
  //             }

  //             if(abs.item2is_absmax){
  //                 const mm1 = abs.item2is_absmax(x1);
  //                 const mm2 = abs.item2is_absmax(x2);
  //                 if(mm1 && mm2){ return 0; }
  //                 if(mm1){ return 1; }
  //                 if(mm2){ return -1; }
  //             }

  //             return f_cmp(x1,x2);
  //         }
  //     }

  //     static f_cmp2undef_minned = <T>(f_cmp: (t1:T, t2:T) => number) : ((t1:T, t2:T) => number) => {
  //         const cls = CmpTool.AbsoluteOrder;
  //         return cls.f_cmp2absoluted(f_cmp, {item2is_absmin: x => x===undefined});
  //     }
  //     static f_cmp2undef_maxxed = <T>(f_cmp: (t1:T, t2:T) => number) : ((t1:T, t2:T) => number) => {
  //         const cls = CmpTool.AbsoluteOrder;
  //         return cls.f_cmp2absoluted(f_cmp, {item2is_absmax: x => x===undefined});
  //     }
  // }
}

export class BicmpTool {
  static funcs2func_alltrue<T>(f_bicmps:Bicomparator<T>[]):Bicomparator<T>{

    return (t1: T, t2: T) => {
      // if(!ArrayTool.bool(f_bicmps)){ return undefined; }

      for (const f_bicmp of f_bicmps) {
        if(!f_bicmp(t1,t2)){ return false; }
      }
      return true;
    }
  }

  static funcs2func_anytrue<T>(f_bicmps:Bicomparator<T>[]):Bicomparator<T>{
    return (t1: T, t2: T) => {
      // if(!ArrayTool.bool(f_bicmps)){ return undefined; }

      for (const f_bicmp of f_bicmps) {
        if(f_bicmp(t1,t2)){ return true; }
      }
      return false;
    }
  }

  static pair2gt_default = CmpTool.f_cmp2f_gt(CmpTool.pair2cmp_default);
  static pair2gte_default = CmpTool.f_cmp2f_gte(CmpTool.pair2cmp_default);
  static pair2lt_default = CmpTool.f_cmp2f_lt(CmpTool.pair2cmp_default);
  static pair2lte_default = CmpTool.f_cmp2f_lte(CmpTool.pair2cmp_default);  


}

export class EqualTool {
  static f_always_equal = <X>(x1: X, x2: X) => 0;
  static isLooselyEqual = <X>(x1: X, x2: X): boolean => x1 == x2;
  static isStrictlyEqual = <X>(x1: X, x2: X): boolean => x1 === x2;

  // static is_equal_nullable_ignored<X>(x1: X, x2: X, option?:{isEqual?:Bicomparator<X>}):boolean {
  //   const is_equal = option?.isEqual ?? EqualTool.isStrictlyEqual;

  //   const b = is_equal(x1, x2);
  //   if(b){ return true; }
  //   if(x1 == null || x2 == null){ return undefined; }
  //   return false;
  // }
}

export class Comparatorkit<T>{
  gt: Bicomparator<T>;
  lt: Bicomparator<T>;
  gte: Bicomparator<T>;
  lte: Bicomparator<T>;
  eq: Bicomparator<T>;
  ne: Bicomparator<T>;
  // max: Aggregator<T>;
  // min: Aggregator<T>;

  static comparator2kit = <T>(comparator:Comparator<T>) => {
    return {
      gt: CmpTool.f_cmp2f_gt(comparator),
      gte: CmpTool.f_cmp2f_gte(comparator),
      lt: CmpTool.f_cmp2f_lt(comparator),
      lte: CmpTool.f_cmp2f_lte(comparator),
      eq: CmpTool.f_cmp2f_eq(comparator),
      ne: CmpTool.f_cmp2f_ne(comparator),
      // max: CmpTool.f_cmp2f_max(comparator),
      // min: CmpTool.f_cmp2f_min(comparator),
    };
  }
}