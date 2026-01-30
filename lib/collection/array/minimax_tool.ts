import lodash from 'lodash'
import { Lastparam, Omitlast, Pair } from "../../native/native_tool";
import CmpTool, { Aggregator, Bicomparator, Comparator, PosetAggregator } from "../../cmp/CmpTool";
import DateTool from "../../date/date_tool";
import ArrayTool from "./array_tool";
import DictTool from "../dict/dict_tool";

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

  static minimals = <X>(
    xs_in: X[],
    option?:{
      comparator: Comparator<X>
    }
  ): X[] => {
    const cls = MinimaxTool;

    const comparator = option?.comparator ?? CmpTool.pair2cmp_default

    if(xs_in == null) return undefined;

    const minimals: X[] = [];

    for (const x_in of xs_in) {
      let is_minimal = true;
      
      // 현재 결과 집합과 비교하여 최적화 시도
      for (let i = 0; i < minimals.length; i++) {
        const x_prev = minimals[i];
        const cmp = comparator(x_in, x_prev);

        // 후보가 기존 원소에 의해 지배됨 -> 후보 탈락
        if (cmp > 0) { is_minimal = false; break; } 
        // 후보가 기존 원소를 지배함 -> 기존 원소 제거
        if (cmp < 0) { minimals.splice(i, 1); i--; }
      }

      if (is_minimal){ minimals.push(x_in); }
    }

    return minimals;
  }
  static theminimal = lodash.flow(MinimaxTool.minimals, ArrayTool.l2one);

  static maximals = <X>(
    xs_in:X[],
    option?:Lastparam<typeof MinimaxTool.minimals>,
  ):X[] => {
    return MinimaxTool.minimals(
      xs_in,
      {
        ...DictTool.keys2excluded(option, ['comparator']),
        comparator: CmpTool.f_cmp2reversed(option?.comparator ?? CmpTool.pair2cmp_default),
      }
    )
  }
  static themaximal = lodash.flow(MinimaxTool.maximals, ArrayTool.l2one);

  static f_cmp2f_max = <X,>(f_cmp: Comparator<X>): Aggregator<X> => { return (l:X[]) => MinimaxTool.max(l, f_cmp); };
  static f_cmp2f_min = <X,>(f_cmp: Comparator<X>): Aggregator<X> => { return (l:X[]) => MinimaxTool.min(l, f_cmp); };

  static f_cmp2f_minimals = <X,>(f_cmp: Comparator<X>): PosetAggregator<X> => { return (l: X[]) => MinimaxTool.minimals(l, {comparator:f_cmp}); };
  static f_cmp2f_maximals = <X,>(f_cmp: Comparator<X>): PosetAggregator<X> => { return (l: X[]) => MinimaxTool.maximals(l, {comparator:f_cmp}); };
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
