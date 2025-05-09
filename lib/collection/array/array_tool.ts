import lodash from 'lodash';
import CmpTool, { Bicomparator, Comparator, EqualTool, Realigner } from '../../cmp/CmpTool';
import FunctionTool from '../../function/function_tool';
import NativeTool, { Dictkey, Pair } from '../../native/native_tool';
import MathTool from '../../number/math/math_tool';
import DictTool from '../dict/dict_tool';

// const assert = require('assert');
const assert = (v:any, msg?:string) => { if(!v){ throw new Error(msg ? `${msg} (${v})` : `${v}`)}}
// var lodash = require('lodash');
// var _ = require('lodash/core');
export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

// export type Bestsinfo<T> = {indexes:number[], values:T[]};
// export type Bestinfo<T> = {index:number, value:T};
export type Indexeditem<T> = {index:number, value:T};

function date2str_time(d: Date) {
  return (d).toISOString().split("T")[1];
}
export default class ArrayTool {
  static one2l = <V>(v: V): V[] => (v == null ? (v as unknown as V[]) : [v]);
  // static only2list = <V>(v: V): V[] => (v == null ? undefined : [v]);

  // static flat_notnull = <X>(ll: X[][]): X[] => ll?.map((l) => l ?? [])?.flat();

  // static f_array2f_only = <T>(f_array: FuncXX<T[]>) => {
  //   return (t: T) => ArrayTool.l2one(f_array(ArrayTool.one2l(t)));
  // };

  static firstlast = <X>(l:X[]):X[] => {
    if(l==null) return undefined;
    if(l?.length == 0) return l;
    if(l?.length == 1) return l;
    return [l[0], l[l?.length-1]];
  }

  static has_nullable = (l: any[]): boolean => l?.some((x) => x == null);

  static findIndex = <X>(l: X[], predicate: (x: X, i?: number, l?: X[]) => boolean): number => {
    const i = l?.findIndex(predicate);
    if (i == null) {
      return undefined;
    }

    return i >= 0 ? i : undefined;
  };
  
  static f2f_map = FunctionTool.f112fnn;
  // static f2f_map = <I,O>(
  //   f:(i:I) => O,
  // ):((is:I[]) => O[]) => {
  //   return (is:I[]):O[] => is?.map(i => f(i));
  // }

  static reducer2reducer_immuting = <T>(
    f:(l:T[]) => T[],
    option?:{is_equal?:(l1:T[], l2:T[]) => boolean,}
  ) => {

    const is_equal = option?.is_equal ?? ArrayTool.areAllTriequal;
    return (l:T[]):T[] => {
      return is_equal(l, f(l)) ? l : f(l)
    }
  }

  static f_only2f_many = <I, O>(
    f_only: (x: I) => O,
    f_etc: (l: I[], o_only?: O) => O
    // l:X[],
  ): ((l: I[]) => O) => {
    return (l: I[]) => {
      if (l == null) {
        return f_etc(l);
      }

      const o0 = f_only(l[0]);
      if (l.length == 1) {
        return o0;
      }
      if (l.length > 1) {
        return f_etc(l, o0);
      }
    };
  };

  static k2v_list_to_ks2v_list = <K, V>(k2v_list: [K, V][]): [K[], V][] => k2v_list?.map(([k, v]) => [[k], v]);
  static default_if_empty<X>(array: X[], v_default: X[]): X[] {
    return ArrayTool.bool(array) ? array : v_default;
  }

  static f_eq2f_is_prefix<T>(f_eq: Bicomparator<T>): Bicomparator<T[]> {
    return (prefix: T[], l: T[]): boolean => {
      const callname = `ArrayTool.f_eq2f_is_prefix @ ${date2str_time(new Date())}`;

      if (prefix == null || l == null) {
        return undefined;
      }
      if (prefix.length > l.length) {
        return false;
      }

      return prefix.every((token, i) => f_eq(token, l[i]));
    };
  }

  static is_triprefix = ArrayTool.f_eq2f_is_prefix(CmpTool.isTriequal);
  static is_biprefix = ArrayTool.f_eq2f_is_prefix(CmpTool.isBiequal);
  static is_prefix = FunctionTool.deprecated(ArrayTool.is_triprefix);

  static array2comparator_prefer_included<V>(l: V[]): Comparator<V> {
    return ArrayTool.bool(l) ? CmpTool.f_key2f_cmp((v: V) => (ArrayTool.in(v, l) ? 0 : 1)) : EqualTool.f_always_equal;
  }

  static size2array(n: number) {
    return Array.apply(null, Array(n)).map(function () {});
  }

  /**
   * https://stackoverflow.com/a/55480964/1902064
   */
  static shuffle<T>(
    array: T[],
    options?: {
      f_random?: () => number;
    }
  ): T[] {
    const f_random = options?.f_random ?? Math.random;
    let temp: T;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(f_random() * (i + 1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
  static shuffled<T>(
    array_in: T[],
    options?: {
      f_random?: () => number;
    }
  ): T[] {
    const cls = ArrayTool;
    const array_out = [...array_in];
    return cls.shuffle(array_out, options);
  }

  // static seed2shuffled<T>(
  //     array:T[],
  //     seed:number,
  // ){
  //     return ArrayTool.shuffled(array, { f_random: RandomTool.seed2f_pseudorandom(seed) });
  // }

  static join = (delim: string, array: string[]): string => (array ? array.join(delim) : undefined);
  static is_empty = <T>(array: T[]): boolean => (array == null ? undefined : array.length === 0);
  static bool = <T>(array: T[]): boolean => (array == null ? undefined : !ArrayTool.is_empty(array));
  static itemgetter = (i: number) => (l: any[]) => l[i];
  static all = <T>(array: T[], option?:{item2bool?:(t:T) => boolean},): boolean => array?.every(option?.item2bool ?? (x => !!x));
  static any = <T>(array: T[], option?:{item2bool?:(t:T) => boolean},): boolean => array?.some(option?.item2bool ?? (x => !!x));

  static any_nullbypassed = FunctionTool.func2undef_ifany_nullarg(ArrayTool.any);
  static all_nullbypassed = FunctionTool.func2undef_ifany_nullarg(ArrayTool.all);

  static map = <I, O>(array: I[], item2value: (i: I) => O) => (array ? array.map(item2value) : undefined);
  static indexOf = <T>(array: T[], v: T) => v == null ? undefined : array?.indexOf(v);

  static x2first<T>(x: T | T[]) {
    return ArrayTool.is_array(x) ? x?.[0] : x;
  }
  static span2slice(span: Pair<number>): Pair<number> {
    return [span[0], span[1] - span[0]];
  }

  static upsert<T>(
    array: T[],
    item: T,
    options?: {
      isEqual?: (t1: T, t2: T) => boolean;
    }
  ) {
    const cls = ArrayTool;
    const isEqual = options?.isEqual ?? ((x1, x2) => x1 === x2);

    const index = array.findIndex((x) => isEqual(x, item));
    return index < 0 ? [...array, item] : cls.splice(array, index, 1, item);
    // if(index<0){ [...array, item]; }
    // else{ cls.splice(array, ) }
    // return array;
    // return index < 0 ? [...array, item] : array;
  }

  static push_unless_exists<T>(
    array: T[],
    item: T,
    options?: {
      isEqual?: (t1: T, t2: T) => boolean;
    }
  ) {
    const isEqual = options?.isEqual ?? ((x1, x2) => x1 === x2);

    const index = array.findIndex((x) => isEqual(x, item));
    if (index < 0) {
      array.push(item);
    }
    return array;
    // return index < 0 ? [...array, item] : array;
  }

  static cap = <T>(arrays: T[][]): T[] => (arrays == null ? undefined : lodash.intersection(...arrays));
  static has_cap = lodash.flow(ArrayTool.cap, ArrayTool.bool);
  
  static cup = <T>(arrays: T[][]): T[] => (arrays == null ? undefined : lodash.union(...arrays));

  static subtract<T>(l1: T[], l2: T[]): T[] {
    const s2 = new Set(l2);
    return l1?.filter((x) => !s2?.has(x));
  }
  static xor<T>(l1: T[], l2: T[]): T[] {
    return lodash.xor(l1, l2);
    // const cls = ArrayTool;
    // return cls.subtract(cls.cup([l1, l2]), cls.cap([l1, l2]));
  }
  static covers<T>(l1: T[], l2: T[]): boolean {
    if (l1 == null || l2 == null) {
      return undefined;
    }
    return !ArrayTool.bool(ArrayTool.subtract(l2, l1));
  }

  static array_comparator2indexcomparator<T>(array: T[], comparator: Comparator<T>): Comparator<number> {
    return (i1: number, i2: number) => comparator(array[i1], array[i2]);
  }

  static minindexeds = <T>(
    items: T[],
    options?: {
      comparator?: Comparator<T>;
    }
  ): Indexeditem<T>[] => {
    const cls = ArrayTool;
    const callname = `ArrayTool.minindexeds @ ${date2str_time(new Date())}`;

    if (!ArrayTool.bool(items)) return undefined;

    const n = items.length;
    if (n === 0) return undefined;

    const comparator = options?.comparator ?? CmpTool.pair2cmp_default;

    const indexes = ArrayTool.range(0, n)
      .reduce<number[]>((is, i) => {
        if(!ArrayTool.bool(is)){ return [i]; }

        const cmp = comparator(items[is[0]], items[i]);
        if(cmp<0) return is;
        if(cmp===0) return [...is, i];
        if(cmp>0) return [i];

        throw new Error(`Invalid cmp: ${cmp}`);
      }, []);

    // console.log({callname, minindex,})
    return indexes?.map(i => ({value:items?.[i], index:i}));
    // return {indexes, values:indexes?.map(i => items?.[i])};
  }
  static minindexes = lodash.flow(ArrayTool.minindexeds, l => l?.map(x => x?.index));
  static mins = lodash.flow(ArrayTool.minindexeds, l => l?.map(x => x?.value));

  static minindexed = lodash.flow(ArrayTool.minindexeds, l => l?.[0]);
  // static minindexed = lodash.flow(ArrayTool.minindexeds, h => !h ? undefined : ({index:h.indexes[0], value:h.values[0]}));
  static minindex = lodash.flow(ArrayTool.minindexed, h => h?.index);
  static min = lodash.flow(ArrayTool.minindexed, h => h?.value);

  static maxindexeds = <T>(
    array: T[],
    options?: Parameters<typeof ArrayTool.minindexeds<T>>[1],
  ): Indexeditem<T>[] => {
    return array == null
      ? undefined
      : ArrayTool.minindexeds<T>(
      array,
      {
        ...options,
        comparator: CmpTool.f_cmp2reversed<T>(options?.comparator ?? CmpTool.pair2cmp_default),
      },
    );
  }
  static maxindexes = lodash.flow(ArrayTool.maxindexeds, l => l?.map(x => x?.index));
  static maxs = lodash.flow(ArrayTool.maxindexeds, l => l?.map(x => x?.value));

  static maxindexed = lodash.flow(ArrayTool.maxindexeds, l => l?.[0]);
    
  // static maxindexed = lodash.flow(ArrayTool.maxindexeds, h => !h ? undefined : ({index:h.indexes[0], value:h.values[0]}));
  static maxindex = lodash.flow(ArrayTool.maxindexed, h => h?.index);
  static max = lodash.flow(ArrayTool.maxindexed, h => h?.value);

  static array2pivot_aligned<X, K extends Dictkey = Dictkey>(items: X[], pivots: K[], item2pivot: (t: X) => K): X[] {
    if (pivots == null) {
      return undefined;
    }
    if (!ArrayTool.bool(pivots)) {
      return [];
    }

    const dict_pivot2index: Record<K, number> = ArrayTool.array2dict_item2index(pivots);
    const item2index = (x: X) => dict_pivot2index[item2pivot(x)];
    return ArrayTool.array2rearranged(items, item2index, pivots?.length);
  }

  static array2rearranged<X>(items: X[], item2index: (x: X) => number, rearrange_size: number): X[] {
    if (rearrange_size == null) {
      return undefined;
    }

    const m = rearrange_size;
    const items_out = new Array<X>(m);

    (items ?? []).forEach((v, i) => {
      const j = item2index(v);
      items_out[j] = v;
    });

    return items_out;
  }

  static array2first_notnull<T>(array: T[]): T {
    return array?.find((x) => x != null);
  }

  static nsect_by = <X = any>(array: X[], funcs: ((x: X, i?: number, l?: X[]) => boolean)[]): X[][] => {
    if (array == null) {
      return undefined;
    }

    const p = funcs.length;
    const rv = Array.from(Array(p + 1), () => []);

    for (let i = 0; i < array?.length; i++) {
      const x: X = array[i];

      const jj = ArrayTool.range(p).find((j) => funcs[j](x, i, array)) ?? p;
      rv[jj].push(x);
    }
    return rv;
  };
  static bisect_by = <T = any>(
    array: T[],
    is_valid: (t: T, i?: number, l?: T[]) => boolean
    // is_valid: ArrayElement<Parameters<typeof ArrayTool.nsect_by>[1]>,
  ): Pair<T[]> => {
    return ArrayTool.nsect_by(array, [is_valid]) as Pair<T[]>;
  };

  static array2filtered_3state<T>(array: T[], is_valid: (t: T) => boolean): T[] {
    if (array == null) {
      return undefined;
    }

    const mask = array.map(is_valid);
    if (mask.some((x) => x == null)) {
      return undefined;
    }

    return array.filter((v, i) => mask[i]);
  }

  // static array2dict_state2items<T>(array:T[], is_valid:(t:T) => boolean):T[]{
  //     if(array==null){ return undefined; }

  //     const mask = array.map(is_valid);
  //     if(mask.some(x => x == null)){ return undefined; }

  //     return array.filter((v,i) => mask[i]);
  // }

  static f_list2codeced(
    f_list: (l: any[], ...args: any[]) => any[],
    codec: {
      encode?: (x: any) => any;
      decode?: (x: any) => any;
    }
  ) {
    const encode = codec.encode ?? ((x) => x);
    const decode = codec.decode ?? ((x) => x);

    return (l: any[], ...args) => f_list(l.map(encode), ...args).map(decode);
  }

  static f_list2codeced_undef2null(f_list: (l: any[], ...args: any[]) => any[]) {
    const codec = NativeTool.codec_undefined2null();
    return ArrayTool.f_list2codeced(f_list, codec);
  }

  // static f_list2codeced<I, E1, E2, O>(
  //     f_list: (l: E1[]) => E2[],
  //     codec: {
  //         encode?: (x: I) => E1,
  //         decode?: (x: E2) => O,
  //     }
  // ): ((l: I[]) => O[]) {
  //     const encode = codec.encode ?? (x => (x as unknown as E1));
  //     const decode = codec.decode ?? (x => (x as unknown as O));

  //     return (l: I[]) => f_list(l.map(encode)).map(decode);
  // }

  static arrays2merged_orderpreserving<K extends Dictkey>(arrays: K[][]): K[] {
    const dict_k2i2j = {} as Record<K, Record<number, number>>;

    arrays.forEach((array, i) => {
      array.forEach((k, j) => {
        dict_k2i2j[k] = { ...(dict_k2i2j[k] || {}), [i]: j };
      });
    });

    const keys = ArrayTool.sorted(
      Object.keys(dict_k2i2j).map((k) => k as Dictkey),
      (k1, k2) => {
        const dict1_i2j: Record<number, number> = dict_k2i2j[k1];
        const dict2_i2j: Record<number, number> = dict_k2i2j[k2];

        for (const [i2, j2] of Object.entries(dict2_i2j)) {
          if (!(i2 in dict1_i2j)) {
            continue;
          }

          const j1 = dict1_i2j[i2];
          return j1 - j2;
        }
        return 0;
      }
    );
    return keys as K[];
  }

  /**
   * ref: https://stackoverflow.com/a/55001358/1902064
   * @param arrays
   */
  static cartesian_deprecated<T = any>(arrays: T[][]): T[][] {
    return arrays.reduce(
      (a, b) => {
        return a
          .map((x) => {
            return b.map((y) => {
              return x.concat(y);
            });
          })
          .reduce((c, d) => c.concat(d), []);
      },
      [[]] as T[][]
    );

    // return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
  }

  // static cartesian<T = any>(ll_in: T[][]): T[][] {
  //   return ll_in.reduce(
  //     (ll_prev, array) => {
  //       return ll_prev.map(l_prev => {
  //         return array.map(x => [...l_prev, x]); // l_posts
  //       }) // l_posts_list
  //       .reduce((ll_post, l_posts) => [...ll_post, ...l_posts], []);  // flatten
  //     },
  //     [[]] as T[][]
  //   );
  // }

  static cartesian = <T=any>(ll_in:T[][]):T[][] => ll_in?.reduce(
    (ll_prev:T[][], l:T[]) => ll_prev.flatMap(l_prev => l.map(x => [...l_prev, x])), // l_posts_list
    [[]] as T[][],
  );
  
  static cartesian2 = <X,Y>(xs:X[], ys:Y[]): [X,Y][] => {
    return (xs == null || ys == null) ? undefined : xs?.flatMap(x => ys?.map(y => [x,y] as [X,Y]));
  }

  static cartesian3 = <X,Y,Z>(xs:X[], ys:Y[], zs:Z[]): [X,Y,Z][] => {
    if(xs == null){ return undefined; }
    if(ys == null){ return undefined; }
    if(zs == null){ return undefined; }

    return xs.flatMap(x => {
      return ys.flatMap(y => {
        return zs.map(z => [x,y,z] as [X,Y,Z]);
      })
    });
  }

  static filter<X>(f: (x: X) => boolean, l: X[]): X[] {
    if (!ArrayTool.bool(l)) {
      return l;
    }
    return l.filter(f);
  }
  static filtered<X>(f: (x: X) => boolean, l: X[]): X[] {
    if (!ArrayTool.bool(l)) {
      return l;
    }
    return [...l.filter(f)];
  }

  static findLastIndex<T>(array: T[], is_valid: (t: T, i?: number, l?: T[]) => boolean): number {
    if (!array) {
      return undefined;
    }

    const n = array.length;
    const i2index = (i: number) => (i < 0 ? i : n - 1 - i);

    const i = ArrayTool.range(n).findIndex((i) => is_valid(array[i2index(i)], i2index(i), array));
    return i2index(i);
  }

  static findIndexLastValid<T>(array: T[], is_valid: (t: T, i?: number, l?: T[]) => boolean): number {
    if (!array) {
      return undefined;
    }

    const index_invalid = array.findIndex((x, i) => !is_valid(x, i, array));
    return (index_invalid < 0 ? array.length : index_invalid) - 1;
  }
  // static findFirstInvalid<T>(array:T[], is_valid:(t:T, i?:number) => boolean): number{
  //     const lastIndex = ArrayTool.findLastIndex(array, is_valid);
  //     if(lastIndex==null){ return undefined; }
  //     return lastIndex + 1;
  // }

  // static items_list2tuple_comparator = <T extends any[]>(items_list: any[][]): ((tuple1: T, tuple2: T) => number) => {
  //   const callname = `ArrayTool.items_list2tuple_comparator @ ${date2str_time(new Date())}`;

  //   const dict_item2index_list = items_list.map(items => ArrayTool.array2dict_item2index(items));

  //   return (tuple1: T, tuple2: T) => {
  //     const p = tuple1.length;
  //     if (tuple2.length !== p) { throw new Error(`tuple1.length:${tuple1.length}, tuple2.length:${tuple2.length}`); }

  //     for (const i of ArrayTool.range(p)) {
  //       const dict_item2index = dict_item2index_list[i];
  //       const v1 = tuple1[i];
  //       const v2 = tuple2[i];

  //       const i1 = dict_item2index[v1];
  //       const i2 = dict_item2index[v2];
  //       // console.log({callname, i1, i2, v1, v2, dict_item2index});

  //       return i1 - i2;
  //     }
  //     return 0;
  //   }
  // }

  static force_array<X>(v: X | X[]): X[] {
    if (v === undefined) {
      return undefined;
    }
    return Array.isArray(v) ? v : [v];
  }

  static transpose<X>(array: X[][]): X[][] {
    return Object.keys(array[0]).map((j) => {
      return array.map((row) => row[j]).filter((x) => x !== undefined);
    });
  }

  static indexes2filtered<X>(indexes: number[], values_in: X[]): X[] {
    return indexes.map((i) => values_in[i]);
  }
  // static takewhile<X>(item2bool: (item: X) => boolean, items: X[]): X[] {
  //   return Array.from(IterTool.takewhile(item2bool, items,));
  // }

  static span2sliced<X>(span: Pair<number>, items: X[]): X[] {
    const [s, e] = span;
    return items?.slice(s, e);
  }

  static values2indexes<X extends string | number>(values: X[], values_ordered: X[]): number[] {
    const n = ArrayTool.len(values_ordered);
    const dict_value2index: Record<X, number> = ArrayTool.array2dict(ArrayTool.range(0, n), (i) => values_ordered[i]);
    const indexes = values.map((v) => DictTool.get(dict_value2index, v));
    return indexes;
  }

  static flatten<V>(arrays: V[][]): V[] {
    // https://stackoverflow.com/a/10865042/1902064
    return arrays == null ? undefined : [].concat(...arrays);
  }
  static array2dict_item2count<X extends Dictkey = Dictkey>(l: X[]): Record<X, number> {
    return l?.reduce((h, x) => {
      h[x] = x in h ? h[x] + 1 : 1;
      return h;
    }, {} as Record<X, number>);
  }

  static move(array_in, fromIndex, toIndex) {
    const self = ArrayTool;

    const array_out = Array.from(array_in);
    const [removed] = array_out.splice(fromIndex, 1);
    array_out.splice(toIndex, 0, removed);

    return array_out;
  }
  static splice2self<T>(array: T[], start: number, deleteCount?: number, ...items: T[]): T[] {
    array.splice(start, deleteCount, ...items);
    return array;
  }

  static splice<T>(array: T[], start: number, deleteCount: number = undefined, ...items: T[]): T[] {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    const n = ArrayTool.len(array);

    const l_head = (() => {
      if (start >= n) {
        return array;
      }
      if (start <= -n) {
        return [];
      }
      if (start < 0) {
        return array.slice(0, n + start);
      }
      return array.slice(0, start);
    })();

    const l_tail = (() => {
      if (deleteCount === undefined) {
        return [];
      }
      if (deleteCount >= n) {
        return [];
      }
      if (deleteCount <= 0) {
        return array.slice(start);
      }

      if (start < 0 && start + deleteCount >= 0) {
        return [];
      }
      return array.slice(start + deleteCount);
    })();

    return [...l_head, ...items, ...l_tail];
  }
  static index2updated<T>(array: T[], index: number, item: T): T[] {
    return ArrayTool.splice(array, index, 1, item);
  }

  static filter2first_updated<T>(
    array: T[],
    filter: (t: T) => boolean,
    item: T,
    options?: {
      upsert?: boolean;
    }
  ): T[] {
    const { upsert } = options || {};
    const index = array.findIndex(filter);

    return index < 0 ? (upsert ? [...array, item] : array) : ArrayTool.index2updated(array, index, item);
  }

  static filterInPlace<T>(a: T[], item2valid: (t: T, i: number, a: T[]) => boolean) {
    // SOURCE: https://stackoverflow.com/a/37319954
    let i = 0,
      j = 0;

    while (i < a.length) {
      const val = a[i];
      if (item2valid(val, i, a)) a[j++] = val;
      i++;
    }

    a.length = j;
    return a;
  }
  static is_array(array) {
    return Array.isArray(array);
  }
  static first<T>(array: T[]): T {
    return ArrayTool.bool(array) ? array[0] : undefined;
  }
  static last<T>(array: T[]): T {
    return ArrayTool.bool(array) ? array[array.length - 1] : undefined;
  }

  static unaryslice(n, array) {
    if (!ArrayTool.bool(array)) {
      return array;
    }
    if (n >= 0) {
      return array.slice(0, n);
    }
    if (n < 0) {
      return array.slice(n);
    }
    throw new Error(`n: ${n}`);
  }

  static head<X>(n: number, array: X[]): X[] {
    if (n === Infinity) {
      return array;
    }
    return ArrayTool.bool(array) ? array.slice(0, n) : array;
  }

  static tail<X>(n: number, array: X[]): X[] {
    return ArrayTool.bool(array) ? array.slice(-n) : array;
  }

  static consume(n, array) {
    return ArrayTool.bool(array) ? array.slice(n) : array;
  }

  static arrays2flatten_headfirst<V>(arrays: V[][]): V[] {
    return ArrayTool.flatten(arrays);
  }

  static arrays2flatten_tailfirst<V>(arrays: V[][]): V[] {
    const arrays_reversed = arrays.map(ArrayTool.reversed);
    const array_out = ArrayTool.flatten(arrays_reversed);

    // console.log({arrays, arrays_reversed, array_out});

    return array_out;
  }

  // static indexes_list2headN(k:number, indexes_list:number[][]){
  //     let indexes_list_out = [];
  //     for(const indexes of indexes_list){
  //         const p = ArrayTool.len(indexes_list_out);
  //         if(p>=k){ break; }

  //         const indexes_added = ArrayTool.head(k-p, indexes);
  //         indexes_list_out.push(...indexes_added);
  //     }
  // }

  static interpolate = <T>(delim: T, array: T[]): T[] => {
    return array?.reduce((accu: T[], elem: T) => {
      return accu === undefined ? [elem] : [...accu, delim, elem];
    }, undefined) as T[];
  };

  static intertwine = <T>(l1: T[], l2: T[]): T[] => {
    const [p1, p2] = [l1, l2].map((x) => x?.length);
    if (p2 !== p1 - 1) {
      throw new Error(`p1:${p1}, p2:${p2}`);
    }

    return lodash.zip(l1, l2).flat().slice(0, -1);
  };

  static lookup<T>(array: T[], index: number, v_missing: T = undefined!): T {
    const cls = ArrayTool;

    if (index == null) {
      return undefined;
    }
    if (!ArrayTool.bool(array)) {
      return undefined;
    }

    const n = ArrayTool.len(array);
    return index < n ? array[index] : v_missing;
  }

  static index2rotationed(index: number, length: number) {
    return ((index % length) + length) % length;
  }

  static lookup_rotational<T>(array: T[], index: number): T {
    if (!ArrayTool.bool(array)) {
      return undefined;
    }

    const index_rotationed = ArrayTool.index2rotationed(index, ArrayTool.len(array));
    return array[index_rotationed];
  }

  static contains_null_or_undefined(array) {
    // Don't use this. Just call "some" directly.
    return array.some(NativeTool.is_null_or_undefined);
  }

  // static f_key2f_reducer_array2dict = <K extends Dictkey, V>(
  //   item2key: (v: V) => K,
  // ) => {
  //   return (h: Record<K, V>, v: V) => {
  //     const callname = `ArrayTool.f_key2f_reducer_array2dict @ ${date2str_time(new Date())}`;

  //     const k: K = item2key(v)
  //     // if((k as string).includes('fQ2DgXzijprbnuqbK84X_')){
  //     // console.log({callname, h, k});
  //     // }

  //     if (k in h) {
  //       throw new Error(`k:${k as string}, h:${JSON.stringify(h)}`);
  //     }
  //     h[k] = v;
  //     return h;
  //   };
  // };

  static array2dict<K extends Dictkey, V>(items: V[], item2key: (v: V) => K): Record<K, V> {
    const cls = ArrayTool;
    const callname = `ArrayTool.array2dict @ ${date2str_time(new Date())}`;

    const keys = items?.map(item2key);
    return items?.reduce((h: Record<K, V>, v: V, i: number) => {
      const k: K = keys?.[i];

      if (k in h) {
        const indexes_duplicate = keys
          ?.map((k, i) => ({ k, i }))
          ?.filter((x) => x.k == k)
          ?.map((x) => x.i);
        console.log({
          callname,
          k,
          v,
          indexes_duplicate,
          "h[k]": h[k],
        });
        throw new Error(`k:${k as string}, h:${JSON.stringify(h)}`);
      }
      h[k] = v;
      return h;
    }, {} as Record<K, V>);
  }

  // static array2dict_alias<K extends Dictkey, V>(
  //     items: V[],
  //     item2aliases: (v: V) => K[],
  // ): Record<K, V> {
  //     const cls = ArrayTool;

  //     const kv_list = items.map(item => item2aliases(item).map(alias => ({[alias]:item})).flat()).flat();
  //     return DictTool.merge_dicts(kv_list, DictTool.WritePolicy.no_duplicate_key)
  // }

  static Deprecated = class {
    static array2dict<K extends Dictkey, X, V>(
      items: X[],
      item2key: (x: X) => K,
      item2value?: (x: X) => V
      // vwrite = undefined,
    ): Record<K, V> {
      // assert(vwrite === undefined)  // assuming overwrite
      if (items === undefined) {
        return undefined!;
      }

      // if (item2value === undefined) { item2value = x => (x as unknown as V) }

      const reducer = (h: Record<K, V>, x: X) => {
        const k: K = item2key(x);
        // console.log({h, k});
        assert(!(k in h), `k:${k as string}, h:${JSON.stringify(h)}`);
        const v: V = item2value ? item2value(x) : (x as unknown as V);
        h[k] = v;
        return h;
      };
      return items.reduce(reducer, {} as Record<K, V>);
    }
  };

  static array2dict_item2index<X extends Dictkey>(items: X[]): Record<X, number> {
    if (items == null) {
      return undefined;
    }

    const n = ArrayTool.len(items);
    const dict_item2index = ArrayTool.array2dict(ArrayTool.range(0, n), (i) => items[i]) as Record<X, number>;
    return dict_item2index;
  }

  static array2f_index<X extends Dictkey>(array: X[]): (x: X) => number {
    const cls = ArrayTool;

    const dict_item2index = cls.array2dict_item2index(array);
    return (x: X) => dict_item2index?.[x];
  }

  static array2indexcomparator<X extends Dictkey>(
    array: X[]
    // option?:{comparator?:Comparator<X>,},
  ): Comparator<X> {
    const cls = ArrayTool;

    const dict_item2index = cls.array2dict_item2index(array);

    return CmpTool.f_key2f_cmp((x) => dict_item2index?.[x]);
  }

  static assert_length = <T>(l: T[], lengths: number[]): T[] => {
    if (l == null) return undefined;

    const n = l?.length;
    assert(ArrayTool.in(n, lengths), `n=${n}`);
    return l;
  };

  static is_singleton = (l: any[]): boolean => l?.length == 1;

  static assert_onekidpolicy = <T>(l: T[]): T[] => ArrayTool.assert_length(l, [0, 1]);
  static l2one = <T>(l: T[], option?:{relaxed?:boolean}): T => {
    if(l == null){ return undefined; }

    const n = l?.length;
    if(ArrayTool.in(n, [0,1])){ return l?.[0]; }
    
    if(option?.relaxed){ return undefined; }
    throw new Error(`l?.length=${l?.length}`);
  }
  // static l2onlykid_relaxed = <T>(l: T[]): T => (ArrayTool.is_singleton(l) ? l[0] : undefined);

  static uniqone = lodash.flow(ArrayTool.uniq, ArrayTool.l2one);

  static filter2one = <T>(
    f_filter: (t: T) => boolean,
    items_in: T[],
    option?:{
      emptyresult_forbidden?:boolean,
    }
  ): T => {
    const callname = `ArrayTool.filter2one @ ${date2str_time(new Date())}`;

    if (!ArrayTool.bool(items_in)){
      if(option?.emptyresult_forbidden) throw new Error(`items_in: ${items_in}`)
      return undefined!;
    }

    const items_out = items_in.filter(f_filter);
    if (items_out && items_out?.length > 1) {
      console.log({ callname, "items_out?.length": items_out?.length, items_out });
    }

    if(option?.emptyresult_forbidden){
      if(items_out?.length != 1) throw new Error(`items_out?.length: ${items_out?.length}`);
    }
    const item: T = ArrayTool.l2one(items_out);
    return item;
  };

  static chain = <T>(...arrays: T[]) => [].concat(...arrays.filter((x) => !!x));

  static uniq<T = any>(
    items: T[],
    item2key?: (t: T) => string,
  ): T[] {
    if (items == null) return undefined;

    const x2key = item2key ?? ((item) => item as unknown as string);

    var h: Record<string, number> = {};
    var items_uniq: T[] = [];
    for (var i = 0; i < items.length; i++) {
      const item = items[i];
      const key = x2key(item);
      if (key in h) {
        continue;
      }

      h[key] = 1;
      items_uniq.push(item);
    }
    return items_uniq;
  }

  static f_array2f_array_backtoforward = <T, A extends any[]>(
    f_array:(l:T[], ...args:A) => T[],
  ) : ((l:T[], ...args:A) => T[]) => {
    return (l:T[], ...args:A) => ArrayTool.reversed(f_array(ArrayTool.reversed(l), ...args));
  }

  static uniq_rearpreferred = ArrayTool.f_array2f_array_backtoforward(ArrayTool.uniq);

  static push2self<T>(items: T[], item: T): T[] {
    items.push(item);
    return items;
  }

  static append2self<T>(items: T[], item: T): T[] {
    return ArrayTool.push2self(items, item);
  }

  // static uniq(items){
  //     // https://stackoverflow.com/a/33121880
  //     return [...new Set(items)]
  // }

  // static array2duplicate_index(array){
  //     const mapper = x => lodash.get(x, path);
  //     const set = [...new Set(array.map(mapper))];
  //     const isUnique = list.length === set.length;
  //     if (isUnique) {
  //         return undefined;
  //     }

  //     const index = list.findIndex((l, i) => mapper(l) !== set[i]);
  //     return index;
  // }

  static array2duplicates<X extends Dictkey>(array: X[]): Record<X, number[]> {
    if (array == null) {
      return undefined;
    }

    var duplicates = {} as Record<X, number[]>;
    for (var i = 0; i < array.length; i++) {
      if (duplicates.hasOwnProperty(array[i])) {
        duplicates[array[i]].push(i);
      } else if (array.lastIndexOf(array[i]) !== i) {
        duplicates[array[i]] = [i];
      }
    }

    return duplicates;
  }

  // static array2duplicate_indexes<X extends Dictkey>(
  //   array: X[],
  // ): number[] {
  //   if(array == null){ return undefined; }

  //   const duplicates: Record<X, number[]> = ArrayTool.array2duplicates(array);
  //   const indexes: number[] = Object.entries(duplicates).map(([k, indexes]: [string, number[]]) => indexes).flat(1).sort();
  //   return indexes;
  // }

  static range(
    v1: number,
    v2?: number,
    option?: {
      step?: number;
    }
  ): number[] {
    // [...Array(5).keys()]
    const self = ArrayTool;
    const callname = `ArrayTool.range @ ${date2str_time(new Date())}`;

    if (v1 == null) {
      return undefined;
    }

    const { step: step_in } = option ?? {};
    const step = step_in ?? 1;

    const [s, e] = v2 != null ? [v1, v2] : [0, v1];
    if (s > e) {
      throw new Error(`s:${s}, e:${e}`);
    }

    const count = Math.ceil((e - s) / step);
    return Array.from(Array(count).keys()).map((i) => i * step + s);
  }

  static in<X>(x: X, l: X[]): boolean {
    // if(!l){ return false; }
    return l?.includes(x);
  }

  static hasmatch<X>(predicate: (value: X, index: number, obj: X[]) => boolean, l: X[]): boolean {
    return l?.find(predicate) !== undefined;
  }
  static len<X>(l: X[]): number {
    // if (!l) { return undefined!; }
    return l?.length;
  }
  static count<X>(l: X[]): number {
    return ArrayTool.len(l);
  }

  static f_bool2f_filter = <X, A extends any[]>(f_bool: (x:X, ...args:A) => boolean,): ((l:X[], ...args:A) => X[]) => {
    return (l:X[], ...args:A) => {
      const bs = l?.map(x => f_bool(x, ...args));
      return ArrayTool.all(bs) ? l : l?.filter((_,i) => bs[i]);
    }
  };

  static f_bool2f_every = <X, A extends any[]>(f_bool: (x:X, ...args:A) => boolean,): ((l:X[], ...args:A) => boolean) => {
    return (l:X[], ...args:A) => l?.every(x => f_bool(x, ...args));
  };

  static f_bool2f_some = <X, A extends any[]>(f_bool: (x:X, ...args:A) => boolean,): ((l:X[], ...args:A) => boolean) => {
    return (l:X[], ...args:A) => l?.some(x => f_bool(x, ...args));
  };

  static f_bicmp2f_every = <X>(f_bicmp: Bicomparator<X>): Bicomparator<X[]> => {
    return (a: X[], b: X[]) => {
      // https://stackoverflow.com/a/16436975

      if (a === b) return true;
      if (a == null || b == null) return undefined;
      if (a.length !== b.length) return false;

      // If you don't care about the order of the elements inside
      // the array, you should sort both arrays here.
      // Please note that calling sort on an array will modify that array.
      // you might want to clone your array first.

      for (var i = 0; i < a.length; ++i) {
        if (!f_bicmp(a[i], b[i])) {
          return false;
        }
      }
      return true;
    };
  };

  static f_bicmp2f_some = <X>(f_bicmp: Bicomparator<X>): Bicomparator<X[]> => {
    return (a: X[], b: X[]) => {
      // https://stackoverflow.com/a/16436975

      // if (a === b) return true;
      if (a == null || b == null) return undefined;
      // if (a.length !== b.length) return undefined;
      if(a.length === 0 || a.length === 0) return false;
      const n = Math.min(a.length, b.length);

      // If you don't care about the order of the elements inside
      // the array, you should sort both arrays here.
      // Please note that calling sort on an array will modify that array.
      // you might want to clone your array first.

      for (var i = 0; i < n; ++i) {
        if (f_bicmp(a[i], b[i])) {
          return true;
        }
      }
      return false;
    };
  };


  static isHomogeneous = <T,>(
    items: T[],
    f_eq:Bicomparator<T>,
  ): boolean => {
    return items == null
      ? undefined
      : !ArrayTool.bool(items)
        ? true
        : items.every((v) => f_eq(v, items[0]))
        ;
  };
  static isBihomo = <T,>(items: T[],):boolean => ArrayTool.isHomogeneous(items, CmpTool.isBiequal);
  static isTrihomo = <T,>(items: T[],):boolean => ArrayTool.isHomogeneous(items, CmpTool.isTriequal);
  static isUniform = ArrayTool.isTrihomo;  // avoid using
  static areAlike = ArrayTool.isTrihomo;  // avoid using
  static areAllSame = ArrayTool.isTrihomo;  // avoid using

  static areAllBiequal = ArrayTool.f_bicmp2f_every(CmpTool.isBiequal);
  static areAllTriequal = ArrayTool.f_bicmp2f_every(CmpTool.isTriequal);

  static reversed = <T = any>(array: T[]): T[] => (array == null ? undefined : [...array].reverse());

  // static array_valuedict2sorted<X extends Dictkey>(items: X[], valuedict: Record<X, number>) {
  //     const lookup = (h: Record<X, number>, k: X) => (k in h) ? h[k] : 0;

  //     return ArrayTool.sorted(items, (k1, k2) => lookup(valuedict, k2) - lookup(valuedict, k1),);
  // }


  // static indexsorted = <X>(l: X[], indexcomparator: Indexcomparator<X>): X[] => {
  //   const cls = ArrayTool;
  //   const callname = `ArrayTool.indexsorted @ ${date2str_time(new Date())}`;

  //   if (l == null) return undefined;
  //   if (!cls.bool(l)) return l;

  //   return cls.range(l?.length)
  //     .sort((i1,i2) => indexcomparator([l[i1],i1], [l[i2],i2]))
  //     .map(i => l[i]);
  // }

  // static comparator2indexcomparator = <X>(comparator:Comparator<X>):Indexcomparator<X> => {
  //   return (xi1:[X,number], xi2:[X,number]) => comparator(xi1[0], xi2[0]);
  // }
  
  // static sorted = <X>(l: X[], comparator?: Comparator<X>): X[] => {
  //   const cls = ArrayTool;
  //   const callname = `ArrayTool.sorted @ ${date2str_time(new Date())}`;

  //   const indexcomparator = cls.comparator2indexcomparator(comparator ?? CmpTool.subtract_typeignore<X>);
  //   return cls.indexsorted(l, indexcomparator);
  // }

  static sorted<V>(l: V[], comparator?: Comparator<V>): V[] {
    const cls = ArrayTool;
    const callname = `ArrayTool.sorted @ ${date2str_time(new Date())}`;

    if (l == null) return undefined;
    if (!cls.bool(l)) return l;

    return [...l].sort(comparator ?? CmpTool.subtract_typeignore);
  }


  static irealigner2realigner = <X>(irealigner: Realigner<number>,):Realigner<X> => {
    return (l:X[]) => {
      const indexes_realigned = irealigner(ArrayTool.range(l?.length));
      return indexes_realigned?.map(i => l[i]);
    }
  }

  // static iaggregator2aggregator = <X>(iaggregator: Aggregator<number>):Aggregator<X> => {
  //   return (l:X[]) => {
  //     const index_best = iaggregator(ArrayTool.range(l?.length));
  //     return index_best == null ? undefined : l[index_best];
  //   }
  // }

  static sorted_icmp = <X>(l:X[], f_icmp:Comparator<number>):X[] => {
    return ArrayTool.sorted(ArrayTool.range(l?.length), f_icmp,)
      ?.map(i => l[i]);
  }

  static indexes2inverted(indexes: number[]) {
    const n = ArrayTool.len(indexes);
    const l = new Array(n);
    ArrayTool.range(0, n).map((i) => (l[indexes[i]] = i));
    return l;
  }

  /**
   * ref: https://stackoverflow.com/a/28574015/1902064
   * @param array
   * @param comparator
   */
  static rankindexes<V>(array: V[], comparator: (a: V, b: V) => number = CmpTool.subtract_typeignore): number[] {
    return ArrayTool.indexes2inverted(ArrayTool.argssorted(array, comparator));
  }

  /**
   * Identical to numpy's argsort
   * ArrayTool.argssorted([3,1,2]) == [1,2,0]; // not [2,0,1]
   * @param array
   * @param comparator
   */
  static argssorted<V>(array: V[], comparator: (a: V, b: V) => number = CmpTool.subtract_typeignore): number[] {
    if (!ArrayTool.bool(array)) {
      return undefined;
    }

    const n = ArrayTool.len(array);

    return ArrayTool.sorted([...ArrayTool.range(0, n)], (i1, i2) => comparator(array[i1], array[i2]));
  }

  static dict_argssorted<V extends number>(
    array: V[],
    comparator: (a: V, b: V) => number = (a, b) => a - b
  ): Record<V, number> {
    const argssorted = ArrayTool.argssorted(array, comparator);
    if (!ArrayTool.bool(argssorted)) {
      return undefined;
    }

    // console.log({array, argssorted});

    // console.log({argssorted});
    return argssorted.reduce((h, original_index, i) => {
      // console.log({i, sortedindex, 'array[sortedindex]':array[sortedindex]});
      // h[array[i]] = sortedindex;
      h[array[original_index]] = i;
      return h;
    }, {} as Record<V, number>);
  }

  static sorted_stable<V>(items_in: V[], comparator: (v1: V, v2: V) => number = CmpTool.pair2cmp_default): V[] {
    const n = ArrayTool.len(items_in);

    const indexes2cmp_stable = (i1, i2) => {
      const x1 = items_in[i1];
      const x2 = items_in[i2];
      const cmp = comparator(x1, x2);
      if (cmp !== 0) {
        return cmp;
      }
      return i1 - i2;
    };

    const indexes_sorted = ArrayTool.range(0, n).sort(indexes2cmp_stable);

    const items_out = indexes_sorted.map((i) => items_in[i]);
    return items_out;
  }

  static ll2zip<O = any[][], I = any>(rows: I[][], option?: { strict?: boolean }): O {
    // https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    // var args = [].slice.call(); // https://stackoverflow.com/questions/2125714/explanation-of-slice-call-in-javascript/2125886

    const colcounts = rows.map((row) => row.length);
    if (option?.strict) {
      if (!ArrayTool.isTrihomo(colcounts)) {
        throw new Error(`${colcounts}`);
      }
    }
    const colcount_max = ArrayTool.max(colcounts);
    return ArrayTool.range(colcount_max).map((i) => rows.map((row) => row[i])) as O;
  }
  static zip = <O = any[][], I = any>(...rows: I[][]): O => ArrayTool.ll2zip(rows);

  static void_cleaned(array) {
    return array.filter((x) => x != null);
  }
  // static rows2cleaned(rows){
  //     return rows.map(array2cleaned);
  // }

  static zip_cleaned(...rows) {
    return ArrayTool.zip(...rows).map(ArrayTool.void_cleaned);
  }

  // static array2minindexes<X>(items: X[], items2cmp: (x1: X, x2: X) => number, limit: number) {
  //   const minindexes_list = GroupbyTool.array2firstK_minindexes_list(items, limit, { parents2cmp: items2cmp });
  //   return ArrayTool.head(limit, ArrayTool.flatten(minindexes_list));
  // }

  // static array2maxindexes<X>(items: X[], items2cmp: (x1: X, x2: X) => number, limit: number) {
  //   const maxindexes_list = GroupbyTool.array2firstK_maxindexes_list(items, limit, { parents2cmp: items2cmp });
  //   return ArrayTool.head(limit, ArrayTool.flatten(maxindexes_list));
  // }

  // static array2mins<X>(items: X[], items2cmp: (x1: X, x2: X) => number, limit: number) {
  //   const minindexes_list = GroupbyTool.array2firstK_minindexes_list(items, limit, { parents2cmp: items2cmp });
  //   const minindexes = ArrayTool.head(limit, ArrayTool.flatten(minindexes_list));
  //   return minindexes.map((i) => items[i]);
  // }

  // static array2maxs<X>(items: X[], items2cmp: (x1: X, x2: X) => number, limit: number) {
  //   const maxindexes_list = GroupbyTool.array2firstK_maxindexes_list(items, limit, { parents2cmp: items2cmp });
  //   const maxindexes = ArrayTool.head(limit, ArrayTool.flatten(maxindexes_list));
  //   return maxindexes.map((i) => items[i]);
  // }

  // static arrays2cmp(l1, l2) : number{
  //     const n = ArrayTool.len(l1);
  //     assert(ArrayTool.len(l2) === n);

  //     for(let i=0; i<n; i++){
  //         const x1 = l1[i];
  //         const x2 = l2[i];

  //         if(x1 < x2){ return -1; }
  //         if(x1 > x2){ return 1; }
  //     }
  //     return 0;
  // }

  static has_duplicate(l: any[]): boolean {
    if (l == null) {
      return undefined;
    }

    const noDups = new Set(l);
    return l.length !== noDups.size;
  }

  static array2bijected<X>(items_in: X[], indexes: number[]) {
    const n = ArrayTool.len(items_in);
    assert(ArrayTool.len(indexes) === n);

    assert(!DictTool.bool(ArrayTool.array2duplicates(indexes)));

    const items_out = new Array(n);
    items_in.forEach((item, i) => {
      const index = indexes[i];
      items_out[index] = item;
    });
    return items_out;
  }

  static rotatingunshift<X>(l: X[]) {
    if (!ArrayTool.bool(l)) {
      return l;
    }

    // https://stackoverflow.com/a/23368052/1902064
    // WARNING! INTRUSIVE!!
    l.unshift(l.pop());
    return l;
  }
  static rotatingshift<X>(l: X[]) {
    if (!ArrayTool.bool(l)) {
      return l;
    }

    // https://stackoverflow.com/a/23368052/1902064
    // WARNING! INTRUSIVE!!
    l.push(l.shift());
    return l;
  }

  static rotateR<X>(l: X[], count: number) {
    if (!ArrayTool.bool(l)) {
      return l;
    }

    const n = ArrayTool.len(l);
    const p = count % n;
    return [...l.slice(-p), ...l.slice(0, -p)];
  }
  static rotateL<X>(l: X[], count: number) {
    if (!ArrayTool.bool(l)) {
      return l;
    }

    const n = ArrayTool.len(l);
    const p = count % n;
    return [...l.slice(p), ...l.slice(0, p)];
  }

  static number2bucketindex_remainder_rotational(v: number, l: number[]): { bucketindex: number; remainder: number } {
    const self = ArrayTool;
    const sum = MathTool.sum(l);
    return self.number2bucketindex_remainder(v % sum, l);
  }

  static number2bucketindex_remainder(v: number, l: number[]): { bucketindex: number; remainder: number } {
    let acc = 0;
    const n = ArrayTool.len(l);

    for (let i = 0; i < n; i++) {
      acc += l[i];
      if (v < acc) {
        return { bucketindex: i, remainder: v - acc };
      }
    }
    throw new Error(`Value larger than sum: value:${v}, sum:${acc}`);
  }

  static repeat<X>(x: X, n: number): X[] {
    return Array(n).fill(x);
  }

  static index2rotating_prev(index: number, n: number) {
    return (index - 1 + n) % n;
  }
  // static f_array2f_rotated()

  static array2cupped<X>(l: X[], h: Set<X>): X[] {
    return l.filter((x) => h.has(x));
  }

  static f_manytomany2f_one2one = <X, A extends any[], R>(
    f_manytomany: (l: X[], ...args: A) => R[]
  ): ((x: X, ...args: A) => R) => {
    return (x: X, ...args: A): R => ArrayTool.l2one(f_manytomany(ArrayTool.one2l(x), ...args));
  };
  static fa_manytomany2fa_one2one = <X, A extends any[], R>(
    fa_manytomany: (l: X[], ...args: A) => Promise<R[]>
  ): ((x: X, ...args: A) => Promise<R>) => {
    return (x: X, ...args: A): Promise<R> =>
      fa_manytomany(ArrayTool.one2l(x), ...args).then((rr) => ArrayTool.l2one(rr));
  };
  
  static sortArrayBasedOnOriginal = (original: string[], newArray: string[]): string[] => {
    if (!original) return [];
    if (!newArray) return [];
    const indexMap: { [key: string]: number } = {};
    original.forEach((item, index) => {
        indexMap[item] = index;
    });

    return newArray.sort((a, b) => (indexMap[a] ?? Infinity) - (indexMap[b] ?? Infinity));
  }

  // static f_batch2f_batch_conditioned = <X>(f_batch:FuncXX<X[]>, filter:(x:X) => boolean):FuncXX<X[]> => {
  //   return (l_in:X[]) => {
  //     if(l_in == null) return undefined;

  //     const n = l_in?.length;
  //     const is_target = ArrayTool.range(n).filter(i => filter(l_in[i]));
  //     const dict_i2j = ArrayTool.array2dict_item2index(is_target);
  //     const m_out = f_batch(is_target.map(i => l_in?.[i]));
  //     const l_out = ArrayTool.range(n).map(i => (i in dict_i2j) ? m_out[dict_i2j[i]] : l_in[i]);
  //     return l_out;
  //   }
  // }

  static af_batch2af_batch_conditioned = <X, A extends any[]>(
    f_batch:(l:X[], ...args:A) => Promise<X[]>,
    filter:(x:X) => boolean,
  ):(l:X[], ...args:A) => Promise<X[]> => {
    return async (l_in:X[], ...args:A):Promise<X[]> => {
      if(l_in == null) return undefined;

      const n = l_in?.length;
      const is_target = ArrayTool.range(n).filter(i => filter(l_in[i]));
      const dict_i2j = ArrayTool.array2dict_item2index(is_target);
      const m_out = await f_batch(is_target.map(i => l_in?.[i]), ...args);
      const l_out = ArrayTool.range(n).map(i => (i in dict_i2j) ? m_out[dict_i2j[i]] : l_in[i]);
      return l_out;
    }
  }

  static af_batch2paged = <O,X, A extends any[]>(
    af_batch:(l:X[], ...args:A) => Promise<O[]>,
    chunker:(l:X[]) => X[][],
  ):((l:X[], ...args:A) => Promise<O[]>) => {
    return async (l:X[], ...args:A):Promise<O[]> => {
      const chunks = chunker(l);
      const results = await Promise.all(chunks?.map(page => af_batch(page, ...args)));
      return results?.flat()
    }
  }
}

export class PairTool {
  static array2pair<T>(pair_in: T[]): Pair<T> {
    if (!pair_in) { return undefined; }
    if (pair_in.length !== 2) { throw new Error(); }

    return [pair_in[0], pair_in[1]];
  }

  static pair<T>(x1: T, x2: T): Pair<T> { return [x1, x2]; }
}
