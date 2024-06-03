import { DateTime, DateTimeUnit, DurationLike, WeekNumbers, WeekdayNumbers } from "luxon";
import DateTool from "../date_tool";
import { Pair } from "../../native/native_tool";
import MathTool from "../../number/math/math_tool";
import CmpTool, { Bicomparator, Comparator } from "../../cmp/CmpTool";
import lodash from "lodash";
import ArrayTool from "../../collection/array/array_tool";

// export class LuxonDuration{
//   static units = () => ['years', 'months', 'days', ]
// }
export class DatetimeUnit {
  static list = () => ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond']
  static dict_unit2parent = () => {
    return {
      quarter:'year',
      month:'year',
      week:'year',
      day:'month',
      hour:'day',
      minute:'hour',
      second:'minute',
      millisecond:'second',
    }
  }
}
export default class LuxonTool{
  // static units = () => ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond']

  static weekday2is_montofri = (weekday:WeekdayNumbers):boolean => ArrayTool.in(weekday, [1,2,3,4,5])
  static dt2clone = (dt_in:DateTime): DateTime => dt_in == null ? dt_in : DateTime.fromMillis(dt_in.toMillis());

  // static dt_comparator:Comparator<DateTime>
  static dtpair2cmp:Comparator<DateTime> = CmpTool.f_key2f_cmp(dt => dt?.toMillis(), MathTool.pair2cmp,);
  static dtpair2eq:Bicomparator<DateTime> = CmpTool.f_cmp2f_eq(LuxonTool.dtpair2cmp)

  static startOf = (dt:DateTime, unit:DateTimeUnit):DateTime => LuxonTool.dt2clone(dt)?.startOf(unit);
  static endOf = (dt:DateTime, unit:DateTimeUnit):DateTime => LuxonTool.dt2clone(dt)?.endOf(unit);
  
  static plus = (dt:DateTime, duration:DurationLike):DateTime => LuxonTool.dt2clone(dt)?.plus(duration);
  static minus = (dt:DateTime, duration:DurationLike):DateTime => LuxonTool.dt2clone(dt)?.minus(duration);

  static md2dt_next = (dt_pivot:DateTime, unit:{month:number, day:number}) => {
    const dt_new = LuxonTool.dt2clone(dt_pivot)?.set(unit)?.startOf('day');
    return dt_new >= dt_pivot ? dt_new : dt_new?.plus({year:1})
  }
  static md2dt_last = (dt_pivot:DateTime, unit:{month:number, day:number}) => {
    return LuxonTool.md2dt_next(dt_pivot, unit)?.minus({year:-1});
  }
  // (dow:number):number{
  //   return MathTool.mod(dow, 7);
  // }

  static dow2dowJs(dow:number):number{
    return MathTool.mod(dow, 7);
  }

  static dt2day8(dt:DateTime): number{
    if(dt == null){ return undefined; }
    return dt.year * 10000 + dt.month*100 + dt.day;
    // return `${dt.year}${NumberTool.pad(dt.month, 2)}${NumberTool.pad(dt.day, 2)}`;
  }

  static dt2time4(dt:DateTime): number{
    if(dt == null){ return undefined; }
    return dt.hour * 100 + dt.minute;
    // return `${dt.year}${NumberTool.pad(dt.month, 2)}${NumberTool.pad(dt.day, 2)}`;
  }

  static dt2daytime12(dt:DateTime): number{
    if(dt == null){ return undefined; }
    return LuxonTool.dt2day8(dt) * 10000 + LuxonTool.dt2time4(dt);
    // return `${dt.year}${NumberTool.pad(dt.month, 2)}${NumberTool.pad(dt.day, 2)}`;
  }
  // static dt2day8(dt:DateTime): string{
  //   return `${dt.year}${NumberTool.pad(dt.month, 2)}${NumberTool.pad(dt.day, 2)}`;
  // }

  static datetime2ordinal_milliseconds(dt: DateTime): number {
    const days = dt.ordinal - 1;
    const hours = days * 24 + dt.hour;
    const minutes = hours*60 + dt.minute;
    const seconds = minutes*60 + dt.second;
    const milliseconds = seconds * 1000 + dt.millisecond;
    return milliseconds;
  }

  /**
 * https://stackoverflow.com/a/10789415/1902064
 */
  static datetime2rounded(
    dt: DateTime,
    unit_millisecs: number,
    options?: {
      f_round?: (v: number) => number
    },
  ): DateTime {
    const cls = LuxonTool;
    const callname = `LuxonTool.datetime2rounded @ ${DateTool.time2iso(new Date())}`;

    if (unit_millisecs * 2 > 1000 * 60 * 60 * 24 * 365) { throw new Error() }

    const f_round = options?.f_round ?? Math.round;
    const ms_ordinal = cls.datetime2ordinal_milliseconds(dt);

    const ms_rounded = f_round(ms_ordinal / unit_millisecs) * unit_millisecs;
    const dt_out = cls.startOf(dt,'year').plus({milliseconds:ms_rounded});
    
    return dt_out;
  }

  static pivot2datespan(pivot:DateTime, duration:DurationLike):Pair<DateTime>{
    return [pivot, LuxonTool.plus(pivot,duration)];
  }


  static dt2is_am(dt:DateTime): boolean{
    return dt == null ? undefined : dt.hour < 12;
  }

  static luxon_weekday2js_dayindex(luxon_weekday:number){
    return luxon_weekday % 7;
  }


  static date_tz2midnight(d:Date, tzname:string):Date {
    if(!d){ return undefined; }
    return DateTime.fromJSDate(d).setZone(tzname).startOf('day').toJSDate();
  }

  static date_tz2secmidnight_secoffset(d:Date, tzname:string):[number,number]{
    const cls = LuxonTool;
    if(!d){ return undefined; }

    const midnight = cls.date_tz2midnight(d, tzname);

    const sec = d.getTime() / 1000;
    const secmidnight = midnight.getTime()/1000;
    const secoffset = sec - secmidnight;
    return [secmidnight, secoffset];
  }

  static date_tz2secoffset(d:Date, tzname:string):number{
    const cls = LuxonTool;
    if(!d){ return undefined; }

    const [secmidnight, secoffset] = cls.date_tz2secmidnight_secoffset(d, tzname);
    return secoffset;
  }

  // static datetime2tz_subbed(dt:DateTime, tz_from:string, tz_to:string):DateTime{
  //   return dt ? dt.setZone(tz_from).setZone(tz_to, {keepLocalTime:true}) : undefined;
  // }

  static date2tz_subbed(d:Date, tz_from:string, tz_to:string):Date{
    const cls = LuxonTool;
    // if(!d){ return undefined; }
    
    return d ? cls.datetime2tz_subbed(DateTime.fromJSDate(d), tz_from, tz_to)?.toJSDate() : undefined;
  }

  static datetime2tz_subbed(dt:DateTime, tz_from:string, tz_to:string):DateTime{
    return dt ? dt.setZone(tz_from).setZone(tz_to, {keepLocalTime:true}) : undefined;
  }

  static diffms = (dt1:DateTime, dt2:DateTime):number => {
    if(dt1 == null){ return undefined; }
    if(dt2 == null){ return undefined; }
    
    return dt1.diff(dt2)?.milliseconds;
  }

  static gt = CmpTool.f_cmp2f_gt(LuxonTool.diffms);
  static gte = CmpTool.f_cmp2f_gte(LuxonTool.diffms);
  static lt = CmpTool.f_cmp2f_lt(LuxonTool.diffms);
  static lte = CmpTool.f_cmp2f_lte(LuxonTool.diffms);

}