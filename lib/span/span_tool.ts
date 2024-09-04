import lodash from 'lodash';
import CmpTool, { BicmpTool, Bicomparator, Comparator, Comparatorkit } from '../cmp/CmpTool'
import ArrayTool from '../collection/array/array_tool'
import MinimaxTool, { AbsoluteOrder } from '../collection/array/minimax_tool'
import NativeTool, { Pair } from '../native/native_tool'
import SignTool from '../number/sign_tool'
import MathTool from '../number/math/math_tool'
import FunctionTool from '../function/function_tool';

export default class SpanTool {
  static zerospan = <T>() => ([] as unknown as Pair<T>);
  static bool = ArrayTool.bool;

  static nullnull = <T>():Pair<T> => [null, null]; // semantically (-inf,inf)

  static nullnull2infinf(span: Pair<number>): Pair<number> {
    const cls = SpanTool;

    if (span == null) return undefined;
    if (!cls.bool(span)) return span;
    
    return [
      span?.[0] === null ? -Infinity : span?.[0],
      span?.[1] === null ? Infinity : span?.[1],
    ];
  }

  static infinf2nullnull = <T>(span: Pair<T>): Pair<T> => {
    const cls = SpanTool;

    if (span == null) return undefined;
    if (!cls.bool(span)) return span;

    return [
        span[0] === -Infinity ? null : span[0],
        span[1] === Infinity ? null : span[1],
      ];
  }

  static span2norm = SpanTool.infinf2nullnull;

  static span2is_nullnull = <T>(span:Pair<T>):boolean => {
    return ArrayTool.areAllTriequal(SpanTool.span2norm(span), [null, null]);
  }

  
  static span2len = <T,>(
    span:Pair<T>,
    option?:{minus?: (t1:T, t2:T) => number},
  ):number => {
    if(span == null){ return undefined; }
    if(!ArrayTool.bool(span)){ return 0; }

    const minus = option?.minus ?? ((t1:T, t2:T) => (t1 as number)-(t2 as number));
    return minus(span[1], span[0])
  }

  static value2proportion = <X,>(
    span:Pair<X>,
    x:X,
    option?:{minus?: (t1:X, t2:X) => number},
  ) => {
    if(span == null){ return undefined; }
    if(!ArrayTool.bool(span)){ return undefined; }

    const s = span[0]
    const e = span[1]

    return MathTool.div(
      SpanTool.span2len<X>([s,x], option),
      SpanTool.span2len<X>([s,e], option),
    )
  }

  // static span2diff = function (span) {
  //   return span[1] - span[0]
  // }

  static f_bicmp_pair2f_span_bicmp = <T>(
    bicomparator_pair: Pair<Bicomparator<T>>,
  ) => {
    return (value: T, span: Pair<T>): boolean => {
      const [f_bicmp1, f_bicmp2] = bicomparator_pair;
      if(span == null){ return undefined; }
      if(!SpanTool.bool(span)){ return false; }

      return ArrayTool.all([
        f_bicmp1(value, span[0],),
        f_bicmp2(value, span[1],),
      ]);
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

  // static comparator2comparator_lb = <T>(comparator:Comparator<T>):Comparator<T> => AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator);
  // static comparator2comparator_ub = <T>(comparator:Comparator<T>):Comparator<T> => AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator);
  static comparator2comparator_lb = lodash.flow(AbsoluteOrder.f_cmp2f_cmp_infs2minmax, AbsoluteOrder.f_cmp2f_cmp_nullable2min);
  static comparator2comparator_ub = lodash.flow(AbsoluteOrder.f_cmp2f_cmp_infs2minmax, AbsoluteOrder.f_cmp2f_cmp_nullable2max);

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
    const comparator_lb = option?.comparator?.lb ?? SpanTool.comparator2comparator_lb(CmpTool.pair2cmp_default);
    const comparator_ub = option?.comparator?.ub ?? SpanTool.comparator2comparator_ub(CmpTool.pair2cmp_default);

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

  static mergeSpans = <T>(span1: Pair<T>, span2: Pair<T>, option?: { comparator?: Comparator<T> }): Pair<T> => {
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;
    const start = MinimaxTool.min(
      [span1[0], span2[0]],
      AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator)
    );
    const end = MinimaxTool.max(
      [span1[1], span2[1]],
      AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator)
    );
    return [start, end];
  }
  
  static unionSpans = <T>(spans_original: Pair<T>[], option?: { comparator?: Comparator<T> }): Pair<T>[] => {
    console.log(JSON.stringify(spans_original))
    let spans = JSON.parse(JSON.stringify(spans_original)) as Pair<T>[];
    console.log({spans, spans_original})
    if (!spans || spans.length === 0) return [];

    // Check if there's any span that covers the entire range
    for (let span of spans) {
      if (span[0] == null && span[1] == null) {
        return [[null, null]];
      }
    }
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    // Sort spans by start value
    spans = ArrayTool.sorted(spans, (a, b) => {
    const comparator_lb = AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator);
    return comparator_lb(a?.[0], b?.[0])
    })

    const result: Pair<T>[] = [];
    let currentSpan = spans[0];

    for (let i = 1; i < spans.length; i++) {
      const span = spans[i];

      // If we encounter a span that covers the entire range, the result is just that span
      if (span[0] == null && span[1] == null) {
        return [[null, null]];
      }

      if (currentSpan[1] == null || span[0] == null || comparator(currentSpan[1], span[0]) >= 0) {
        // Merge spans if they overlap or are contiguous
        if (currentSpan[1] == null || span[1] == null || comparator(currentSpan[1], span[1]) < 0) {
          currentSpan[1] = span[1];
        }
      } else {
        result.push(currentSpan);
        currentSpan = JSON.parse(JSON.stringify(span)) as Pair<T>;
      }
    }

    result.push(currentSpan);

    // If the entire range is covered, return [[null, null]]
    if (result.length === 1 && result[0][0] == null && result[0][1] == null) {
      return [[null, null]];
    }

    return result;
  };

  static intersect = <T>(
    spans: Pair<T>[],
    option?:{comparator?: Comparator<T>,},
  ): Pair<T> => {
    const cls = SpanTool;
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    if(spans == null){ return undefined; }
    // if(spans?.some(span => span === undefined)){ return undefined; }
    if(spans?.some(span => span == null)){ return undefined; } // TODO: SHOULD WE KEEP IT THIS WAY?
    if(spans?.some(span => !SpanTool.bool(span))){ return cls.zerospan(); }

    const start = MinimaxTool.max(spans.map(x => x[0]), AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator))
    const end = MinimaxTool.min(spans.map(x => x[1]), AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator))

    const f_gte = CmpTool.f_cmp2f_gte(comparator);
    if (ArrayTool.all([
      start != null,
      end != null,
      f_gte(start, end),
    ])) return cls.zerospan(); 

    return [start, end]
  }

  static intersectSpanspair = <T>(
    span1: Pair<T>[],
    span2: Pair<T>[],
    option?: { comparator?: Comparator<T> }
  ): Pair<T>[] => {
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;
  
    const events: Array<[T | null | undefined, 'start' | 'end', number]> = [];
  
    span1.forEach((pair, index) => {
      events.push([pair[0], 'start', index]);
      events.push([pair[1], 'end', index]);
    });
    
    span2.forEach((pair, index) => {
      events.push([pair[0], 'start', index + span1.length]);
      events.push([pair[1], 'end', index + span1.length]);
    });
  
    events.sort((a, b) => {
      if (a[0] === null || a[0] === undefined) return -1;
      if (b[0] === null || b[0] === undefined) return 1;
      const comp = comparator(a[0], b[0]);
      if (comp !== 0) return comp;
      if (a[1] === 'start' && b[1] === 'end') return -1;
      if (a[1] === 'end' && b[1] === 'start') return 1;
      return 0;
    });
  
    const activeSpans = new Set<number>();
    const intersections: Pair<T>[] = [];
    let intersectionStart: T | null | undefined = null;
  
    for (const [value, type, index] of events) {
      if (type === 'start') {
        if (activeSpans.size === 1) {
          intersectionStart = value;
        }
        activeSpans.add(index);
      } else {
        if (activeSpans.size === 2) {
          intersections.push([intersectionStart, value]);
        }
        activeSpans.delete(index);
        if (activeSpans.size === 1 && value !== null && value !== undefined) {
          intersectionStart = value;
        }
      }
    }
  
    // Handle case where intersection extends to infinity
    if (activeSpans.size === 2) {
      intersections.push([intersectionStart, null]);
    }
  
    return intersections;
  }

  static spans_list2intersected = <T>(
    spans_list: Pair<T>[][],
    option?: { comparator?: Comparator<T> }
  ): Pair<T>[] => {
    const cls = SpanTool;
    return spans_list?.reduce(
      (r, spans) => spans == null ? undefined : cls.intersectSpanspair(r, spans, option),
      [SpanTool.nullnull()],
    );
  }

  static subtract = <T>(span1: Pair<T>, span2: Pair<T>, option?:{comparator?:Comparator<T>,}): Pair<T>[] => {
    const cls = SpanTool;
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    if (span1 == null || span2 == null) { return undefined; }
    // if (span1 === undefined || span2 === undefined) { return undefined; }
    // if (span1 == null) { return []; }
    // if (span2 == null) { return [span1]; }

    const cup = cls.intersect([span1, span2], {comparator});
    if(cup == null){ throw new Error(`Invalid: span1:${span1}, span2:${span2}`); };
    if(!SpanTool.bool(cup)){ return ArrayTool.one2l(span1); }
    // if(cup === null){ return [span1]; };

    const comparator_lb = AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator);
    const comparator_ub = AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator);

    return [
      ...(comparator_lb(span1[0], cup[0])<0 ? [[span1[0],cup[0]] as Pair<T>] : []),
      ...(comparator_ub(cup[1], span1[1])<0 ? [[cup[1], span1[1]] as Pair<T>] : []),
    ];
  }

  static is_covered = lodash.flow(
    SpanTool.subtract,
    spans => NativeTool.negate3(SpanTool.bool(spans)),
  )

  static subtractSpans = <T>(
    spans1: Pair<T>[],
    spans2: Pair<T>[],
    option?: { comparator?: Comparator<T> }
  ): Pair<T>[] => {
    if(spans1 == null || spans2 == null){ return undefined; }

    if(!ArrayTool.bool(spans1)){ return []; }
    if(!ArrayTool.bool(spans2)){ return spans1; }
    // if (!spans1 || spans1.length === 0) return [];
    // if (!spans2 || spans2.length === 0) return spans1;

    return spans1.map(span1 => {
      return spans2.reduce<Pair<T>[]>((spans_,span2) => {
        return spans_
          .map(span_ => SpanTool.subtract(span_, span2, option))
          .filter(SpanTool.bool)
          .flat()
      },[span1]);
    }).flat();
  };

  static subtractSpans_deprecated = <T>(
    spans1: Pair<T>[],
    spans2: Pair<T>[],
    option?: { comparator?: Comparator<T> }
  ): Pair<T>[] => {
    if (!spans1 || spans1.length === 0) return [];
    if (!spans2 || spans2.length === 0) return spans1;

    const comparator = option?.comparator ?? ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));

    const result: Pair<T>[] = [];

    spans1.forEach(span1 => {
      let [start1, end1] = span1;

      spans2.forEach(span2 => {
        let [start2, end2] = span2;

        if (start1 == null && end1 == null) {
          // span1 is from -∞ to +∞
          if (start2 != null) {
            // span2 has a defined start
            result.push([null, start2]);
            start1 = end2;
            end1 = null;
          }
        } else if (start1 == null || end1 == null || start2 == null || end2 == null) {
          // Handle spans with null or undefined bounds
          if (start1 == null || (start2 != null && comparator(start1, start2) < 0)) {
            if (end2 != null && (end1 == null || comparator(end2, end1) < 0)) {
              start1 = end2;
            } else {
              start1 = null;
              end1 = null;
            }
          } else if (end1 == null || (end2 != null && comparator(end1, end2) > 0)) {
            if (start2 != null && (start1 == null || comparator(start2, start1) > 0)) {
              end1 = start2;
            } else {
              start1 = null;
              end1 = null;
            }
          }
        } else {
          // Normal case with defined bounds
          if (comparator(end1, start2) <= 0 || comparator(start1, end2) >= 0) {
            return;
          }
          if (comparator(start1, start2) < 0) {
            if (comparator(end1, end2) > 0) {
              result.push([start1, start2]);
              start1 = end2;
            } else {
              end1 = start2;
            }
          } else {
            if (comparator(end1, end2) > 0) {
              start1 = end2;
            } else {
              start1 = null;
              end1 = null;
            }
          }
        }
      });

      if (start1 != null || end1 != null) {
        result.push([start1, end1]);
      }
    });

    return result;
  };

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

  // First Start First End
  static f_itemcmp2f_spancmp_FSFE = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    return CmpTool.f_cmps2f_cmp([
      CmpTool.f_key2f_cmp(p => p?.[0], SpanTool.comparator2comparator_lb(comparator)),
      CmpTool.f_key2f_cmp(p => p?.[1], SpanTool.comparator2comparator_ub(comparator)),
    ]);
  }

  // First End First Start
  static f_itemcmp2f_spancmp_FEFS = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    return CmpTool.f_cmps2f_cmp([
      CmpTool.f_key2f_cmp(p => p?.[1], SpanTool.comparator2comparator_ub(comparator)),
      CmpTool.f_key2f_cmp(p => p?.[0], SpanTool.comparator2comparator_lb(comparator)),
    ]);
  }

  static f_itemcmp2f_spancmp_LSFE = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    return CmpTool.f_cmps2f_cmp([
      CmpTool.f_key2f_cmp(p => p?.[0], SpanTool.comparator2comparator_lb(CmpTool.f_cmp2reversed(comparator))),
      CmpTool.f_key2f_cmp(p => p?.[1], SpanTool.comparator2comparator_ub(comparator)),
    ]);
  }

  static f_itemcmp2f_spancmp_FSLE = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    return CmpTool.f_cmps2f_cmp([
      CmpTool.f_key2f_cmp(p => p?.[0], SpanTool.comparator2comparator_lb(comparator)),
      CmpTool.f_key2f_cmp(p => p?.[1], SpanTool.comparator2comparator_ub(CmpTool.f_cmp2reversed(comparator))),
    ]);
  }
  static pair2cmp_rank_default = SpanTool.f_itemcmp2f_spancmp_FSFE(CmpTool.pair2cmp_default);

  static f_itemcmp2f_spancmp_overlap = <T>(comparator: Comparator<T>): Comparator<Pair<T>> => {
    return (p1:Pair<T>, p2:Pair<T>) => {
      if(p1 == null || p2 == null){ return undefined; }
      
      const cmp_minus = comparator(p1[1], p2[0]);
      if(MathTool.lte(cmp_minus, 0)){ return Math.min(cmp_minus, -Number.EPSILON); }

      const cmp_plus = comparator(p1[0], p2[1]);
      if(MathTool.gte(cmp_plus, 0)){ return Math.min(cmp_plus, Number.EPSILON); }
      return 0;
    }
  }
  static pair2cmp_overlap_default = SpanTool.f_itemcmp2f_spancmp_overlap(CmpTool.pair2cmp_default);

  static pivot2unitimpulse = <T>(pivot:T, option?:{f_next?:(t:T) => T}):Pair<T> => {
    const f_next = option?.f_next ?? ((t) => (+t + Number.EPSILON) as T);
    return [pivot,f_next(pivot)];
  }
  static pivot_span2cmp = <T>(pivot: T,span: Pair<T>,):number => 
    SpanTool.pair2cmp_overlap_default(SpanTool.pivot2unitimpulse(pivot), span);
  
  static pivot_span2cmp_deprecated = (
    pivot: number,
    span: Pair<number>,
  ): number => {
    const cls = SpanTool;
    if (pivot == null) { return undefined; }
    if(!cls.bool(span)){ return undefined; }

    if (pivot < span[0]) { return pivot - span[0]; }
    if (pivot < span[1]) { return 0; }
    return Math.max(pivot - span[1], Number.EPSILON);
  }

  static spans2indexes_nonoverlapping(spans: [number, number][]): number[] {
    if (!spans) { return undefined; }

    const indexes_sorted = [...Array(spans.length).keys()].sort((i1, i2) => SpanTool.pair2cmp_rank_default(spans[i1], spans[i2]));
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

  static rotating2unrotated = <T>(
    span:Pair<T>,
    period:T,
    option?:{
      f_lte: (t1:T, t2:T) => boolean,
      plus?:(t1:T, t2:T) => T,
    },
  ):Pair<T> => {
    const f_lte = option?.f_lte ?? (
      (t1:T, t2:T):boolean => {
        if(t1 === undefined || t2 === undefined){ return undefined; }

        if(t1 === null){ return true; }
        if(t2 === null){ return true; }
        return CmpTool.f_cmp2f_lte(CmpTool.pair2cmp_default<T>)(t1,t2);
      }
    );
    const plus = option?.plus ?? ((t1:T, t2:T) => (+(t1) + +(t2)));

    return f_lte(span?.[0], span?.[1])
      ? span
      : [span?.[0], plus(span?.[1], period)] as Pair<T>
      ;

  }

  static f2nullskipped = FunctionTool.unary2nullskipped
  static span2firstlast = <T>(
    span:Pair<T>,
    option?:{f_minusone?:(t:T) => T},
  ):Pair<T> => {
    if(span == null){ return undefined; }

    const f_minusone = option?.f_minusone ?? ((t:T) => ((t as any) - 1) as T);
    return [
      span?.[0],
      f_minusone(span?.[1]),
    ];
  }
    
}

export class SpansTool {
  static bool = <T>(spans:Pair<T>[]):boolean => spans?.some(span => SpanTool.bool(span));
  static norm = <T>(
    spans_in:Pair<T>[],
    option?:{comparator?:Comparator<T>},
  ):Pair<T>[] => {
    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    const spans_sorted = ArrayTool.sorted(spans_in, SpanTool.f_itemcmp2f_spancmp_FSFE(comparator));
    const spans_norm = spans_sorted?.reduce((spans_out, span_this, i, spans_in,) => {
      if(!ArrayTool.bool(spans_out)){ return [span_this]; }

      const span_last = ArrayTool.last(spans_out);
      return !SpanTool.bool(SpanTool.intersect([span_last, span_this]))
        ? i+1 === spans_in?.length ? spans_in : spans_in?.slice(0,i+1)
        : [
          ...spans_in?.slice(0,i),
          [span_last[0], span_this[1]], // merged
        ];
    },[]);
    return spans_norm;
  }

  // static spans2minmax = <T>(
  //   spans:Pair<T>[],
  //   option?: {
  //     comparator?: Comparator<T>,
  //   },
  // ):Pair<T> => {

  //   const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

  //   const min = MinimaxTool.min(
  //     spans?.map(span => span?.[0]),
  //     AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator),
  //   );

  //   const max = MinimaxTool.max(
  //     spans?.map(span => span?.[1]),
  //     AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator),
  //   );
  //   return [min, max];
  // }

  static firstlasts2minmax = <T>(
    firstlasts:Pair<T>[],
    option?: {
      comparator?: Comparator<T>,
    },
  ):Pair<T> => {

    const comparator = option?.comparator ?? CmpTool.pair2cmp_default;

    const min = MinimaxTool.min(
      firstlasts?.map(firstlast => firstlast?.[0]),
      AbsoluteOrder.f_cmp2f_cmp_nullable2min(comparator),
    );

    const max = MinimaxTool.max(
      firstlasts?.map(firstlast => firstlast?.[1]),
      AbsoluteOrder.f_cmp2f_cmp_nullable2max(comparator),
    );
    return [min, max];
  }

  static comparator2f_eq_spans = lodash.flow(
    // comparator,
    SpanTool.f_itemcmp2f_spancmp_FSFE,
    CmpTool.f_cmp2f_eq,
    ArrayTool.f_bicmp2f_every,
    // ArrayTool.f_bicmp2f_every(CmpTool.f_cmp2f_eq(SpanTool.f_itemcmp2f_spancmp_rank(comparator)))
  )
}