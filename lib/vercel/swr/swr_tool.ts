import React from 'react';
import { MutatorCallback, MutatorOptions, SWRConfiguration, SWRResponse } from 'swr';
import ArrayTool from '../../collection/array/array_tool';
import DateTool from '../../date/date_tool';
import { Dictkey } from '../../native/native_tool';
import HookTool, { Hookcodec } from "../../react/hook/hook_tool";
import DictTool from '../../collection/dict/dict_tool';
import FunctionTool from '../../function/function_tool';
import CmpTool from '../../cmp/CmpTool';

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

export class Swrstate{
  value: string;

  static ERRONEOUS:Swrstate = {value:"ERRONEOUS"};
  static LOADING_NODATA:Swrstate = {value:"LOADING_NODATA"};
  static VALIDATING_NODATA:Swrstate = {value:"VALIDATING_NODATA"};
  static VALIDATING_HASDATA:Swrstate = {value:"VALIDATING_HASDATA"};
  static LOADING_HASDATA:Swrstate = {value:"LOADING_HASDATA"};
  static VALIDATED:Swrstate = {value:"VALIDATED"};

  static list = () => [
    Swrstate.ERRONEOUS,
    Swrstate.LOADING_NODATA,
    Swrstate.VALIDATING_NODATA,
    Swrstate.VALIDATING_HASDATA,
    Swrstate.LOADING_HASDATA,
    Swrstate.VALIDATED,
  ]
  static values = () => Swrstate.list()?.map(x => x.value);
  static value2obj = ArrayTool.array2f_k2v(Swrstate.list(), x => x.value);
  static value2index = ArrayTool.array2f_index(Swrstate.values());
  static pair2cmp = CmpTool.f_key2f_cmp<string>(value => Swrstate.value2index(value));
  
  static gt = CmpTool.f_cmp2f_gt(Swrstate.pair2cmp);
  static gte = CmpTool.f_cmp2f_gte(Swrstate.pair2cmp);
  static lt = CmpTool.f_cmp2f_lt(Swrstate.pair2cmp);
  static lte = CmpTool.f_cmp2f_lte(Swrstate.pair2cmp);

}

export default class SwrTool {
  static x2fallback_data = <X>(x:X):{fallbackData?:X} => (x!=null ? { fallbackData: x } : undefined);
  static conf_staystale = ():Pick<SWRConfiguration, 'revalidateIfStale'|'revalidateOnFocus'|'revalidateOnReconnect'> => ({
    // keepPreviousData: true,  // very controversial.... key change rare anyway...
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  })
  static fallback2conf_staystale = <X>(
    fallbackData:X
  ):Pick<SWRConfiguration, 'fallbackData'|'revalidateIfStale'|'revalidateOnFocus'|'revalidateOnReconnect'> => {
  // ):Pick<SWRConfiguration, 'fallbackData'|'revalidateIfStale'|'revalidateOnFocus'|'revalidateOnReconnect'|'keepPreviousData'> => {
    const cls = SwrTool;
    return {
      ...fallbackData == null
        ? {}
        : {
          // keepPreviousData: true,  // very controversial.... key change rare anyway...
          fallbackData,
          ...cls.conf_staystale(),
        },
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

  static swrs2are_dataready = (swrs:SWRResponse<any>[]):boolean => swrs?.every(SwrTool.swr2is_data_ready);
  static swrdict2keys_notready = <T>(swrdict:T):Dictkey[] => {
    return DictTool.keys(DictTool.dict2filtered(swrdict, (_,swr) => !SwrTool.swr2is_data_ready(swr)));
  }

  static swrdict2is_dataready = <T>(swrdict:T):boolean => {
    const callname = `SwrTool.swrdict2is_dataready @ ${DateTool.time2iso(new Date())}`;

    const dict_k2b = DictTool.dict2values_mapped(swrdict, (_,swr:SWRResponse<any>) => SwrTool.swr2is_data_ready(swr))
    const is_dataready = ArrayTool.all(Object.values(dict_k2b))
    // console.log({callname, is_dataready, dict_k2b})
    return is_dataready
    // return Object.values(swrdict).map((swr:SWRResponse<any>) => SwrTool.swr2is_data_ready(swr));
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
  static list_swr2one_swr = <T>(list_swr:SWRResponse<T[]>):SWRResponse<T> => SwrTool.swr2codeced<T[],T>(list_swr, SwrTool.codec_list2one<T>()); 
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

  static swr2codecspiped = <P,C>(
    swr: SWRResponse<P>,
    codecs: Hookcodec<any,any>[],
  ): SWRResponse<C> => {
    const codec: Hookcodec<P,C> = HookTool.codecs2piped(codecs);
    return SwrTool.swr2codeced(swr, codec);
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
  static swr2is_loaded = (swr:SWRResponse):boolean => swr == null ? undefined : !swr?.isLoading;

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

  static swr2is_validated = (swr:SWRResponse) => {
    if (swr == null) return undefined;
    if (swr.error) return false;
    if (swr.isValidating) return false;
    return true;
  }

  static swr2state = (swr:SWRResponse):string => {
    if(swr == null) return undefined;
    if(swr.error) return Swrstate.ERRONEOUS.value;
    if(swr.isLoading){
      return swr.data == null
        ? Swrstate.LOADING_NODATA.value
        : Swrstate.LOADING_HASDATA.value;
    }

    const is_data_nulllike = ArrayTool.any([
      swr.data === undefined,
      ArrayTool.all([
        SwrTool.swr2is_swrinfinite(swr,),
        swr.data == null
      ])
    ]);

    return !swr.isValidating
      ? Swrstate.VALIDATED.value
      : is_data_nulllike
        ? Swrstate.VALIDATING_NODATA.value
        : Swrstate.VALIDATING_HASDATA.value
  }
  static swr_state2cmp = (swr:SWRResponse, state:string) => Swrstate.pair2cmp(SwrTool.swr2state(swr), state);
  static swr_state2gte = CmpTool.f_cmp2f_gte(SwrTool.swr_state2cmp,)
  static swr2gte_validating_hasdata = (swr:SWRResponse) => SwrTool.swr_state2cmp(swr, Swrstate.VALIDATING_HASDATA.value)
  static swr2is_data_ready = SwrTool.swr2gte_validating_hasdata;

  // should change name to has_showabledata
  static swr2is_data_ready_original = (swr:SWRResponse):boolean => {
    const cls = SwrTool;
    const callname = `SwrTool.swr2is_data_ready @ ${DateTool.time2iso(new Date())}`;

    // console.log({callname, swr, 'swr.isValidating':swr.isValidating, 'swr.error':swr.error, 'swr.data':swr.data,})

    if (!swr) { return false; }
    if (swr.error) { return false; }
    if (swr.isValidating && swr.data === undefined) return false;
    if(SwrTool.swr2is_swrinfinite(swr,) && swr.data == null) return false;
    
    return true;

    // console.log({swr, 'swr.data':swr.data, 'swr.data':swr.data});
    if (swr.error) { return false; }
    return swr.data !== undefined;
  }

  static swr2has_showabledata_keymatching = FunctionTool.fabs2fab_every([
    SwrTool.swr2is_data_ready,
    swr => !swr.isLoading,
  ])

  static swr2is_data_settled(swr:SWRResponse):boolean {
    return ArrayTool.all([
      SwrTool.swr2is_data_ready(swr),
      !swr.isValidating,
    ]);
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

  // static f_data2f_swr_blocking = <T>(
  //   f_data2blocking:(t:T) => boolean,
  // ) => {
  //   return (swr:SWRResponse<T>) => {
  //     if(swr.isLoading){ return true; }
  //     if(f_data2blocking(swr.data)){ return true; }
  //     return false;
  //   }
  // }

}

export class EndpointState {
  static NOT_READY = 'not_ready';
  static GIVEUP = 'giveup';
  static READY = 'ready';

  static state2is_fetching(state: string) {
    return state === this.NOT_READY;
  }
}
