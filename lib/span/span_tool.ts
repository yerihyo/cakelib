import lodash from 'lodash'
import CmpTool, { BicmpTool, Bicomparator, Comparator } from '../cmp/CmpTool'
import ArrayTool from '../collection/array/array_tool'
import MinimaxTool, { AbsoluteOrder } from '../collection/array/minimax_tool'
import { Pair } from '../native/native_tool'
import SignTool from '../number/sign_tool'

export default class SpanTool {
  static bool(span: Pair<any>) { return ArrayTool.bool(span) }

  static nullable2inf(span: Pair<number>): Pair<number> {
    if (span == null) { return undefined; }
    return [
      span[0] ?? -Infinity,
      span[1] ?? Infinity,
    ];
  }

  static inf2null = <T>(span: Pair<T>): Pair<T> => {
    return span == null
      ? span
      : [
        span[0] === -Infinity ? null : span[0],
        span[1] === Infinity ? null : span[1],
      ];
  }

  static span2norm = SpanTool.inf2null;

  static span2is_infinf = <T>(span:Pair<T>):boolean => {
    return ArrayTool.areAllTriequal(SpanTool.span2norm(span), [null, null]);
  }

  static pivot_span2cmp(
    pivot: number,
    span: Pair<number>,
  ): number {
    if (pivot == null) { return undefined; }
    if (span == null) { return undefined; }

    if (pivot < span[0]) { return pivot - span[0]; }
    // else if (pivot <= span[1]) { return 0; }
    else if (pivot < span[1]) { return 0; }
    else { return pivot - (span[1] - 1); }
  }

  static span2len = function (span) {
    return span[1] - span[0]
  }

  static value2proportion = function (span, v) {
    const s = span[0]
    const e = span[1]
    return (v - s) / (e - s)
  }

  static span2diff = function (span) {
    return span[1] - span[0]
  }

  static f_bicmp_pair2f_span_bicmp = <T>(
    bicomparator_pair: Pair<Bicomparator<T>>,
  ) => {
    return (value: T, span: Pair<T>): boolean => {
      const [f_bicmp1, f_bicmp2] = bicomparator_pair;
      return f_bicmp1(value, span[0],) && f_bicmp2(value, span[1],)
    };
  }

  static gtelt = SpanTool.f_bicmp_pair2f_span_bicmp([BicmpTool.pair2gte_default, BicmpTool.pair2lt_default]);
  static gtelte = SpanTool.f_bicmp_pair2f_span_bicmp([BicmpTool.pair2gte_default, BicmpTool.pair2lte_default]);


  static is_between_deprecated<T>(
    value: T,
    span: Pair<T>,
    options?: {
      pair2cmp?: (v1: T, v2: T) => number,
    },
  ) {
    const cls = SpanTool;

    if (span.length !== 2) { throw new Error(`span.length: ${span.length}`); }

    const { pair2cmp: pair2cmp_in } = (options || {});
    const pair2cmp = pair2cmp_in ?? CmpTool.pair2cmp_default;

    const [s, e] = span;
    if (!(s == null || pair2cmp(s, value) <= 0)) { return false; }
    if (!(e == null || pair2cmp(value, e) < 0)) { return false; }
    return true;
  }

  static comparator2comparator_lb = <T>(comparator:Comparator<T>):Comparator<T> => AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator);
  static comparator2comparator_ub = <T>(comparator:Comparator<T>):Comparator<T> => AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator);

  static is_between<T>(
    value: T,
    span: Pair<T>,
    option?: {
      comparator?: {
        lb?: Comparator<T>,
        ub?: Comparator<T>,
      }
    },
  ) {
    const cls = SpanTool;

    if(span == null){ return undefined; }
    if (span.length !== 2) { throw new Error(`span.length: ${span.length}`); }

    // const { pair2cmp: pair2cmp_in } = (options || {});
    const comparator_lb = option?.comparator?.lb ?? AbsoluteOrder.f_cmp2f_cmp_nullable2min(CmpTool.pair2cmp_default);
    const comparator_ub = option?.comparator?.ub ?? AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default);

    const [s, e] = span;
    const cmp_lb = comparator_lb(s, value);
    const cmp_ub = comparator_ub(value, e);

    if(cmp_lb == null || cmp_ub == null){ return undefined; }
    return cmp_lb <= 0 && cmp_ub <0;
  }

  static is_between_or_bothnull<T>(
    t: T,
    span: Pair<T>,
    options?: {
      comparator?: {
        lb?: Comparator<T>,
        ub?: Comparator<T>,
      }
    },
  ) {
    const cls = SpanTool;

    if ((t == null) && (span == null)) { return true; }
    if ((t == null) || (span == null)) { return false; }
    return cls.is_between(t, span, options);
  }

  static steps = function (start, end, step) {
    let x = start
    const sign_init = SignTool.number2sign(end - start)


    if (sign_init == 0) { return [start] }
    const sign_step = SignTool.number2sign(step)

    let l_out = []
    if (sign_init != sign_step) {
      throw new Error(`sign_init: ${sign_init}, sign_step: ${sign_step}`)
    }

    while (true) {
      const sign = SignTool.number2sign(end - x)

      // console.log({sign, x, end, step})
      // throw new Error({sign, x, end, step})

      if (sign != sign_init) { break }

      l_out.push(x)
      x = x + step
    }

    l_out.push(end)  // last value
    return l_out
  }

  static intersect = <T>(
    spans: Pair<T>[],
    option?:{comparator?: Comparator<T>,},
  ): Pair<T> => {
    const cls = SpanTool;
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    if(spans == null){ return undefined; }
    if(spans?.some(span => span === undefined)){ return undefined; }
    if(spans?.some(span => span == null)){ return null; }

    const start = MinimaxTool.max(spans.map(x => x[0]), AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator))
    const end = MinimaxTool.min(spans.map(x => x[1]), AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator))

    if (start != null && end != null && !(comparator(start, end) < 0)) { return null; }
    return [start, end]
  }

  static subtract = <T>(span1: Pair<T>, span2: Pair<T>, option?:{comparator?:Comparator<T>,}): Pair<T>[] => {
    const cls = SpanTool;
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    if (span1 === undefined || span2 === undefined) { return undefined; }
    if (span1 == null) { return []; }
    if (span2 == null) { return [span1]; }

    const cup = cls.intersect([span1, span2], {comparator});
    if(cup === undefined){ throw new Error(`Invalid: span1:${span1}, span2:${span2}`); };
    if(cup === null){ return [span1]; };

    const comparator_lb = AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator);
    const comparator_ub = AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator);

    return [
      ...(comparator_lb(span1[0], cup[0])<0 ? [[span1[0],cup[0]] as Pair<T>] : []),
      ...(comparator_ub(cup[1], span1[1])<0 ? [[cup[1], span1[1]] as Pair<T>] : []),
    ];
  }

  static spans2span_subtracted = <T>(spans:Pair<T>[], span:Pair<T>, option?:{comparator?:Comparator<T>,}):Pair<T>[] => {
    const cls = SpanTool;
    return spans.map(x => cls.subtract(x, span, option))?.flat()
  }

  static value2bounded(value_in, span) {
    // console.log({point_in, interval,})

    if (!value_in) { return null }
    if (!ArrayTool.bool(span)) { return null }

    const value_out = Math.min(span[1], Math.max(span[0], value_in))
    return value_out

    // const point_lb = this.Point.points_position2max([point_in, spoint], this.Point.Position.START)
    // const point_out = this.Point.points_position2min([point_lb, epoint], this.Point.Position.END)
    // return this.Point.point2position_removed(point_out)
  }

  static comparator2comparator_span = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    const comparator_lb = SpanTool.comparator2comparator_lb(comparator);
    const comparator_ub = SpanTool.comparator2comparator_ub(comparator);
    return CmpTool.f_cmps2f_cmp([
      (p1, p2) => comparator_lb(p1[0], p2[0]),
      (p1, p2) => comparator_ub(p1[1], p2[1]),
    ]);
  }

  static pair2cmp_default = SpanTool.comparator2comparator_span(CmpTool.pair2cmp_default);
  // static pair2cmp_default = <T>(p1:Pair<T>, p2:Pair<T>) => SpanTool.comparator2comparator_span(CmpTool.pair2cmp_default<T>)(p1,p2);
  // static pair2cmp(span1: [number, number], span2: [number, number]): number {
  //   const d0 = span1[0] - span2[0];
  //   return d0 !== 0 ? d0 : span1[1] - span2[1];
  // }

  static spans2indexes_nonoverlapping(spans: [number, number][]): number[] {
    if (!spans) { return undefined; }

    const indexes_sorted = [...Array(spans.length).keys()].sort((i1, i2) => SpanTool.pair2cmp_default(spans[i1], spans[i2]));
    // const spans_sorted = [...spans].sort((s1,s2) => {
    //     const d0 = s1[0]-s2[0];
    //     return d0!== 0 ? d0 : s1[1]-s2[1];
    // });

    var end: number, indexes_out: number[] = [];
    for (var i = 0; i < spans.length; i++) {
      const index = indexes_sorted[i];
      const span = spans[index];
      if (!end || end <= span[0]) {
        indexes_out.push(index);
        end = span[1];
      }
    }
    return indexes_out;
  }

  static span2split<T>(
    span: Pair<T>,
    pivot: T,
    pivot2next: (t: T) => T,
    pair2cmp_in?: (t1: T, t2: T) => number,
  ): Pair<T>[] {
    if (!span) { return undefined; }

    const pair2cmp = pair2cmp_in ?? CmpTool.pair2cmp_default;
    if (pair2cmp(pivot, span[0]) > 0) { throw new Error(`pivot:${pivot}, span[0]:${span[0]}`); }


    let p = pivot;
    const max = (x1: T, x2: T) => pair2cmp(x1, x2) >= 0 ? x1 : x2;
    const min = (x1: T, x2: T) => pair2cmp(x1, x2) <= 0 ? x1 : x2;

    const spans = [];
    do {
      const p_next = pivot2next(p);
      const s = max(p, span[0]);
      const e = min(p_next, span[1]);
      if (pair2cmp(s, e) >= 0) { throw new Error(`s:${s}, e:${e}`); }

      spans.push([s, e]);
      p = p_next;
    } while (pair2cmp(p, span[1]) < 0)

    return spans;
  }

}