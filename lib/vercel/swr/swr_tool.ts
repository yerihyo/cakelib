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

  /**
   * codec 을 씌운 SWR view.
   *
   * **`data` 의 신원(identity)은 원본이 그대로면 유지된다.** 예전에는 렌더마다 `decode` 를 다시 불러
   * 같은 데이터인데도 매번 새 객체를 돌려줬고, 그것을 캐시 키·의존성으로 쓰는 쪽이 전부 헛돌았다
   * (2026-08-21 근태: kit 이 매 렌더 새 객체라 101명 × 12개월 × 31일 ≈ 37,000회 파싱이 매 렌더 반복).
   * 캐시 키는 `(원본 신원, decode 신원)` 이고 `decode` 는 순수 함수라 낡은 값이 나올 여지가 없다
   * — 원본을 **제자리에서** 고치는 코드가 있다면 그건 이 캐시와 무관하게 이미 리렌더를 못 만든다.
   */
  static swr2codeced<P,C>(
    swr: SWRResponse<P>,
    codec: { encode: (c: C) => P, decode: (p: P) => C },
  ): SWRResponse<C>{
    const callname = `SwrTool.swr2codeced @ ${DateTool.time2iso(new Date())}`;
    const {encode, decode} = codec;

    const c_prev:C = SwrTool.p_decode2decoded(swr.data, decode);

    const mutate_out = async (
      ...args: [
        action?: C | Promise<C> | MutatorCallback<C>,
        opts?: boolean | {revalidate:boolean},
      ]
      // boolean | MutatorOptions<P> // need to change later
    ):Promise<C> => {
      // ⚠ 인자 **개수**를 그대로 보존한다. SWR 의 `internalMutate` 는 `args.length < 3` 일 때만 "재검증" 으로
      //   보므로, 인자 없이 불린 것을 `mutate(undefined, undefined)` 로 바꿔 넘기면 캐시가 undefined 로
      //   덮인 뒤에 재검증된다 (저장할 때마다 화면이 한 틱 비워진다).
      if (args.length === 0) return decode(await swr.mutate());

      const [action, opts] = args;
      const is_function = x => (typeof x === 'function');
      const c_in = is_function(action) ? (action as MutatorCallback<C>)(c_prev) : (action as C);
      const p_in = encode(await c_in);

      const p_out = await swr.mutate(p_in, opts);
      const c_out = decode(p_out);
      return c_out;
    }
    return {
      ...swr,
      data:c_prev,
      mutate: mutate_out,
    };
  }

  /**
   * `decode(p)` 를 **원본 신원마다 한 번만** 부른다 ([[swr2codeced]] 의 신원 유지).
   *
   * 애초에 이게 필요한 이유는 [[swr2codeced]] 에 **`p_prev` 가 없기 때문**이다. 렌더마다 새로 불리는
   * 순수 함수라 "지난번과 같은 원본인가" 를 스스로 알 수 없고, 그래서 매번 새로 디코드할 수밖에 없었다.
   * 이 WeakMap 이 그 `p_prev` 자리를 대신한다 — 원본을 키로 두어 "전에 본 적 있는 p 인가" 를 기억한다.
   *
   * hook 이 아니다 — `WeakMap` 이라 컴포넌트 밖에서도 되고 원본이 GC 되면 캐시도 같이 사라진다.
   * `decode` 신원까지 키에 넣으므로 같은 배열을 서로 다른 codec 이 디코드해도 섞이지 않는다.
   * 매번 새로 만드는 `decode`(inline arrow)를 넘기면 그냥 매번 다시 디코드한다 — 예전과 같은 동작이다.
   *
   * **전제 둘** (2026-08-22 에 코드베이스 전수 확인):
   * ① `decode` 가 순수하다 — `document/` 의 `*2kit` 함수에 비순수 요소 없음 (`new Date()` 는 전부 로그용).
   * ② `p` 의 신원이 값의 변화를 대변한다 — SWR 이 새 데이터를 새 객체로 넣어 주고, 배열을 제자리에서
   *    고치는 코드는 없다. (있다면 그건 이 캐시와 무관하게 React 리렌더도 못 만드는 코드다). 즉, Functional 하다.
   */
  static p_decode2decoded = (() => {
    // 캐시는 closure 안 — 바깥에서 만질 수 없다 ([[CacheTool.memo_one]] 이 `prev` 를 숨기는 것과 같은 방식).
    // WeakMap 이라 원본(SWR 이 들고 있는 배열)이 버려지면 그 칸도 같이 사라진다.
    //
    // `memo_one` 을 못 쓰는 이유: 여기는 **모든 kit_swr 이 공유하는 자리**라 직전 1회만 기억하면
    // 서로 다른 조회들이 매번 서로를 밀어낸다 (`p_prev` 가 하나뿐인 것과 같은 문제).
    const cache_p2dict = new WeakMap<object, Map<Function, any>>();

    return <P,C>(p:P, decode:(p:P) => C):C => {
      // 원시값·null 은 WeakMap 키가 될 수 없다. decode 도 대개 즉시 끝난다.
      if (p == null || (typeof p !== 'object' && typeof p !== 'function')) return decode(p);

      const dict_decode2decoded = cache_p2dict.get(p as any) ?? new Map<Function, any>();
      if (!dict_decode2decoded.has(decode)) {
        dict_decode2decoded.set(decode, decode(p));
        cache_p2dict.set(p as any, dict_decode2decoded);
      }
      return dict_decode2decoded.get(decode);
    };
  })();

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

    const is_data_yetinit = ArrayTool.any([
      swr.data === undefined,
      ArrayTool.all([
        SwrTool.swr2is_swrinfinite(swr,),
        swr.data == null
      ])
    ]);

    if(swr.isLoading){
      return is_data_yetinit
        ? Swrstate.LOADING_NODATA.value
        : Swrstate.LOADING_HASDATA.value;
    }

    return !swr.isValidating
      ? Swrstate.VALIDATED.value
      : is_data_yetinit
        ? Swrstate.VALIDATING_NODATA.value
        : Swrstate.VALIDATING_HASDATA.value
  }
  static swr_state2cmp = (swr:SWRResponse, state:string) => Swrstate.pair2cmp(SwrTool.swr2state(swr), state);
  static swr_state2gte = CmpTool.f_cmp2f_gte(SwrTool.swr_state2cmp,)
  static swr2gte_validating_hasdata = (swr:SWRResponse) => SwrTool.swr_state2gte(swr, Swrstate.VALIDATING_HASDATA.value)
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
