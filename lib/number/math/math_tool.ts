import { infinite } from "swr/infinite";
import FunctionTool from "../../function/function_tool";
import { Pair } from "../../native/native_tool";
import SignTool from "../sign_tool";

export type Numericbinary = (x1:number, x2:number) => number;

export default class MathTool {
  // static floor(v:number) { return ~~v; }
  // static ceil: ((v:number) => number) = NativeTool.func2undef_shortwired(Math.ceil);
  // static floor: ((v:number) => number) = NativeTool.func2undef_shortwired(Math.floor);
  // static trunc: ((v:number) => number) = NativeTool.func2undef_shortwired(Math.trunc);

  static binary2nullableskippped = (f:Numericbinary):Numericbinary => {
    return (v1:number, v2:number) => {
      if(v1 == null || v2 == null){ return undefined; }
      return f(v1,v2);
    }
  }
  static abs(v:number):number{ return v == null ? undefined : Math.abs(v); }
  static sum(array: number[]): number { // to deal with nullable
    if (array?.some(x => x == null)) { return undefined; }
    return array?.reduce((a, b) => a + b, 0);
  }
  static plus = (...array: number[]) => MathTool.sum(array); // to deal with nullable
  static add = MathTool.plus;

  static minus = MathTool.binary2nullableskippped((x1, x2) => x1 - x2);
  static sub = MathTool.minus;

  static product(array: number[]): number { // to deal with nullable
    if (array?.some(x => x == 0)) { return 0; }
    if (array?.some(x => x == null)) { return undefined; }
    return array?.reduce((a, b) => a * b, 1);
  }
  
  static times = (...array: number[]) => MathTool.product(array); // to deal with nullable
  static mul = MathTool.times;

  static div = MathTool.binary2nullableskippped((x1, x2) => x1 / x2);

  static muldiv = (v: number, m: number, d: number) => {
    return m == d // m & d might be both zero, in which case we just ignore both
      ? v
      : MathTool.div(MathTool.times(v, m), d);
  }

  static mod = MathTool.binary2nullableskippped((x1, x2) => x1 % x2);


  static round = FunctionTool.func2undef_ifany_nullarg(Math.round); // (v:number) => v == null ? undefined : Math.round(v);

  static changerate = (v1:number, v2:number):number => MathTool.div(MathTool.minus(v1, v2), v2);
  static ratio2str_percentile = (v: number,): string => {
    return v == null
      ? undefined
      : Number.isNaN(v)
        ? '(계산오류)'
        : v == Infinity
          ? 'NEW'
          : `${MathTool.times(v, 100)?.toFixed(1)}%`
      ;
  };
  // static round = (v:number) => v == null ? undefined : Math.round(v);

  // static floor = (v: number,): number => (v == null ? v : Math.floor(v));

  // https://stackoverflow.com/a/19621472
  static round2unit(
    v:number,
    unit:number,
    option?:{
      rounder?: (x:number) => number,
    }
  ){
    const rounder = option?.rounder ?? MathTool.round;
    return MathTool.times(rounder(MathTool.div(v, unit)), unit);
  }

  // static sum_or_undef(array: number[]): number {
  //   if (array == null) { return undefined; }
  //   if (array.some(x => x == null)) { return undefined; }

  //   return array?.reduce((a, b) => a + b, 0);
  // }

  static product_or_undef(array: number[]): number {
    if (array == null) { return undefined; }
    if (array.some(x => x == null)) { return undefined; }

    return array?.reduce((a, b) => a * b, 1);
  }

  static pair2cmp(v1:number, v2:number):number{
    if(v1 === v2){ return 0; }
    if(v1 == null || v2 == null){ return undefined; }
    return v1 - v2;
  }
  static gte = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c >= 0 : undefined; };
  static gt = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c > 0 : undefined; };
  static lte = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c <= 0 : undefined; };
  static lt = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c < 0 : undefined; };
  static eq = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c === 0 : undefined; };
  static ne = (...p:Pair<number>):boolean => { const c = MathTool.pair2cmp(...p); return c != null ? c != 0 : undefined; };

  static gtzero = (x:number):boolean => MathTool.gt(x, 0);
  

  static divmod(v: number, d: number): { q: number, r: number } {
    if (v === undefined || d === undefined) { return { q: undefined, r: undefined }; }

    return { q: Math.floor(v / d), r: v % d };
  }

  static numbers2proportions(values: number[]): number[] {
    const self = MathTool;

    const value_sum = self.sum(values);
    if (value_sum === 0) { return values; }

    return values.map(v => v / value_sum);
  }

  static clamp(v: number, minmax: [number, number]) {
    const [minValue, maxValue] = minmax;
    const v1 = (minValue != null) ? Math.max(v, minValue) : v;
    const v2 = (maxValue != null) ? Math.min(v1, maxValue) : v1;
    return v2;
  }

  static average(array: number[]): number {
    return MathTool.sum(array) / array?.length;
  }

  static decaying_average(array: number[], decayrate: number): number {
    return array.reverse().reduce((v_prev, v,) => v + v_prev * decayrate, 0);
  }

  static abs_add(v1: number, v2: number) {
    const s = SignTool.number2sign(v1)
    const v = Math.abs(v1) + v2
    const v_out = SignTool.value2signed(v, s)
    return v_out
  }

  static abs_depreciate(v1: number, v2: number) {
    const s = SignTool.number2sign(v1)
    const v = Math.max(Math.abs(v1) - v2, 0)
    const v_out = SignTool.value2signed(v, s)
    return v_out
  }

  static modulo_positive(x: number, p: number) {
    return ((x % p) + p) % p;
  }

  static number_offset2modulo(v: number, offset: number, divider: number) {
    /**
     * When divider=100, offset=4,
     * then 4<= modulo <104
     * 
     * If v=3, modulo=103
     * If v=99, modulo=99
     */
    return (v + divider - offset) % divider + offset;
  }

  static num2sign(v: number):number {
    if (!v) { return v; }
    if (v > 0) { return 1; }
    if (v < 0) { return -1; }
    throw new Error(`Invalid v: ${v}`)
  }
  static num2posneg(v:number){
    const cls = MathTool;
    return cls.num2sign(v) == -1 ? -1 : 1;
  }

  static randomInRange(lowerbound: number, upperbound: number):number {
    return Math.random() * (upperbound - lowerbound) + lowerbound;
  }

  static counts2accums(counts: number[]) {
    // https://www.codegrepper.com/code-examples/javascript/javascript+array+of+cumulative+sum
    // return counts.map((sum => value => sum += value)(0));
    // return counts.map((v, i) => (i > 0 ? this[i - 1] : 0) + v, []);
    const reducer = (l_out, v, i) => {
      const s_prev = i > 0 ? l_out[i - 1] : 0;
      const s_out = s_prev + v;
      l_out.push(s_out);
      return l_out;
    }
    return counts.reduce(reducer, []);
  }

  static index_accums2rank(index: number, accums: number[]) {
    if (index === 0) { return 1; }

    return accums[index - 1] + 1;
  }

  static index2offset_mycenter(numbers: number[], index: number) {
    const length_to_mycenter = MathTool.sum(numbers.slice(0, index)) + numbers[index] / 2;
    const length_to_center = MathTool.sum(numbers) / 2;
    const offset = length_to_mycenter - length_to_center;
    return offset
  }

  static index2offratio_mycenter(numbers: number[], index: number) {
    const offset = MathTool.index2offset_mycenter(numbers, index);
    return offset / MathTool.sum(numbers);
  }
}
