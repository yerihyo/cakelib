import React from 'react';
import useSWR, { BareFetcher, MutatorCallback, MutatorOptions, SWRConfiguration, SWRResponse } from 'swr';
import ArrayTool from '../../collection/array/array_tool';
import JsonTool from '../../collection/dict/json/json_tool';
import DateTool from '../../date/date_tool';
import { Dictkey } from '../../native/native_tool';
import HookTool, { Hookcodec } from "../../react/hook/hook_tool";
import DictTool from '../../collection/dict/dict_tool';
import { SWRInfiniteResponse } from 'swr/dist/infinite';

const assert = require('assert');


export type Dummyswrhook<T> = ((config?: SWRConfiguration<T>) => SWRResponse<T>)

export class Swrinfo<TT>{
  array: SWRResponse<TT[]>;
  dict: SWRResponse<Record<Dictkey, TT>>;

  static arrayswr2swrinfo = <T, K extends Dictkey>(
    arrayswr: SWRResponse<T[]>,
    obj2key: (t: T) => K,
  ):Swrinfo<T> => {
    const cls = Swrinfo;
    return {
      dict:SwrTool.array2dict(arrayswr, obj2key),
      array:arrayswr,
    };
  }

  static swrinfo2is_data_ready = <T>(swrinfo:Swrinfo<T>) => {
    return ArrayTool.all([
      SwrTool.swr2is_data_ready(swrinfo.array),
      SwrTool.swr2is_data_ready(swrinfo.dict),
    ]);
  }
}

export default class SwrTool {

  static x2fallback_data = <X>(x:X):{fallbackData?:X} => (x!=null ? { fallbackData: x } : undefined);
  static fallback2conf_staystale = <X>(
    fallbackData:X
  ):Pick<SWRConfiguration, 'fallbackData'|'revalidateIfStale'|'revalidateOnFocus'|'revalidateOnReconnect'|'keepPreviousData'> => {
    return {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      ...fallbackData == null ? {} : {fallbackData},
    };
  }
  
  // static useSWR_if_nullable<T>(
  //   swr: SWRResponse<T>,
  //   generator: (k:string[]) => SWRResponse<T>,
  //   key:string[]
  // ):SWRResponse<T> {
  //   const is_null = swr == null;
  //   const swr_new = generator(is_null ? key : undefined);
  //   return is_null ? swr_new : swr;
  // }

  static swrdict2is_dataready = <T>(swrdict:T):boolean => {
    return Object.values(swrdict).every((swr:SWRResponse<any>) => SwrTool.swr2is_data_ready(swr));
  }

  static swrdict2isdataready_dict = <T>(swrdict:T):Record<string,boolean> => 
    DictTool.dict2values_mapped(swrdict, (_,swr) => SwrTool.swr2is_data_ready(swr))

  static swrdict2has_error = <T>(swrdict:T):boolean => {
    return Object.values(swrdict).some((swr:SWRResponse<any>) => !!swr.error);
  }

  static swrdict2is_validating(swrdict:any):boolean{
    return Object.values(swrdict).some((swr:SWRResponse<any>) => swr.isValidating);
  }

  static swr_or_new<T>(swr: SWRResponse<T>, creator: () => SWRResponse<T>): SWRResponse<T> {
    return swr != null ? swr : creator();
  }

  // static data2swr<T>(
  //   data:T,
  // ): SWRResponse<T>{
  //   return {
  //     isLoading:true,
  //     isValidating:false,
  //     data,
  //     mutate:undefined,
  //     // error:undefined,
  //   };
  // }

  static swr2postprocessed<I,O>(
    swr:SWRResponse<I>,
    data2processed:(i:I) => O,
  ): SWRResponse<O>{
    return {
      ...swr,
      data:data2processed(swr.data),
      mutate: () => swr?.mutate?.()?.then(data2processed), // works only with no parameters
    };
  }

  static codec_list2one = <T>() => ({ decode: (l:T[]) => ArrayTool.l2one(l), encode: (t:T) => ArrayTool.one2l(t) });
  static list_swr2one_swr = <T>(list_swr:SWRResponse<T[]>):SWRResponse<T> => SwrTool.swr2codeced(list_swr, SwrTool.codec_list2one<T>()); 
  static list_swr2singleton_swr = SwrTool.list_swr2one_swr;

  static swr2codeced<P,C>(
    swr: SWRResponse<P>,
    codec: { encode: (c: C) => P, decode: (p: P) => C },
  ): SWRResponse<C>{
    const callname = `SwrTool.swr2codeced @ ${DateTool.time2iso(new Date())}`;
    const {encode, decode} = codec;

    const c_prev:C = decode(swr.data);

    const mutate_out = async (
      action?: C | Promise<C> | MutatorCallback<C>,
      opts?: boolean | {revalidate:boolean}, // boolean | MutatorOptions<P> // need to change later
    ):Promise<C> => {
      

      const is_function = x => (typeof x === 'function');
      const c_in = is_function(action) ? (action as MutatorCallback<C>)(c_prev) : (action as C);
      const p_in = encode(await c_in);

      // console.log({
      //   callname,
      //   p_in,
      // })
      const p_out = await swr.mutate(p_in, opts);
      const c_out = decode(p_out);
      return c_out;
    }
    return {
      ...swr,
      data:c_prev,
      mutate: mutate_out, // works only with no parameters
    };
  }

  static mutopt_norevalidate():MutatorOptions{
    return {
      populateCache: true,
      revalidate:false,
    }
  }

  static array2dict<T,K extends Dictkey>(
    swr:SWRResponse<T[]>,
    obj2key:(t:T) => K,
  ): SWRResponse<Record<K,T>>{
    const cls = SwrTool;

    return cls.swr2postprocessed(swr, data => ArrayTool.array2dict(data, obj2key));
  }

  // static option_revalidateOnce = <T>():SWRConfiguration<T> =>  {
  //   return {
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false
  //   };
  // }
  // static option_immutable = <T>():SWRConfiguration<T> =>  {
  //   return {
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false
  //   };
  // }

  static swr2is_loading(swr) {
    if (!swr) { return true; }
    assert(swr);

    if (swr.error) { return false; }
    return swr.data === undefined;
  }

  static swr2data<X>(swr: SWRResponse<X, any>): X {
    return swr ? swr.data : undefined;
  }

  static swr2isValidating(swr) {
    return swr ? swr.isValidating : undefined;
  }

  static swr2is_fetch_ended(swr) {
    const self = SwrTool;
    return !self.swr2is_loading(swr);
  }

  static swr2is_swrinfinite = (swr:SWRResponse):boolean => swr == null ? undefined : Object.hasOwn(swr, 'size');

  static swr2is_data_ready(swr:SWRResponse) {
    const cls = SwrTool;

    if (!swr) { return false; }
    if (swr.error) { return false; }
    if (swr.isValidating && swr.data === undefined) return false;
    if(SwrTool.swr2is_swrinfinite(swr,) && swr.data == null) return false;
    
    return true;

    // console.log({swr, 'swr.data':swr.data, 'swr.data':swr.data});
    if (swr.error) { return false; }
    return swr.data !== undefined;
  }

  static swr2useErrorCount = <V,E>(swr:SWRResponse<V, E>):number => {
    const self = SwrTool;

    const errorCountRef = React.useRef(0);
    const swrChanged = HookTool.spinlockChanged(swr,);
    if (!swrChanged) { return errorCountRef.current; }

    if (swr.error) {
      errorCountRef.current += 1;
      return errorCountRef.current;
    }

    if (self.swr2is_loading(swr)) {
      return errorCountRef.current;
    }

    errorCountRef.current = 0;
    return errorCountRef.current;

  }

  static value2sticky = <T>(t:T):T  => {
    const cls = SwrTool;

    // https://github.com/vercel/swr/issues/192#issuecomment-568944696
    const ref = React.useRef<T>(t);
    if (t !== undefined){ ref.current = t; }
    return ref.current;
  }

  /**
   * https://github.com/vercel/swr/issues/192#issuecomment-568944696
   * @param swr 
   */
  static swr2sticky = <T>(
    swr:SWRResponse<T>,
  ):SWRResponse<T> => {
    const cls = SwrTool;
    
    const ref = React.useRef(swr?.data);
    if (swr?.data !== undefined){ ref.current = swr.data; }

    return {
      ...swr,
      data:ref.current,
    };
  }

  static f_data2f_swr_blocking = <T>(
    f_data2blocking:(t:T) => boolean,
  ) => {
    return (swr:SWRResponse<T>) => {
      if(swr.isLoading){ return true; }
      if(f_data2blocking(swr.data)){ return true; }
      return false;
    }
  }

}

export class EndpointState {
  static NOT_READY = 'not_ready';
  static GIVEUP = 'giveup';
  static READY = 'ready';

  static state2is_fetching(state: string) {
    return state === this.NOT_READY;
  }
}
