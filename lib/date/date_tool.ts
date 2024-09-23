/**
 * toLocaleString format
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options 
 **/

import { DateTime } from 'luxon';
import CmpTool from '../cmp/CmpTool';
import ArrayTool from '../collection/array/array_tool';
import FunctionTool from '../function/function_tool';
import NativeTool, { Pair, Triple } from '../native/native_tool';
import MathTool from '../number/math/math_tool';
import NumberTool from '../number/number_tool';

export default class DateTool {
  static SUNDAY = {value: 0};
  static MONDAY = {value: 1};
  static TUESDAY = {value: 2};
  static WEDNESDAY = {value: 3};
  static THURSDAY = {value: 4};
  static FRIDAY = {value: 5};
  static SATURDAY = {value: 6};

  static secoffset_noon():number{ return 12*60*60; }

  static day8time42daytime12(day8:number, time4:number):number{
    return MathTool.plus(MathTool.times(day8, 10000), time4);
  }

  static daytime122day8time4 = (daytime12:number):{day8:number, time4:number} => {
    if (daytime12 == null) { return undefined; }

    const floor = FunctionTool.func2undef_ifany_nullarg(Math.floor);
    const day8 = floor(MathTool.div(daytime12, 10000));
    const time4 = MathTool.mod(daytime12, 10000);
    return {day8, time4};
  }

  static time42minoffset(time4: number): number {
    if (time4 == null) { return undefined; }
    return Math.floor(time4 / 100) * 60 + (time4 % 100);
  }

  static time4span2minspan = (time4span:Pair<number>):Pair<number> => {
    return time4span?.map(DateTool.time42minoffset) as Pair<number>;
  }

  static minoffset2time4(minoffset: number): number {
    return minoffset == null ? undefined : Math.floor(minoffset / 60) * 100 + (minoffset % 60);
  }

  // static time42minute(time4: number): number {
  //   if (time4 == null) { return undefined; }
  //   return Math.floor(time4 / 100) + (time4 % 100);
  // }

  static time42hhmm(time4: number) {
    const hh = Math.floor(time4 / 100);
    const mm = NumberTool.pad(time4 % 100, 2);

    // const p = time4 < 1200 ? '오전' : '오후';
    return `${hh}:${mm}`
  }

  static time42hhmmp(time4: number) {
    const hh = (Math.floor(time4 / 100) + 11) % 12 + 1;
    const mm = NumberTool.pad(time4 % 100, 2);

    const p = time4 < 1200 ? '오전' : '오후';
    return `${p} ${hh}:${mm}`
  }
  static date2is_maxvalue(date: Date) {
    if (!date) { return date; }
    return date.getFullYear() === 9999;
  }

  static dayindex2str_ko(dayindex: number) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayindex];
  }
  static secs_1day(): number { return 60 * 60 * 24; }

  static years2added(d: Date, years: number) {
    const d_out = new Date(d.getTime());
    d_out.setFullYear(d.getFullYear() + years)
    return d_out;
  }

  static is_iso8601(s: string) {
    // 2022-08-10T00:00:00+0900
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{3}(?:\d{3})?)?(?:Z|(?:\+\d{2}:?\d{2}))/.test(s);

    // return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3}\d{3}?)?Z/.test(s);
    // return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3}(?:\d{3})?)?(?:Z|(?:\+\d{2}:?\d{2}))/.test(s);
  }

  static date2future(d_in: Date, d_pivot: Date, date2nextdate: (d: Date) => Date,) {
    if (!d_in) { return undefined; }

    // const now = new Date();
    // if(v >= v_pivot){ return v; }

    let d_out: Date = d_in;
    while (d_out <= d_pivot) {
      d_out = date2nextdate(d_out);
    }
    return d_out;

    // v.setSeconds(v.getSeconds() + secs_unit);
    // return v;
  }

  // static dt2shifted(date:Date, ms_timemachine){
  //     return DateTool.millisecs2added(date, ms_timemachine); 
  // }

  // static is_in(d:Date, interval){
  //     IntervalTool.interval2point_pair
  //     return IntervalTool.is_in(d, interval);
  // }

  static hour242str_hour_ampm(hour24: number): { hour: number, ampm: 'AM' | 'PM' } {
    if (hour24 == 0) {
      return { hour: 12, ampm: 'AM' };
    }

    return {
      hour: hour24 >= 13 ? hour24 - 12 : hour24,
      ampm: hour24 >= 12 ? 'PM' : 'AM',
    }
  }
  static hms2str(hour, minute, second) {
    const tokens = [hour];

    const has_minute = !!minute;
    const has_second = !!second;

    if (has_minute || has_second) {
      tokens.push(minute);
    }
    if (has_second) {
      tokens.push(second);
    }
    return ArrayTool.join(":", tokens);
  }

  static date2is_valid(d: Date): boolean {
    const cls = DateTool;
    // https://stackoverflow.com/a/1353711
    return (d instanceof Date) && !cls.date2is_invalid(d);
  }

  static date2is_invalid(d: Date): boolean {
    // https://stackoverflow.com/a/1353711
    return isNaN(d.getTime());
  }

  static combine(d1: Date, d2?: Date): Date {
    const callname = `DateTool.combine @ ${DateTool.time2iso(new Date())}`;

    // console.log({ callname, d1: DateTool.date2iso(d1), d2: DateTool.date2iso(d2!), });

    const d = new Date(
      d1.getFullYear(),
      d1.getMonth(),
      d1.getDate(),
      d2 ? d2.getHours() : 0,
      d2 ? d2.getMinutes() : 0,
      d2 ? d2.getSeconds() : 0,
      d2 ? d2.getMilliseconds() : 0,
    );
    // console.log({ callname, d: DateTool.date2iso(d), });
    return d;
  }

  static is_date(d: Date): boolean {
    if (d == null) { return undefined; }
    // https://stackoverflow.com/a/643827/1902064
    return typeof d.getMonth === 'function';
  }

  static max(...dates: Date[]) {
    const dates_valid = dates.filter(Boolean);
    if (!ArrayTool.bool(dates_valid)) { return null; }

    return new Date(Math.max.apply(null, dates_valid));
  }

  static min(...dates: Date[]) {
    const dates_valid = dates.filter(Boolean);
    if (!ArrayTool.bool(dates_valid)) { return null; }

    return new Date(Math.min.apply(null, dates_valid));
  }

  static subtract2millisecs = function (d1: Date, d2: Date): number {
    if (!d1) { return undefined; }
    if (!d2) { return undefined; }

    return d1.getTime() - d2.getTime()
  }
  static subtract2ms = function (d1: Date, d2: Date): number {
    return this.subtract2millisecs(d1, d2)
  }

  static x2is_date(x) {
    // https://stackoverflow.com/a/643827/1902064
    // if (!x) { return false; }
    return typeof x?.getMonth === 'function';
  }

  static date2secs(d: Date): number {
    return d.getTime() / 1000;
  }

  // static dt_pivot2secs_passed_data(dt_pivot:Date){
  //     const now = new Date();
  //     const secs_passed = DateTool.subtract2secs(now, dt_pivot);
  //     return {secs_passed, now};
  // }
  static dt2callstr_data(dt_pivot: Date) {
    const now = new Date();
    const secs_passed = DateTool.subtract2secs(now, dt_pivot);
    const callstr = `+${secs_passed}s @ ${DateTool.time2iso(now)}`;
    return { callstr, now, secs_passed };
  }
  static subtract2secs = function (d1: Date, d2: Date): number {
    const self = DateTool;
    const ms_diff = self.subtract2millisecs(d1, d2);
    if (NativeTool.is_null_or_undefined(ms_diff)) { return ms_diff; }

    return ms_diff / 1000
  }

  static millisecs2added = function (d: Date, millisecs: number): Date {
    if (d == null) { return undefined; }
    if (millisecs == null) { return undefined; }
    // if (millisecs == Infinity){ return Infinity; }
    // console.log({d});
    // https://stackoverflow.com/a/12795802
    return new Date(d?.getTime() + millisecs);
  }
  static ms2added = DateTool.millisecs2added;

  static secs2added = (d: Date, secs: number): Date  =>  DateTool.ms2added(d, MathTool.times(secs,1000));
  static mins2added = (d: Date, mins: number): Date  =>  DateTool.secs2added(d, MathTool.times(mins,60));
  static hours2added = (d: Date, hours: number): Date  =>  DateTool.mins2added(d, MathTool.times(hours,60));
  static days2added = (d: Date, days: number): Date  =>  DateTool.hours2added(d, MathTool.times(days,24));
  static day8days2added = (d: number, days: number): number => DateTool.date2day8(DateTool.days2added(DateTool.day82date(d), days));

  static date2iso = function (d: Date): string {
    return d?.toISOString()
  }

  static date2getTime(d: Date): number {
    return d ? d.getTime() : undefined;
  }

  static time2iso = (d: Date): string => d?.toISOString()?.split("T")?.[1];

  static x2date(x): Date {
    const self = DateTool;
    return self.x2is_date(x) ? x : self.str2date(x);
  }

  static str2date(s: string): Date {
    return s ? (new Date(s)) : undefined;
  }

  static day82date(v: number): Date {
    if (v == null) { return undefined; }

    const y = Math.floor(v / 10000);
    const m = Math.floor(v % 10000 / 100) - 1;
    const d = v % 100;
    return new Date(y, m, d);
  }

  static date2day8(d: Date): number {
    if (d == null) { return undefined; }

    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }


  // static date_tz2dict_ymdhms(d:Date, timeZone?:string){
  //     const callname = `DateTool.date_tz2dict_ymdhms @ ${DateTool.time2iso(new Date())}`;

  //     const str_datetime = d.toLocaleString('en-US', {timeZone:timeZone || 'UTC'}); // "12/19/2012, 7:00:00 PM"

  //     console.log({str_datetime, timeZone, d});
  //     const [str_date, str_time, str_ampm] = str_datetime.split(' ');

  //     const [str_month, str_dom, str_year] = str_date.slice(0,-1).split('/');
  //     const [str_hour, str_minute, str_second] = str_time.split(':');

  //     return {
  //         year:parseInt(str_year),
  //         month:parseInt(str_month),
  //         dom:parseInt(str_dom),
  //         hour:parseInt(str_hour),
  //         minute:parseInt(str_minute),
  //         second:parseInt(str_second),
  //         ampm:str_ampm,
  //     }

  // }

  // static lookup_or_null = function(h:Object, k:string){
  //     const s = DictTool.get(h, k, null)
  //     if(!s){ return null }

  //     const d = new Date(s)
  //     return d
  // }

  static pair2cmp = CmpTool.f_key2f_cmp<Date, number>(
    (d:Date) => d?.getTime(),
    CmpTool.pair2cmp_default,
  );
  static lte = CmpTool.f_cmp2f_lte(DateTool.pair2cmp);
  static lt = CmpTool.f_cmp2f_lt(DateTool.pair2cmp);
  static gte = CmpTool.f_cmp2f_gte(DateTool.pair2cmp);
  static gt = CmpTool.f_cmp2f_gt(DateTool.pair2cmp);

  // static pair2cmp(x: Date, y: Date) {
  //   if (x === y) { return 0; }
  //   if (NativeTool.is_null_or_undefined(x)) { return undefined; }
  //   if (NativeTool.is_null_or_undefined(y)) { return undefined; }

  //   const [a, b] = [x, y].map(d => d.getTime())
  //   if (a > b) { return 1 }
  //   if (a == b) { return 0 }
  //   if (a < b) { return -1 }

  //   return undefined;
  // }

  static isEqual = CmpTool.f_cmp2f_eq(DateTool.pair2cmp);
  static equal = DateTool.isEqual;

  static date2midnight(d: Date) {
    const d_out = new Date(d.getTime());
    d_out.setHours(0, 0, 0, 0);
    return d_out;
  }

  static date2floored(d: Date, secs: number) {
    const cls = DateTool;
    return cls.date2rounded(d, secs * 1000, { f_round: Math.floor });

    // if(!d){ return undefined; }
    // return new Date(Math.floor(d.getTime() / (secs * 1000)) * (secs*1000));
  }

  /**
   * https://stackoverflow.com/a/10789415/1902064
   */
  static date2rounded(
    d: Date,
    millisec: number,
    options?: {
      f_round?: (v: number) => number
    }): Date {
    const f_round = options?.f_round ?? Math.round;
    return d ? new Date(f_round(d.getTime() / millisec) * millisec) : undefined;
  }

  static date2replaceHours(d: Date, h?: number, m?: number, s?: number, ms?: number,) {
    const d_out = new Date(d.getTime());
    if (h !== undefined) { d_out.setHours(h, m, s, ms); }
    else if (m !== undefined) { d_out.setMinutes(m, s, ms); }
    else if (s !== undefined) { d_out.setSeconds(s, ms); }
    else if (ms !== undefined) { d_out.setMilliseconds(ms); }
    else { throw new Error('No hour, minutes, seconds, or milliseconds provided'); }

    return d_out;
  }

  static date2replaceMinutes(d: Date, m?: number, s?: number, ms?: number,) {
    const d_out = new Date(d.getTime());
    d_out.setMinutes(m, s, ms);
    return d_out;
  }

  // static pair2cmp_date = CmpTool.f_key2f_cmp<Date>(d => d?.getTime(),);
  // static pair2is_equal_date(x: Date, y: Date) {
  //   return DateTool.pair2cmp_date(x, y) === 0;
  // }

  static max_value() {
    /**
     * reference: https://stackoverflow.com/a/29142324/1902064
     */
    return new Date(8640000000000000);
  }

  static ms2days(ms: number): number { return ms / 1000 / 60 / 60 / 24; }

  static date2secoffset_utc(d: Date): number {
    return (d.getTime() - DateTool.date2midnight(d).getTime()) / 1000;
  }

  static day82ymd = (day8:number):Triple<number> => {
    return day8 == null
      ? undefined
      : [
        Math.floor(day8 / 10000),
        Math.floor(day8 % 10000 / 100),
        day8 % 100,
      ];
  }
}


export class DayspanTool{
  static day2str_to_dayspan2str(day2str:(day8:number) => string):((dayspan:Pair<number>) => string){
    return (dayspan: Pair<number>) => {
      return dayspan?.map(day2str)?.join('-');
    }
  }

}