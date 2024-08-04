import DateTool from "../date/date_tool";

/** https://stackoverflow.com/a/56370310 */
// type Last<T extends any[]> = T extends [...infer I, infer L] ? L : never; // not working
// type LastParameter<F extends (...args: any)=>any> = Last<Parameters<F>>;


export default class ProfilingTool{
  
  static promise2profiled = async <T>(
    p:Promise<T>,
    name:string,
    option?:{disabled?:boolean},
  ):Promise<T> => {
    const callname = `ProfilingTool.variant2name @ ${DateTool.time2iso(new Date())}`;

    if(option?.disabled){
      return p;
    }

    const date_start = new Date();
    const prefix = `[Profile] [${name}]`;
    // console.log(`${prefix} started @ ${DateTool.time2iso(date_start)}`);
    return p.then((t:T) => {
      const date_end = new Date();
      const sec_duration = DateTool.subtract2secs(date_end, date_start);
      console.log(`${prefix} done @ ${DateTool.time2iso(date_end)} (${Math.floor(sec_duration*1000)} ms)`);
      return t;
    })
  }

  // flow<A extends any[], R1, R2>(f1: (...args: A) => R1, f2: (a: R1) => R2): (...args: A) => R2;
  static afunc2profiled = <T, A extends any[]>(
    afunc:(...args:A) => Promise<T>,
    name:string,
    option?:Parameters<typeof ProfilingTool.promise2profiled>[2],
  ):((...args:A) => Promise<T>) => {
    return (...args) => ProfilingTool.promise2profiled(afunc(...args), name, option);
  }
}
