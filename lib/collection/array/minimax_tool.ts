import { Pair } from "../../native/native_tool";
import CmpTool, { Bicomparator, Comparator } from "../../cmp/CmpTool";
import DateTool from "../../date/date_tool";
import ArrayTool from "./array_tool";

export default class MinimaxTool{
  static maxIndex = <X>(array: X[], pair2cmp?: Comparator<X>): number => {
    // https://stackoverflow.com/a/30850912
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce

    if (!ArrayTool.bool(array)) return undefined;

    const f_cmp: Comparator<X> = pair2cmp ? pair2cmp : CmpTool.pair2cmp_default; // CmpTool.funcs2f_cmp(options);
    return array.reduce((iMax, x, i, l) => (f_cmp(x, l[iMax]) > 0 ? i : iMax), 0);
  }
  static minIndex = <X>(array: X[], pair2cmp: Comparator<X> = undefined): number => {
    const callname = `MinimaxTool.minIndex @ ${DateTool.time2iso(new Date())}`;

    if (!ArrayTool.bool(array)) { return undefined; }

    // console.log({callname, array})

    // const pair2cmp = CmpTool.funcs2f_cmp(options);
    const f_cmp: Comparator<X> = pair2cmp ? pair2cmp : CmpTool.pair2cmp_default; // CmpTool.funcs2f_cmp(options);
    const f_lt = CmpTool.f_cmp2f_lt(f_cmp);

    return array.reduce(
      (iMin:number, x, i, l) => iMin == null ? i : (f_lt(x, l[iMin]) ? i : iMin),
      undefined,
    );
  }

  static min<X>(array: X[], pair2cmp?: Comparator<X>): X {
    if(!ArrayTool.bool(array)){ return undefined }

    const iMin = MinimaxTool.minIndex(array, pair2cmp)
    return iMin == null ? undefined : array[iMin]
  }

  static min_icmp = <X>(l:X[], indexpair2cmp?:Comparator<number>):X => {
    const index_best = MinimaxTool.min(
      ArrayTool.range(l?.length),
      indexpair2cmp,
    );
    return l[index_best];
  }

  static max<X>(array: X[], pair2cmp?: Comparator<X>): X {
    if(!ArrayTool.bool(array)){ return undefined }

    const iMax = MinimaxTool.maxIndex(array, pair2cmp);
    return iMax == null ? undefined : array[iMax];
  }

  static minmax = <X>(array: X[], pair2cmp?: Comparator<X>): Pair<X> => [
    MinimaxTool.min(array, pair2cmp),
    MinimaxTool.max(array, pair2cmp),
  ]
}


export class AbsoluteOrder{
  static f_cmp2f_cmp_abs<V>(
    f_cmp_in: Comparator<V>,
    functions: {
      v2is_absmin?: (v: V) => boolean,
      v2is_absmax?: (v: V) => boolean,
      v2is_abseq?: (v: V) => boolean,
    },
  ): (v1: V, v2: V) => number {
    const callname = `AbsoluteOrder.f_cmp2f_cmp_abs @ ${DateTool.time2iso(new Date())}`;

    const {v2is_absmin, v2is_absmax, v2is_abseq} = (functions || {});

    const f_cmp_out = (v1: V, v2: V) => {
      
      if(v2is_abseq){
        const [b1_abseq, b2_abseq] = [v2is_abseq(v1), v2is_abseq(v2)];
        if(b1_abseq || b2_abseq) { return 0; }
      }

      if(v2is_absmin){
        const [b1_absmin, b2_absmin] = [v2is_absmin(v1), v2is_absmin(v2)];
        if (b1_absmin && b2_absmin) { return 0; }
        if (b1_absmin) { return -1; }
        if (b2_absmin) { return 1; }
      }

      if(v2is_absmax){
        const [b1_absmax, b2_absmax] = [v2is_absmax(v1), v2is_absmax(v2)];

        if (b1_absmax && b2_absmax) { return 0; }
        if (b1_absmax) { return 1; }
        if (b2_absmax) { return -1; }
      }

      return f_cmp_in(v1, v2);
    };
    return f_cmp_out;
  }

  static cmp_null2min = AbsoluteOrder.f_cmp2f_cmp_abs(CmpTool.pair2cmp_default, {v2is_absmin: x=> x === null});
  static cmp_null2max = AbsoluteOrder.f_cmp2f_cmp_abs(CmpTool.pair2cmp_default, {v2is_absmax: x=> x === null});

  // static cmp_nullable2min = AbsoluteOrder.f_cmp2f_cmp_abs(CmpTool.pair2cmp_default, {v2is_absmin: x=> x == null});
  // static cmp_nullable2max = AbsoluteOrder.f_cmp2f_cmp_abs(CmpTool.pair2cmp_default, {v2is_absmax: x=> x == null});

  static f_cmp2f_cmp_nullable<K>(f_cmp_in: Comparator<K>,): Comparator<K> {
    return (a: K, b: K) => {
      if (a == null && b == null) { return 0; }
      if (a == null || b == null) { return undefined; }

      return f_cmp_in(a, b);
    }
  }
  

  static f_cmp2f_cmp_nullable2min = <K>(f_cmp_in: Comparator<K>,): Comparator<K> => 
    AbsoluteOrder.f_cmp2f_cmp_abs(f_cmp_in, {v2is_absmin: x=> x == null});
  
  static f_cmp2f_cmp_nullable2max = <K>(f_cmp_in: Comparator<K>,): Comparator<K> =>
    AbsoluteOrder.f_cmp2f_cmp_abs(f_cmp_in, {v2is_absmax: x=> x == null});

  static f_cmp2f_cmp_nullable2eq = <K>(f_cmp_in: Comparator<K>,): Comparator<K> => 
    AbsoluteOrder.f_cmp2f_cmp_abs(f_cmp_in, {v2is_abseq: x=> x == null});

  static f_cmp2f_cmp_infs2minmax = <K>(f_cmp_in: Comparator<K>,): Comparator<K> =>
    AbsoluteOrder.f_cmp2f_cmp_abs(
      f_cmp_in,
      {
        v2is_absmin: x=> x == -Infinity,
        v2is_absmax: x=> x == Infinity,
      },
    );
}
