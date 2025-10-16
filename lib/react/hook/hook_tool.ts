import lodash from 'lodash';
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import CmpTool, { Bicomparator, Comparator, EqualTool } from '../../cmp/CmpTool';
import ArrayTool from '../../collection/array/array_tool';
import { AbsoluteOrder } from '../../collection/array/minimax_tool';
import Queue from '../../collection/deque/queue';
import DictTool from '../../collection/dict/dict_tool';
import JsonTool, { Jpath, Jstep } from '../../collection/dict/json/json_tool';
import DateTool from '../../date/date_tool';
import FunctionTool from '../../function/function_tool';
import StorageTool, { WindoweventTool } from '../../html/storage/StorageTool';
import NativeTool, { Dictkey, Lastparam, Pair } from '../../native/native_tool';
import MathTool from '../../number/math/math_tool';
import NumberTool from '../../number/number_tool';
import ReactTool, { SetStateActionAsync } from '../react_tool';
import SpanTool from '../../span/span_tool';


// const assert = require('assert');
export type Reacthooksetter<T> = React.Dispatch<React.SetStateAction<T>>;
export type Reacthook<T> = [T,Reacthooksetter<T>];
export type Reactref<T> = React.MutableRefObject<T>;
export type Hookdecoder<P,C> = (p: P) => C;
export type Hookencoder<P,C> = (c: C, p_prev?: P) => P;
export type Hookcodec<P, C> = {
  encode: Hookencoder<P,C>,
  decode: Hookdecoder<P,C>,
};

export class Lazyhook<X>{
  hook: Reacthook<X>; // undefined when not initialized
  initialized:boolean;

  static hookreducer2lazyhookreducer = (
    hookreducer: (v: Reacthook<string>,) => any,
  ): ((k: string, v: any) => [string, any]) => {
    return (k: string, v: any) => (k === 'hook' ? [k, hookreducer(v)] : [k, v]);
  }

  static hook2lazyhook = <X>(
    hook: Reacthook<X>,
    // init_reducer: (x_prev:X) => X,
  ): [Lazyhook<X>, (x:X) => void] => {
    // const hook = React.useState<X>();
    const [_, set_x] = hook;
    const initialized_ref = React.useRef<boolean>(false);

    // React.useEffect(() => {
    //   set_v(v => init_reducer(v));
    //   initialized_ref.current = true;
    // }, []);
    const setter:Reacthooksetter<X> = action => {
      initialized_ref.current = true;
      set_x(x_prev => {
        const x_post = ReactTool.prev2actioned(action, x_prev);
        return x_prev === x_post ? x_prev : x_post;
      });
    };

    const lazyhook = {
      hook,
      initialized: initialized_ref.current,
    };
    return [lazyhook, setter];
  }

  static init2lazyhook = <V>(
    hook: Reacthook<V>,
    init_action: () => Promise<V>,
  ): Lazyhook<V> => {
    const cls = Lazyhook;
    const [lazyhook,reducer] = cls.hook2lazyhook(hook);

    const [v, set_v] = hook;

    React.useEffect(() => {
      init_action().then(action => reducer(action))
    }, []);

    return lazyhook;
  }

}
export class Fetcheddata<X>{
  data:X;
  status: string;
  error_message?: string;

  static Status = class {
    static STABLE = 'STABLE';
  }

  static data2fetcheddata = <X>(data:X):Fetcheddata<X> => {
    const cls = Fetcheddata;
    return {data, status:cls.Status.STABLE,};
  }
}
export class Trighook<V>{
  version:number;
  value:V;
  ref:MutableRefObject<V>;
  // has_changed:(v:T) => boolean,
  // update:(v:T) => void,
  update:React.Dispatch<React.SetStateAction<V>>;
  hook:[V, React.Dispatch<React.SetStateAction<V>>];

  static useTrighook = <T>(props?: {
    // f_equal:(v1:T, v2:T) => boolean,
    initialValue?:T,
  }): Trighook<T> => {
    const self = HookTool;
    const callname = `Trighook.useTrighook @ ${DateTool.time2iso(new Date())}`;
    const {initialValue:value_in} = (props || {});

    const [version, setVersion] = React.useState<number>(1);
    const ref = React.useRef<T>(value_in);  // React.useRef<T>(value_in);
    // const has_changed = React.useCallback((v:T) => !f_equal(v, ref.current), []);
    const update = React.useCallback(
      (v_in: T | ((t: T) => T),) => {
        ref.current = self.value2updated(v_in, ref.current);
        setVersion(x => x + 1);
      },
      []);

    const value = ref.current
    return {
      version,
      value,
      ref,
      // has_changed,
      update,
      hook: [value, update],
    };
  }
}

export class Hooktrack<X>{
  hook: Reacthook<X>;
  timehook: Reacthook<Date>;

  static hook2hooktrack = <X>(
    hook_in:Reacthook<X>,
    // option?:{pair2is_timeupdate_req?:(x1:X, x2:X, d_prev?:Date) => boolean},
  ):Hooktrack<X> => {

    const timehook = React.useState<Date>();
    const hook_out = HookTool.hook2codeced(
      hook_in,
      HookTool.f_out2hookcodec(() => timehook[1](new Date()))
    );

    return {hook:hook_out, timehook};
  }

  static hooktrack2is_dataready = <X>(hooktrack: Hooktrack<X>):boolean => {
    return hooktrack?.timehook?.[0] != null;
  }

  static hooktrack2codeced = <P,C>(hooktrack:Hooktrack<P>, hookcodec:Hookcodec<P,C>):Hooktrack<C> => {
    return hooktrack == null
      ? undefined
      : {
        hook: HookTool.hook2codeced(hooktrack.hook, hookcodec),
        timehook: hooktrack.timehook,
      };
  }

  static hooktrack2down = <P,C>(h:Hooktrack<P>, jpath: Jpath,):Hooktrack<C> => {
    return Hooktrack.hooktrack2codeced(h, HookTool.jpath2codec_down<P,C>(jpath));
  }

  static f_hook2f_hooktrack = <X, O=Reacthook<X>>(
    f_hook: (h:Reacthook<X>) => O,
  ):((th:Hooktrack<X>) => {hook:O, timehook:Reacthook<Date>}) => {
    return JsonTool.reducer2reducer_ancestor<Reacthook<X>, O, Hooktrack<X>, { hook: O, timehook: Reacthook<Date> }>(
      f_hook,
      ['hook'],
      JsonTool.edge2reduced_create,
    );
  }

  static f_hook2applied = <X, O=Reacthook<X>>(
    hooktrack: Hooktrack<X>,
    f_hook: (h:Reacthook<X>) => O,
  ): { hook: O, timehook: Reacthook<Date> } => {
    return Hooktrack.f_hook2f_hooktrack(f_hook)(hooktrack);
  }

  // static hooktrack2hookwrapped = <X>(
  //   hooktrack:Hooktrack<X>,
  //   hookwrapper: (h:Reacthook<X>) => Reacthook<X>,
  // ):Hooktrack<X> => {
  //   return Hooktrack.f_hook2f_hooktrack(hookwrapper)(hooktrack);
  // }
  // static hookwrapper2hooktrackwrapper = <X,>(hookwrapper:FuncXX<Reacthook<X>>):FuncXX<Hooktrack<X>> => {
  //   return (ah:Hooktrack<X>) => Hooktrack.hooktrack2hookwrapped(ah, hookwrapper);
  // }
}

export default class HookTool{
  static hookdict2hook = <X>(hookdict:Record<string,Reacthook<any>>):Reacthook<X> => {
    const x = DictTool.merge_dicts(
      DictTool.entries(hookdict).map(([k,v]) => ({k:v?.[0]})),
      DictTool.WritePolicy.no_duplicate_key,
    );
    const set_x = (x_in:X) => {
      DictTool.entries(x_in).forEach(([k,v]) => {
        hookdict?.[k]?.[1](v);
      });
    };

    return [x, set_x];
  }

  static hookcodec_number2bool = (
    option?: {
      unitcount?: number,
    },
  ): Hookcodec<number,boolean> => {
    return {
      decode: (p:number) => !!MathTool.gt(p,0),
      encode: (c_post:boolean, p_prev:number):number => {
        const c_prev = MathTool.gt(p_prev, 0);
        if(c_prev === c_post){ return p_prev; }
        
        return c_post ? (option?.unitcount ?? 1) : undefined;
      },
    }
  }

  static hookcodec_obj2jstr = <X,>(
  ): Hookcodec<X,string> => {
    const decode = JsonTool.encode<X>;
    return {
      decode,
      encode: (c_post:string, p_prev:X):X => 
        c_post == decode(p_prev) ? p_prev : JsonTool.decode<X>(c_post),
    }
  }
  static string2useUrlSafe = (urlstring:string):URL => {
    const cls = HookTool;

    const [url_safe, set_url_safe] = React.useState<URL>();
    React.useEffect(() => {
      const url = new URL(urlstring, window.location.href);
      if(url.origin == window.location.origin){
        set_url_safe(url);
      }
    }, [urlstring]);
    return url_safe;
  }

  static hookcodec_funcslipped2encode = <X>(
    f:(c_post:X, p_prev:X) => any|Promise<any>,
  ):Hookcodec<X,X> => {
    return {
      decode:x =>x,
      encode: (c_post:X, p_prev:X) => {
        f(c_post, p_prev);
        return c_post;
      }
    }
  }

  static hook2upclockSet_deprecated = <T>(
    hook:Reacthook<T>,
    init: () => (T | Promise<T>),
    b:boolean,
  ):Reacthook<T> => {
    React.useEffect(() => {
      if(!b){ return; }

      Promise.resolve(init()).then(t => hook?.[1]?.(t));
    }, [b]);
    return hook;
  }

  // static hook2upclockSet = <V>(
  //   hook:Reacthook<V>,
  //   action: SetStateAction<V>,
  //   b:boolean,
  // ):Reacthook<V> => {
  //   React.useEffect(() => {
  //     if(!b){ return; }

  //     hook[1](action);
  //   }, [b]);
  //   return hook;
  // }

  static emitter2hookemitter = <V>(
    f_emit: (v:V) => any|Promise<any>,
    option?:{
      f_deps?: (v:V) => Parameters<typeof React.useEffect>[1],
    }
  ):((hook:Reacthook<V>) => Reacthook<V>) => {
    return (hook:Reacthook<V>) => {
      const f_deps = option?.f_deps ?? ((v:V) => [v]);
      const deps = f_deps(hook[0])
      React.useEffect(() => { f_emit(hook[0]); }, deps);
      return hook; 
    }
  }
  // static hook2emitter_attached = <V, A extends any[]>(
  //   hook:Reacthook<V>,
  //   f_emit: (v:V) => any|Promise<any>,
  //   option?:{
  //     f_keys?: (v:V) => A,
  //   }
  // ):Reacthook<V> => {
  //   const f_keys = option?.f_keys ?? ((v:V) => [v] as A);
  //   const keys = f_keys(hook[0])
  //   React.useEffect(() => { f_emit(hook[0]); }, keys);
  //   return hook;  
  // }

  static action_async2hookupdater = <V>(
    action_async: SetStateActionAsync<V>,
    deps:Parameters<typeof React.useEffect>[1],
  ):((hook:Reacthook<V>) => Reacthook<V>) => {
    return (hook:Reacthook<V>) => {
      React.useEffect(() => {
        (async () => {
            const v_out = await ReactTool.prev2reduced<V,V|Promise<V>>(action_async, hook[0]);
            hook[1](v_prev => v_prev === v_out ? v_prev : v_out); // no need to check but... for peace of mind
          })()
      }, deps);

      return hook;  
    }
  }

  // deprecating
  static hook2upclockset_async = <V>(
    hook:Reacthook<V>,
    action_async: SetStateActionAsync<V>,
    b:boolean,
  ):Reacthook<V> => {
    React.useEffect(() => {
      if(hook == null) return;
      if(action_async == null) return;
      if(!b) return;

      (async () => {
        const v_out = await ReactTool.prev2reduced<V,V|Promise<V>>(action_async, hook[0]);
        hook[1](v_out);
      })()
    }, [b]);
    return hook;
  }

  // static action2effected = <X>(x:X, action:any,) => {
  //   React.useEffect(() => action(), []);
  //   return x;
  // }

  static codec_value2bool = <V=boolean>():Hookcodec<V,boolean> => {
    return {
      decode: x => !!x,
      encode: x => x as V,
    }
  }

  static codec_int2bool = (option?:{default:number}):Hookcodec<number,boolean> => {
    const callname = `HookTool.codec_int2bool @ ${DateTool.time2iso(new Date())}`;

    return {
      decode: x => !!x,
      encode: x => {
        // console.log({callname, x})
        return x ? (option?.default ?? 1) : 0;
      }
    }
  }

  /**
   * Very dangerous. Don't use.
   */
  // static promise2hook = <T>(
  //   promise: Promise<T>,
  //   initialValue?: T,
  // ): {
  //   data: T,
  //   isValidating: boolean,
  // } => {
  //   const [x, setX] = React.useState({ isValidating: true, data: initialValue, });
  //   React.useEffect(() => {
  //     promise.then(t => setX(x => ({data:t, isValidating:false,})));
  //   }, []);
  //   return x;
  // }

  // static promise2value<T>(promise:Promise<T>, initialValue?:T): T{
  //   return HookTool.promise2hook(promise, initialValue).data;
  // }

  // static hook2lazyinit<V>(
  //   setter:Reacthooksetter<V>,
  //   reducer:(t:V) => V,
  //   v:V,
  // ){
  //   React.useEffect(() => {

  //   }, [v])
  // }

  static codec_value2index = <X>(
    values:X[],
    option?: {
      is_equal?: Bicomparator<X>,
    }
  ): Hookcodec<X, number> => {
    const cls = HookTool;
    const callname = `HookTool.codec_value2index @ ${DateTool.time2iso(new Date())}`;

    const is_equal = option?.is_equal ?? CmpTool.isBiequal;
    const decode = (x:X) => ArrayTool.findIndex(values, x1 => is_equal(x,x1));
    return {
      decode,
      encode: (i_post: number, x_prev:X) => {
        console.log({callname, i_post, x_prev, 'values[i_post]':values[i_post],});

        return i_post == decode(x_prev) ? x_prev : values[i_post];
      },
    }
  }
  static codec2up<PO,PI,C>(hookcodec:Hookcodec<PI,C>, jpath:Jpath,):Hookcodec<PO,C>{
    if(!ArrayTool.bool(jpath)){ return hookcodec as unknown as Hookcodec<PO,C>; }

    const edge2reduced = JsonTool.edge2reduced_create;
    const po2pi = (po:PO) => JsonTool.down(po, jpath) as PI;

    return {
      decode: (po: PO) => hookcodec.decode(po2pi(po)),
      encode: (c: C, po_prev?:PO):PO => {
        const pi_post = hookcodec.encode(c, po2pi(po_prev));
        const po_post = JsonTool.reduceUp(po_prev ?? {}, jpath, pi_post, edge2reduced) as PO;
        return po_post;
      },
      
    }
  }

  static codec2reversed_simple<P,C>(hookcodec:Hookcodec<P,C>):Hookcodec<C,P>{
    return {
      encode: (p => hookcodec.decode(p)),
      decode: (c => hookcodec.encode(c)),
    }
  }

  static codec_stringify = <X=any,>():Hookcodec<X,string> => {
    const decode = (x:X) => JsonTool.encode(x);
    return {
      decode,
      encode: (c, p_prev) => {
        const c_prev = decode(p_prev);
        return c == c_prev ? p_prev : JsonTool.decode<X>(c);
      }
    }
  }

  static codec_ignorenull = <X,>():Hookcodec<X,X> => {
    return {
      decode: x => x,
      encode: (c, p_prev) => c == null ? p_prev : c,
    }
  }

  static setter2nullignoring = <X,>(setter:Reacthooksetter<X>):Reacthooksetter<X> => {
    return HookTool.setter2codeced(setter, HookTool.codec_ignorenull());
  }

  static setstate_delayed = <T,>(
    setter: Reacthooksetter<T>,
    timers: { delay: number, value:T}[],
  ) => {
    React.useEffect(() => {
      timers.map(timer => {
        setTimeout(() => setter(timer.value), timer.delay);
      });
    }, [])
  }
  static hook2valueonlyhook = <T,>(hook:Reacthook<T>):Reacthook<T> => {
    return hook?.slice(0,1) as Reacthook<T>;
  }
  static timeout_ref2gc = (
    timeout_ref: MutableRefObject<NodeJS.Timeout>
  ): MutableRefObject<NodeJS.Timeout> => {
    React.useEffect(() => {
      return () => { clearTimeout(timeout_ref.current) }
    }, []);
    return timeout_ref;
  }

  // static hook2wrapped<I, O>(
  //   hook: Reacthook<I>,
  //   wrapper: {
  //     value2wrapped: ((i: I) => O),
  //     setter2wrapped: ((i_setter: React.Dispatch<React.SetStateAction<I>>) => React.Dispatch<React.SetStateAction<O>>),
  //   },
  // ):Reacthook<O> {
  //   const [i, setI] = hook;
  //   const {value2wrapped, setter2wrapped} = wrapper;

  //   const o:O = value2wrapped(i);
  //   const setO:React.Dispatch<React.SetStateAction<O>> = setter2wrapped(setI);
  //   return [o, setO];
  // }

  static hook2setter_wrapped<T,>(
    hook: Reacthook<T>,
    setter_wrapper: (f: React.Dispatch<React.SetStateAction<T>>) => React.Dispatch<React.SetStateAction<T>>
  ):Reacthook<T> {
    const [x, set_x] = hook;
    return [x, setter_wrapper(set_x)];
  }

  // static hook2setter_conditioned<T>(
  //   hook:Reacthook<T>,
  //   should_update: (t_prev:T, t:T) => boolean,
  // ):Reacthook<T>{
  //   const cls = HookTool;

  //   const [x, set_x] = hook;

  //   return [x, cls.setter2setter_conditioned(set_x, should_update)];
  // }

  static setter2codeced<I,O>(
    setI:Reacthooksetter<I>, // (i_action: React.SetStateAction<I>) => void,
    codec: Hookcodec<I,O>,
  ):Reacthooksetter<O>{
    const callname = `HookTool.setter2codeced @ ${DateTool.time2iso(new Date())}`;

    const {encode, decode} = codec;
    const setO = (o_action:React.SetStateAction<O>):void => {
      setI((i_prev:I) => {
        const o_prev:O = decode(i_prev);
        const o_post:O = ReactTool.prev2actioned(o_action, o_prev);
        // console.log({callname, 'o_prev === o_post':o_prev === o_post, o_prev, o_post, i_prev,});
        if(o_prev === o_post){ return i_prev; }

        const i_post:I = encode(o_post, i_prev);
        return i_post;
      });
    }
    return setO;
  }


  static codec_numericstep(step:number):Hookcodec<number,number>{
    const callname = `HookTool.codec_numericstep @ ${DateTool.time2iso(new Date())}`;

    return {
      decode:x => x,
      encode: c_post => {
        if(!NumberTool.x2is_number(c_post)){ return c_post; }
        return c_post ? Math.ceil(c_post / step) : c_post;
      }
    }
  }

  static codec_forcenumeric<T=number>(
    option?:{default?:number}
  ):Hookcodec<number, T>{
    const callname = `HookTool.codec_forcenumeric @ ${DateTool.time2iso(new Date())}`;

    const default_ = (option?.default ?? 0);

    return {
      decode:x => (NumberTool.x2is_number(x) ? x : default_) as T,
      encode: c_post => NumberTool.nan2undef(NumberTool.x2number(c_post)) ?? (default_ as number),
    }
  }

  static minmax2hookcodec_numeric = (minmax: Pair<number>): Hookcodec<number, number> =>
    HookTool.codecs2piped<number, number>([
      HookTool.codec_clamp(minmax),
      // HookTool.codec_numericstep(HermesCart.candlecount_step()),
      HookTool.codec_forcenumeric(),
    ])
  

  static hook2codeced<I,O>(
    hook: Reacthook<I>,
    codec: Hookcodec<I,O>,
  ):Reacthook<O> {
    const cls = HookTool;

    if(hook == null){ return undefined; }
    if(codec == null){ return hook as unknown as Reacthook<O>; }

    const [i, setI] = hook;
    const {decode} = codec;

    const o:O = decode(i);
    const setO = cls.setter2codeced(setI, codec);

    return [o, setO];
  }

  static hook2codecspiped = <I,O>(hook:Reacthook<I>, codecs:Hookcodec<any,any>[]):Reacthook<O> => {
    const cls = HookTool;
    const codec:Hookcodec<I,O> = cls.codecs2piped(codecs);
    return cls.hook2codeced(hook, codec);
  }

  static hook2teed_DEPRECATED = <X, O>(
    hook_in: Reacthook<X>,
    tee: (x?: X) => O,
    option?:{
      pair2is_teeupdate_req?:(x1:X, x2:X, o_prev?:O) => boolean,
    }
  ): [Reacthook<X>, O] => {
    const cls = HookTool;
    const callname = `HookTool.hook2teed @ ${DateTool.time2iso(new Date())}`;

    const ref = React.useRef<O>();
    const pair2is_teeupdate_req_default = (x1:X, x2:X, o_prev?:O) => x1 !== x2;

    const hook_out = HookTool.hook2codeced<X,X>(hook_in,
      {
        decode: x => x,
        encode: (c_post, p_prev) => {
          const pair2is_teeupdate_req = option?.pair2is_teeupdate_req ?? pair2is_teeupdate_req_default;
          const is_teeupdate_req = pair2is_teeupdate_req(c_post, p_prev, ref.current);
          // console.log({callname, is_teeupdate_req, c_post, p_prev, 'ref.current':ref.current,});

          if(is_teeupdate_req){
            ref.current = tee(c_post);
          }
          return c_post;
        },
      }
    );
    return [hook_out, ref.current,];
  }

  // static hook2teed = <X, O>(
  //   hook_in: Reacthook<X>,
  //   tee: (x?: X) => O,
  //   option?: {
  //     pair2is_teeupdate_req?: (x1: X, x2: X, o_prev?: O) => boolean,
  //   }
  // ): {
  //   hook: Reacthook<X>,
  //   // teed_hook: Reacthook<O>,
  //   teed:O,
  //   force_tee:() => O,
  // } => {
  //   const cls = HookTool;
  //   const callname = `HookTool.hook2teed @ ${DateTool.time2iso(new Date())}`;

  //   const [teed, set_teed] = React.useState<O>();
  //   const pair2is_teeupdate_req_default = FunctionTool.func2negated3(EqualTool.isStrictlyEqual); // (x1: X, x2: X,) => x1 !== x2;

  //   const hook_out = HookTool.hook2codeced<X, X>(hook_in,
  //     {
  //       decode: x => x,
  //       encode: (c_post, p_prev) => {
  //         const pair2is_teeupdate_req = option?.pair2is_teeupdate_req ?? pair2is_teeupdate_req_default;
  //         const is_teeupdate_req = pair2is_teeupdate_req(c_post, p_prev, teed);
  //         // console.log({callname, is_teeupdate_req, c_post, p_prev, 'ref.current':ref.current,});

  //         if (is_teeupdate_req) {
  //           set_teed(tee(c_post));
  //         }
  //         return c_post;
  //       },
  //     }
  //   );

  //   return {
  //     hook: hook_out,
  //     teed,
  //     force_tee:() => {
  //       const o = tee(hook_out[0]);
  //       set_teed(o);
  //       return o
  //     },
  //   };
  // }

  // static hookencoder_tee = <X>(
  //   tee: (x?: X) => any,
  // ): Hookencoder<X,X> => {
  //   return (c) => {
  //     tee(c)
  //     return c;
  //   }
  // }

  static f_out2hookcodec = <X>(
    f_out: (x?:X) => any,
  ):Hookcodec<X,X> => {
    const callname = `HookTool.f_out2hookcodec @ ${DateTool.time2iso(new Date())}`;

    return {
      decode: (x:X) => x,
      encode: (c_post:X, p_prev:X) => {
        // console.log({
        //   callname,
        //   c_post,
        //   p_prev,
        //   'c_post !== p_prev':c_post !== p_prev,
        // })
        // throw new Error("here!!")

        if (c_post !== p_prev) {
          // throw new Error("HookTool.f_out2hookcodec")
          f_out(c_post);
        }
        return c_post;
      },
    }
  }

  static hook2f_out_added = <X, O=X>(
    hook:Reacthook<X>,
    f_out:(x?:X) => O,
  ):Reacthook<X> => {
    const callname = `HookTool.hook2f_out_added @ ${DateTool.time2iso(new Date())}`;

    const codec = HookTool.f_out2hookcodec(f_out);
    // console.log({callname, hook, codec});
    return HookTool.hook2codeced(hook, codec);
  }

  static setter2postprocess_added<T>(
    setter_in:React.Dispatch<React.SetStateAction<T>>,
    postproc:(t:T) => T,
  ):React.Dispatch<React.SetStateAction<T>>{
    const cls = HookTool;

    if(setter_in == null){ return undefined; }
    return (action:React.SetStateAction<T>) => {
      setter_in((t_prev:T) => {
        const t1 = ReactTool.prev2actioned(action, t_prev);
        const t2 = postproc(t1);
        return t2;
      });
    }
  }

  static setter2clamped(
    setter_in:React.Dispatch<React.SetStateAction<number>>,
    minmax:Pair<number>,
    // options:{min?:number, max?:number},
  ):React.Dispatch<React.SetStateAction<number>>{
    const cls = HookTool;

    const postproc = (v:number) => MathTool.clamp(v, minmax);
    const setter_out = cls.setter2postprocess_added(setter_in, postproc);
    return setter_out;
  }

  static hook2clamped(
    hook:Reacthook<number>,
    minmax:Pair<number>,
    // options:{min?:number, max?:number},
  ): Reacthook<number>{
    const cls = HookTool;

    const [v,setV] = hook;
    return [v, cls.setter2clamped(setV, minmax)];
  }

  static codec_clamp(minmax:Pair<number>):Hookcodec<number,number>{
    const callname = `HookTool.codec_clamp @ ${DateTool.time2iso(new Date())}`;

    return {
      decode:p => p,
      encode:(c_out) => {
        const p_out = MathTool.clamp(c_out, minmax);
        // console.log({callname, p_out, c_out, minmax});
        return p_out;
      },
    }
  }

  static codec_length2limited(n:number):Hookcodec<string,string>{
    const callname = `HookTool.codec_length2limited @ ${DateTool.time2iso(new Date())}`;

    return {
      decode:p => p,
      encode:(c_out) => c_out?.slice(0,n),
    }
  }

  // static setter2setter_conditioned<X>(
  //   setter_in: React.Dispatch<React.SetStateAction<X>>,
  //   should_update: (x_post: X, x_prev: X) => boolean,
  // ): React.Dispatch<React.SetStateAction<X>> {
  //   const cls = HookTool;
  //   return cls.setter2postprocessor_attached(setter_in,
  //     (x_post: X, x_prev: X) => should_update(x_post, x_prev,) ? x_post : x_prev,
  //   );
  // }

  static setter2postprocessor_attached<X>(
    setter_in: React.Dispatch<React.SetStateAction<X>>,
    value2postprocessed: (x_post:X, x_prev?:X) => X
  ): React.Dispatch<React.SetStateAction<X>> {
    // const isEqual = (x1:T, x2:T) => x1 === x2;
    return (action: React.SetStateAction<X>): void => {
      setter_in(x_prev => {
        const x_post = ReactTool.prev2actioned(action, x_prev);
        return value2postprocessed(x_post, x_prev);
      });
    }
  }



  // static codec_singled = HookTool.codec_indexed;
  static codec_indexed = <V>(
    index:number,
    option?:{
      default?:V[],
      l2is_nullequiv?:(l:V[]) => boolean,
    }): Hookcodec<V[],V> => {
      const callname = `HookTool.codec_indexed @ ${DateTool.time2iso(new Date())}`;

    const decode = (p_prev: V[]):V => p_prev?.[index];
    return {
      decode,
      encode: (c_post: V, p_prev: V[]):V[] => {
        const v_default = option?.default ?? [];
        const l2is_nullequiv = option?.l2is_nullequiv ?? (l => l == null);
        
        const c_prev = decode(p_prev);
        if (c_prev === c_post) { return p_prev; }

        const p_post = ArrayTool.splice(p_prev ?? v_default, index, 1, c_post);
        const is_nullequiv = l2is_nullequiv(p_post);
        // console.log({callname, is_nullequiv, p_post,})
        return is_nullequiv ? undefined : p_post;
      },
    }
  }

  static codec_span2indexed = <V>(index:number): Hookcodec<Pair<V>,V> =>
    HookTool.codec_indexed(
      index,
      {
        default:[null,null],
        l2is_nullequiv: (span:Pair<V>) => ArrayTool.areAllBiequal(SpanTool.span2norm(span), SpanTool.nullnull()),
      }
    ) as Hookcodec<Pair<V>,V>;

  static f_eq2codec<V>(f_eq:Bicomparator<V>): Hookcodec<V,V>{
    return {
      decode: (p_prev:V) => p_prev,
      encode: (c_post: V, p_prev: V):V => f_eq(c_post, p_prev) ? p_prev : c_post,
    }
  }

  static codec_seteq<V>(): Hookcodec<V[],V[]>{
    const f_eq = (l1:V[], l2:V[]) => lodash.isEqual(new Set(l1),new Set(l2));
    return HookTool.f_eq2codec(f_eq);
  }

  static jpath2codec_down = <P,C>(jpath:Jpath):Hookcodec<P,C> => {
    const callname = `HookTool.jpath2codec_down @ ${DateTool.time2iso(new Date())}`;

    const edge2reduced = JsonTool.edge2reduced_create;
    const decode = (p_prev:P):C => JsonTool.down(p_prev, jpath);

    return {
      decode,
      encode: (c_post:C, p_prev:P):P => {
        const c_prev = decode(p_prev);
        // console.log({callname, c_prev, c_post, p_prev,})
        if(c_prev === c_post){ return p_prev; }
        
        const p_post = JsonTool.reduceUp((p_prev ?? {}) as P, jpath, c_post, edge2reduced);
        return p_post;
      },
    }
  }

  static jpaths_merger2codec = <P, C>(jpaths:Jpath[], merger:(cs:C[]) => C):Hookcodec<P, C> => {

    const edge2reduced = JsonTool.edge2reduced_create;
    const decode = (p_prev:P):C => merger(jpaths?.map(jpath => JsonTool.down(p_prev, jpath)));

    return {
      decode,
      encode: (c_post:C, p_prev:P):P => {
        const c_prev = decode(p_prev);
        if(c_prev === c_post){ return p_prev; }

        const p_post:P = jpaths.reduce((p_post, jpath) => JsonTool.reduceUp(p_post, jpath, c_post, edge2reduced), (p_prev ?? {}) as P);
        return p_post;
      },
    }
  }
  static jpaths2codec_or = <P>(jpaths:Jpath[]):Hookcodec<P,boolean> => HookTool.jpaths_merger2codec(jpaths, cs => cs?.some(Boolean));
  static jpaths2codec_and = <P>(jpaths:Jpath[]):Hookcodec<P,boolean> => HookTool.jpaths_merger2codec(jpaths, cs => cs?.every(Boolean));

  static jpaths2codec_max = <P>(jpaths:Jpath[]):Hookcodec<P,number> => HookTool.jpaths_merger2codec(jpaths, cs => cs == null ? undefined : ArrayTool.max(cs));
  static jpaths2codec_min = <P>(jpaths:Jpath[]):Hookcodec<P,number> => HookTool.jpaths_merger2codec(jpaths, cs => cs == null ? undefined : ArrayTool.min(cs));

  static codec_bool2option = <C>(options:Pair<C>) => {
    const callname = `HookTool.codec_book2option @ ${DateTool.time2iso(new Date())}`;

    const decode = (p_prev:boolean):C => p_prev ? options[0] : options[1];

    return {
      decode,
      encode: (c_post:C, p_prev:boolean):boolean => {

        const c_prev = decode(p_prev);
        if(c_prev === c_post){ return p_prev; }

        const index = options.indexOf(c_post);
        // console.log({callname, c_post, p_prev, c_prev, index,});
        if(index<0){ return undefined; }
        if(index===0){ return true; }
        if(index===1){ return false; }
        throw new Error(`Invalid index: ${index}`);
      },
    }
  };

  static setter2down<P,C>(
    p_setter:React.Dispatch<React.SetStateAction<P>>,
    jpath: (string|number)[],
  ):React.Dispatch<React.SetStateAction<C>> {
    const cls = HookTool;
    return cls.setter2codeced(p_setter, cls.jpath2codec_down(jpath),)
  }

  static hook2down<P,C>(
    p_hook:Reacthook<P>,
    jpath: Jpath,
  ):Reacthook<C>{
    const cls = HookTool;

    return cls.hook2codeced(p_hook, cls.jpath2codec_down(jpath),)
  }

  static codec_downeach<P,C>(jpath:(string|number)[]): Hookcodec<P[],C[]>{
    throw new Error("This doesn't work because whole children can be replaced!");

    const edge2reduced = JsonTool.edge2reduced_create;
    const decode = (ps_prev: P[]):C[] => ps_prev.map(p_prev => JsonTool.down(p_prev, jpath));
    return {
      decode,
      encode: (cs_post: C[], ps_prev: P[]):P[] => {
        const cs_prev = decode(ps_prev);
        if (ArrayTool.areAllTriequal(cs_prev, cs_post)) { return ps_prev; }

        const ps_post = cs_post?.map((c_post, i) => JsonTool.reduceUp(ps_prev[i] ?? {}, jpath, c_post, edge2reduced) as P);
        return ps_post;
      },
    }
  }

  static hook2downeach<P,C>(
    ps_hook:Reacthook<P[]>,
    jpath: (string|number)[],
  ):Reacthook<C[]>{
    throw new Error("This doesn't work because whole children can be replaced!")
    const cls = HookTool;
    return cls.hook2codeced(ps_hook, cls.codec_downeach(jpath))
  }

  static codecs2piped<P, C>(
    codecs: {
      encode: (c: any, p0?: any) => any,
      decode: (p: any) => any,
    }[],
  ): Hookcodec<P,C> {
    /**
     *             -- decode -->
     *     codec 0      ...        codec n-1
     *  p0          c0       cn-2             cn-1
     *              p1       pn-1
     *            <-- encode --
     */
    const cls = HookTool;

    const n = codecs.length;

    // const decode = (p: P): C => ArrayTool.range(n).reduce((p_, i) => codecs[i].decode(p_), p) as unknown as C;
    return {
      decode: (p0: P): C => codecs.reduce((p_, codec) => codec.decode(p_), p0) as unknown as C,
      encode: (c_last: C, p0_prev: P): P => {
        const ps_prev = codecs.reduce((ps_, codec) => [...ps_, codec.decode(ArrayTool.last(ps_))], [p0_prev]);
        const p_last = ArrayTool.range(n).reduce((c_, i) => codecs[n-1-i].encode(c_, ps_prev[n-i-1]), c_last) as unknown as P;
        return p_last;
      }
    }
  }

  static codecpair2piped<P, M, C>( // for typing
    codecs: [
      {
        encode: (m: M, p0?: P) => P,
        decode: (p: P) => M,
      },
      {
        encode: (c: C, m0?: M) => M,
        decode: (m: M) => C,
      },
    ],
  ): Hookcodec<P,C> {
    return HookTool.codecs2piped<P,C>(codecs)
  }

  static decoder2codec<X>(
    decoder:Hookdecoder<X,X>,
  ): Hookcodec<X,X>{
    return {
      decode: decoder,
      encode: (c:X) => c,
    }
  }

  static encoder2codec<X>(
    // encode:(x:X, p_prev?:X) => X,
    encoder:Hookencoder<X,X>,
    // comparator:Comparator<X>,
  ): Hookcodec<X,X>{
    return {
      decode: (p: X) => p,
      encode:encoder,
    }
  }

  static jstep_validator2encoder_removechildifinvalid = <P,C>(jstep:Jstep, c2is_valid:(c:C) => boolean):Hookencoder<P,P> => {
    return (p:P):P => {
      const c = JsonTool.down_one<P,C>(p, jstep);

      if(c2is_valid(c)) return p;

      return NumberTool.is_number(jstep)
        ? ArrayTool.splice<C>(p as unknown as C[], jstep as number, 1) as P
        : DictTool.keys2excluded<P>(p, ArrayTool.one2l(jstep as string));
    }
  }
  static jstep_validator2codec_removechildifinvalid = lodash.flow(
    HookTool.jstep_validator2encoder_removechildifinvalid,
    HookTool.encoder2codec,
  )

  static keycodec2codec_dicthook<V>(
    keycodec: { encode: (k: string) => string, decode: (k: string) => string }
  ):Hookcodec<Record<string,V>,Record<string,V>> {
    const callname = `HookTool.keycodec2codec_dicthook @ ${DateTool.time2iso(new Date())}`;

    const {encode:enc_key, decode:dec_key} = keycodec;

    const decode = (p: Record<string,V>): Record<string,V> => DictTool.dict2key_mutated(p, dec_key);
    return {
      decode,
      encode: (c_post: Record<string,V>, p_prev: Record<string,V>): Record<string,V> => {
        const c_prev = decode(p_prev);
        if(c_prev === c_post){ return p_prev; }

        return DictTool.dict2key_mutated(c_post, enc_key);
      },
    }
  }

  static dictcodec_filter_n_merge<V, K extends Dictkey = Dictkey>(
    predicate: (k:K, v?: V,) => boolean,
  ):Hookcodec<Record<K,V>,Record<K,V>> {
    const callname = `HookTool.codec_filter_n_merge @ ${DateTool.time2iso(new Date())}`;
    
    const decode = (p: Record<K,V>): Record<K,V> => DictTool.dict2filtered(p, predicate);
    return {
      decode,
      encode: (c_post: Record<K,V>, p_prev: Record<K,V>): Record<K,V> => {
        const c_prev = decode(p_prev);
        if(c_prev === c_post){ return p_prev; }

        return DictTool.merge_dicts<Record<K,V>>([
          DictTool.dict2filtered(p_prev, lodash.negate(predicate)), // things not filtered
          (c_post ?? {}) as Record<K,V>,
        ], DictTool.WritePolicy.no_duplicate_key);
      },
    }
  }

  // static listcodec_upsert<V>(
  //   predicate: (v: V, i?:number, l?:V[]) => boolean,
  //   option?:{
  //     f_key?: (v:V) => Dictkey,
  //   },
  // ):Hookcodec<V[],V[]> {
  //   const callname = `HookTool.listcodec_upsert @ ${DateTool.time2iso(new Date())}`;

  //   return {
  //     decode: (ps: V[]): V[] => ps?.filter(predicate),
  //     encode: (cs_post: V[], ps_prev: V[]): V[] => {
  //       if(!ArrayTool.bool(ps_prev)){ return cs_post; }
        
  //       const bools = ps_prev?.map(predicate);
  //       // const cs_prev = ps_prev?.filter((_, i) => bools[i]);
  //       const [cs_prev, cs_prev_excluded] = ArrayTool.bisect_by(ps_prev, (_, i) => bools[i]);
  //       if (ArrayTool.areAllTriequal(cs_prev, cs_post)) { return ps_prev; }

  //       const f_key = option?.f_key;
  //       if(!f_key){
  //         return [
  //           ...(cs_prev_excluded ?? []), // things not filtered
  //           ...(cs_post ?? []),
  //         ];
  //       }

  //       const n = ps_prev.length;
  //       const dict_key2index = ArrayTool.array2dict(ArrayTool.range(n), i => f_key(ps_prev[i]));
        
  //       type H = {v:V, i:number};
  //       const vi2h = (v:V, i:number):H => ({v,i});
  //       const hs:H[] = ArrayTool.sorted(
  //         [
  //           ...(ps_prev?.map(vi2h)?.filter((h:H) => !bools[h.i]) ?? []),
  //           ...(cs_post?.map(c => vi2h(c, dict_key2index[f_key(c)])) ?? []),
  //         ],
  //         CmpTool.f_key2f_cmp(h => h.i, AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default)),
  //       )

  //       const indexes_covered = hs.map(h => h.i)?.filter(i => i !=null);

  //       // console.log({
  //       //   callname,
  //       //   hs,
  //       //   f_key,
  //       //   cs_post,
  //       //   ps_prev,
  //       // });
  //       if(ArrayTool.has_duplicate(indexes_covered)){ throw new Error(`indexes_covered: ${indexes_covered}`)}

  //       return hs.map(h => h.v);
  //     },
  //   }
  // }
  static listcodec_filter_n_extend<V>(
    predicate: (v: V, i?:number, l?:V[]) => boolean,
  ):Hookcodec<V[],V[]> {
    const callname = `HookTool.listcodec_filter_n_extend @ ${DateTool.time2iso(new Date())}`;

    return {
      decode: (ps: V[]): V[] => ps?.filter(predicate),
      encode: (cs_post: V[], ps_prev: V[]): V[] => {
        if(!ArrayTool.bool(ps_prev)){ return cs_post ?? []; }
        
        const bools = ps_prev?.map(predicate);
        const [cs_prev, cs_prev_excluded] = ArrayTool.bisect_by(ps_prev, (p_prev, i) => bools[i]);
        // console.log({
        //   callname, cs_post, ps_prev, bools, cs_prev,
        //   'ArrayTool.areAllTriequal(cs_prev, cs_post)': ArrayTool.areAllTriequal(cs_prev, cs_post),
        // });

        if (ArrayTool.areAllTriequal(cs_prev, cs_post)) { return ps_prev; }

        const ps_post = [
          ...(cs_prev_excluded ?? []), // things not filtered
          ...(cs_post ?? []),
        ];

        // console.log({callname, cs_post, ps_prev, cs_prev, ps_post});
        // if(ArrayTool.areAllTriequal(ps_prev, ps_post)){ return ps_prev; }

        return ps_post;
      },
    }
  }

  static filter2codec_vs2v = <V>(predicate:(v:V) => boolean):Hookcodec<V[],V> => {
    const cls = HookTool;
    return cls.codecs2piped([
      HookTool.listcodec_filter_n_extend<V>(predicate),
      HookTool.codec_singleton<V>(),
    ]);
  }


  static kv2codec_vs2v = <X,V=any>(k:string, v:V):Hookcodec<X[],X> => {
    const cls = HookTool;
    return cls.codecs2piped([
      cls.filter2codec_vs2v<X>(x => x?.[k] === v),
      cls.encoder2codec<X>(c => c == null ? undefined : c?.[k] === v ? c : {...c, [k]:v}),
    ]);
  }

  static codec2codec_each<P,C>(codec:Hookcodec<P,C>):Hookcodec<P[],C[]> {
    const callname = `HookTool.codec2codec_each @ ${DateTool.time2iso(new Date())}`;

    const decode = (ps:P[]) => ps?.map(p => codec.decode(p));
    return {
      decode,
      encode: (cs: C[], ps_prev: P[]): P[] => {
        const cs_prev = decode(ps_prev);
        return ArrayTool.f_bicmp2f_every(CmpTool.isTriequal)(cs_prev, cs)
          ? ps_prev
          : cs?.map((c,i) => codec.encode(c, ps_prev?.[i]))
          ;
      },
    }
  }

  static f_one2l2encoder = <V>(f_one2l:(v:V) => V[]) => {
    return (c_post: V, p_prev: V[]): V[] => {
      return ArrayTool.l2one(p_prev) === c_post
        ? p_prev
        : f_one2l(c_post);
    }
  }

  static f_one2l2codec = <V>(f_one2l:(v:V) => V[]) => {
    const cls = HookTool;
    const callname = `HookTool.f_one2l2codec @ ${DateTool.time2iso(new Date())}`;

    const decode = ArrayTool.l2one;
    return {
      decode,
      encode: cls.f_one2l2encoder(f_one2l),
    }
  }

  static codec_vs2vs_nonullish = <X>():Hookcodec<X[],X[]> => HookTool.encoder2codec<X[]>(l => l?.filter(x => x !=null));
  static codec_l2one_nonullish = <X>():Hookcodec<X[],X> => HookTool.codecs2piped([
    HookTool.codec_vs2vs_nonullish<X[]>(),
    HookTool.f_one2l2codec<X>(ArrayTool.one2l),
  ]);

  // static codec_singleton = <V>():Hookcodec<V[],V> => HookTool.f_one2l2codec(x => [x])
  static codec_singleton = <V>():Hookcodec<V[],V> => HookTool.f_one2l2codec(ArrayTool.one2l)

  static codec_filtered<V>(predicate: (v: V) => boolean,) {
    throw new Error("Not implemented error!!");
    /**
     * Filter by chunk or filter by individual?
     * Check listcodec_filter_n_extend()
     */
  }

  // static hook2filtered<V>(
  //   ps_hook:Reacthook<V[]>,
  //   predicate:(v:V) => boolean,
  // ):Reacthook<V[]>{
  //   const cls = HookTool;
  //   return cls.hook2codeced(ps_hook, cls.codec_filtered(predicate));
  // }


  static async2hook = <T>(
    async: () => Promise<T>,
    options?:{
      initialData?: T,
    },
  ):[T,Dispatch<SetStateAction<T>>] => {
    const callname = `HookTool.async2hook @ ${DateTool.time2iso(new Date())}`;

    const [data, setData] = React.useState<T>(options?.initialData);
    React.useEffect(() => {
      // console.log({callname})
      async().then((t:T) => setData(t));
    }, []);
    return [data,setData];
  }

  // static promise2hook = <T>(
  //   promise: Promise<T>,
  //   options?:{
  //     initialData?: T,
  //   },
  // ):[T,Dispatch<SetStateAction<T>>] => {
  //   const [data, setData] = React.useState<T>(options?.initialData);
  //   React.useEffect(() => { promise.then((t:T) => setData(t)); }, []);
  //   return [data,setData];
  // }

  static useRefreshedat = () : [number, () => void] => {
      const timestamp_hook = React.useState<number>((new Date())?.getTime());

      return [
        timestamp_hook[0],
        () => { 
          const timestamp = (new Date())?.getTime();
          timestamp_hook[1](timestamp);
        },
      ];
  }

  static useRefstate = <T>(props?:{
    initialValue?:T,
    isEqual?:(t1:T, t2:T) => boolean,
  }) : [T, (x:T|((t:T) => T)) => void, number] => {
    const self = HookTool;

    const {initialValue, isEqual:isEqual_in} = (props || {});
    const isEqual = isEqual_in ? isEqual_in : (t1:T,t2:T) => t1===t2;

    const ref = React.useRef<T>(initialValue);
    const [version, setVersion] = React.useState<number>(1);
    // const refresh = HookTool.useRefresh();
    // const version = Trighook.useTrighook();
    const setValue = (x_in:T|((t:T) => T)) => {
      // const x_out = FunctionTool.is_function(x_in) ? (x_in as ((t:T) => T))(ref.current) : (x_in as T);
      const x_out = self.value2updated(x_in, ref.current);
      if(isEqual(x_out, ref.current)){ return; }

      ref.current = x_out;
      setVersion(x => x+1);
    }

    return [ref.current, setValue, version,];
  }

  static neq_flipflop = <X>(
    x:X,
    config?: {
      f_eq?:(x1:X, x2:X) => boolean,
    },
  ) => {
    const callname = `HookTool.neq_flipflop @ ${DateTool.time2iso(new Date())}`;

    const {f_eq:f_eq_in} = (config || {});
    
    const f_eq : (x1:X, x2:X) => boolean = (() => {
      if(f_eq_in){ return f_eq_in; }
      return (x1:X, x2:X) => x1===x2;
    })();

    const prev_ref = React.useRef<X>();
    if(!f_eq(prev_ref.current!, x)){
      prev_ref.current = x;
    }
    return prev_ref.current;
  }

  static audio2playOnLoad = (f_audio:() => HTMLAudioElement) => {
    React.useEffect(() => {
      const audio = f_audio();
      audio.play();
      return () => audio.pause();
    }, []);
  }

  static hook2tuple = <S>(
    hook: [S, Dispatch<SetStateAction<S>>]
  ): [
      [S, Dispatch<SetStateAction<S>>],
      S,
      Dispatch<SetStateAction<S>>,
    ] => {
    return [hook, hook[0], hook[1],];
  }

  static hook2ref = <S>(
    hook: [S, Dispatch<SetStateAction<S>>]
  ): [
      MutableRefObject<S>,
      S,
      Dispatch<SetStateAction<S>>,
    ] => {
    const ref = HookTool.value2ref(hook[0]);
    return [ref, hook[0], hook[1],];
  }

  static useLoading = () => {
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => { setLoading(false); }, [])
    return loading;
  }

  static useLoaded = () => {
    return !HookTool.useLoading();
  }
  static updateState(setState, state_prev, state_next_partial){
    setState(Object.assign({}, state_prev, state_next_partial));
  }
  
  // static useTrigger() : () => void {
  //   const [v, setV] = React.useState(null);
  //   const trigger = () => setV(nanoid());
  //   return trigger;
  // }

  // static scrollIntoHash = (...args) => {
  //   React.useEffect(() => {
  //     const anchor = window.location.hash.slice(1);
  //     if (!anchor) { return; }

  //     const anchorEl = document.getElementById(anchor);
  //     if (!anchorEl) { return ;}

  //     anchorEl.scrollIntoView(...args);
  //   }, []);
  // }

  static ref2pair = <T>(ref: MutableRefObject<T>): [T, MutableRefObject<T>] => {
    // const ref = React.useRef(initialValue);
    return [ref.current, ref];
  }
  
  static set_if_diff = (hook, data, isEqual) => {
    const [state, setState] = hook;
    if(isEqual(state, data)){ return; }
    setState(data);
  }

  static ref2updated_if_true = (ref, data, is_valid) => {
    if(is_valid){ ref.current = data; }
    return ref;
  }

  static updateIfChanged = <X>(x: X, isEqual?: (x1: X, x2: X) => boolean) => {
    if (isEqual === undefined) { isEqual = lodash.isEqual; }

    const ref = React.useRef(x);
    if(!isEqual(ref.current, x)){ ref.current = x; }
    return ref.current;
  }

  static incSequenceCounter = (countRef, b) => {
    countRef.current = b ? countRef.current+1 : 0;
    // console.log({'countRef.current':countRef.current});
  }

  static useCounter = () => {
    const ref = React.useRef(0);
    ref.current = ref.current + 1;
    return ref.current;
  }
  
  static usePrevious = <X>(value:X, initialValue:X):X => {
    const ref = React.useRef(initialValue);
    const value_prev:X = ref.current;
    ref.current = value;
    return value_prev;
  }

  static useFirst = (): boolean => {
    return HookTool.usePrevious(false, true);
  }

  static updateIfTrue = <X>(
    value:X,
    ref2should_update:(ref:MutableRefObject<X>) => boolean,
    initialValue:X,
  ):X => {
    const ref = React.useRef(initialValue);
    if(ref2should_update(ref)){
      ref.current = value;
    }
    return ref.current;
  }

  static updateIfRefIsUndefined = <X>(value:X,):X => {
    return HookTool.updateIfTrue(value, ref => (value!==undefined && ref.current===undefined), undefined)!;
  }

  static setOnce = <X>(value:X,):X => {
    return HookTool.updateIfRefIsUndefined(value);
  }

  static memoize = (value, f_equals, initialValue) => {
    // https://stackoverflow.com/a/54096391
    const self = HookTool;
    return self.updateIfTrue(value, ref => !f_equals(value, ref.current), initialValue);
  }

  // static jsx_dummy(){
  //   React.useRef();
  //   return (<></>);
  // }
  // static hasChanged(value_in, f_equals, initialValue) {
  //   const value_out = HookTool.memoize(value_in, f_equals, initialValue);
  //   return value_in === value_out;
  // }

  static countRef2inc = (ref) => {
    ref.current += 1;
    return ref.current;
  }

  // static useCount(){
  //   const ref = React.useRef(0);
  //   return HookTool.countRef2inc(ref);
  // }

  static value2window = <T>(value:T, size:number) : Queue<T> => {
    const queue = React.useRef<Queue<T>>(new Queue()).current;

    while (queue.length >= size) { queue.dequeue(); }
    queue.enqueue(value);

    return queue;
  }
  static ref2updated = <T>(
    ref:MutableRefObject<T | undefined>,
    value: T | undefined,
  ): MutableRefObject<T | undefined> => {
    ref.current = value;
    return ref;
  }

  static value2ref = <X>(x:X): MutableRefObject<X> => {
    const ref = React.useRef<X>();
    ref.current = x;
    return ref;
    // return {ref, value:x};
  }

  // static refs2rshift_current = (refs, value) => {
  //   const n = ArrayTool.len(refs);
  //   const value_oldest = refs[n-1].current;
  //   for (let i = n-1; i >=1; i--) {
  //     refs[i].current = refs[i-1].current;
  //   }
  //   refs[0].current = value;
  //   return value_oldest;
  // }

  static arrayref2lshift = <T>(ref:MutableRefObject<T[]>, t:T) => {
    ref.current = [...ref.current.slice(1), t];
    return ref;
  }

  // static spinlock_ref = (ref, value) => {
  //   const value_prev = ref.current; 
  //   ref.current = value;
  //   return value_prev;
  // }

  static value2changed = <T>(
    value: T,
    f_equal: (t1: T, t2: T) => boolean,
    value2frozen?: (t:T) => T,
  ): boolean => {
    const ref = React.useRef<T>(value);
    return HookTool.spinlock_ref2changed(ref, value, f_equal, value2frozen);
  }

  static value2change_versioned = <T>(
    v: T,
    isEqual?: (t1: T, t2: T) => boolean,
    value2frozen?: (t:T) => T,
  ):number => {

    const changed = HookTool.value2changed(v, isEqual, value2frozen);
    const version = HookTool.boolean2downcount(!changed);

    // const [version, setVersion] = React.useState<number>(0);
    // const ref = React.useRef<T>(v);  // React.useRef<T>(value_in);

    // if(!(isEqual ?? CmpTool.isEqual)(ref.current,v)){
    //   (store_value2ref ?? ((ref, v) => ref.current = v))(ref, v);
    //   setVersion(ver => ver + 1);
    // }
    return version;
  }

  static value2updated<X>(x_in:X|((t:X) => X), x_prev:X,) : X{
    return FunctionTool.is_function(x_in) ? (x_in as ((x:X) => X))(x_prev) : (x_in as X);
  }

  // static ref2version = <T>(
  //   ref: MutableRefObject<T>,
  //   value: T,
  //   f_equal: (t1: T, t2: T) => boolean,
  // ): {
  //   version: number,
  //   // inc: () => void,
  //   refresh: (v:T) => void,
  // } => {
  //   const [version,setVersion] = React.useState<number>(1);

  //   const refresh = (v:T) => {
  //     if(f_equal(v, ref.current)){ return; }
  //     // if(!HookTool.value2changed(v, f_equal)){ return; }
  //     setVersion(x => x+1);
  //   }
  //   refresh(value);

  //   return {
  //     version,
  //     refresh,
  //   };
  // }

  static value_cloned2ref<T>(ref:MutableRefObject<T>, v:T){
    ref.current = structuredClone(v);
    return ref.current;
  }

  static spinlock_ref2changed = <T>(
      ref:MutableRefObject<T>,
      value:T,
      f_equal:(t1:T, t2:T) => boolean,
      value2frozen?: (t:T) => T,
      // clone?:(t:T) => T
    ) => {
    const callname = `HookTool.spinlock_ref2changed @ ${DateTool.time2iso(new Date())}`;
    const is_first = HookTool.useFirst();
    const has_changed = !f_equal(value, ref.current);

    if(is_first || has_changed){
        // console.log({callname, value, 'ref.current':ref.current});
        ref.current = value2frozen ? value2frozen(value) : value;
        // ref.current = structuredClone(value);
    }
    return has_changed;
  }

  static spinlockPrevious = (value, initialValue) => {
    const ref = React.useRef(initialValue);
    const value_prev = ref.current; 
    ref.current = value;
    return value_prev;
  }

  // static isInitialLoad(){
  //   return HookTool.spinlockPrevious(true, false);
  // }

  // static dflipflop = <T>(
  //   value: T,
  //   clock: boolean,
  //   config?:{
  //     value_init?:T,
  //     clock_init?:boolean,
  //   }
  // ) => {
  //   const {value_init, clock_init} = config || {}; 

  //   const value_ref = React.useRef<T>(value_init);
  //   const clock_prev_ref = React.useRef<boolean>(!!clock_init);

  //   if(!clock_prev_ref.current && clock){
  //     value_ref.current = value;
  //   }

  //   clock_prev_ref.current = clock;
  //   return value_ref.current;
  // }

  static upclocklatch = <X>(
    x: X,
    clock: boolean,
  ):X => {
    const value_ref = React.useRef<X>(x);
    if(clock){ value_ref.current = x; }
    return value_ref.current;
  }
  static notundeflatch = <X>(x: X,) => HookTool.upclocklatch(x, x !== undefined);

  static boolean2downevent = (
    b: boolean,
  ): boolean => {
    const ref = React.useRef<boolean>(b);

    const prev = ref.current;
    ref.current = b;

    return prev && !b;
  }
  static boolean2upevent = (b:boolean) : boolean => {
    return HookTool.boolean2downevent(!b);
  }

  static boolean2downcount = (
    b:boolean,
  ): number => {
    const counter_ref = React.useRef<number>(0);

    if(HookTool.boolean2downevent(b)){
      counter_ref.current +=1;
    }

    return counter_ref.current;
  }
  static boolean2upcount = (b:boolean): number => {
    return HookTool.boolean2downcount(!b);
  }

  static useEffectDownclock = (f:() => any, b:boolean) =>{
    React.useEffect(() => {
      if (b) { return; }
      f()
    }, [b]);
  }

  static useEffectUpclock = (f:() => any, b:boolean) => {
    HookTool.useEffectDownclock(f, !b);
  }

  static useStateDownclock = <X>(x_in:X, b:boolean) => {
    const cls = HookTool;
    const [x, setX] = React.useState<X>(x_in);

    cls.useEffectDownclock(() => setX(x_in), b);
    return x
  }
  static useStateUpclock = <X>(x_in:X, b:boolean):X => {
    const cls = HookTool;
    const [x, setX] = React.useState<X>(x_in);

    cls.useEffectUpclock(() => setX(x_in), b);
    return x
  }

  static useStateNoundefclock = <X>(x_in:X):X => {
    const cls = HookTool;
    return cls.useStateUpclock(x_in, x_in!==undefined)
  }

  static spinlockChanged = <T>(
    value:T,
    config?: {
      isEqual?: (t1: T, t2: T) => boolean,
      initialValue?: T,
    }):boolean => {
    const {isEqual:isEqual_in, initialValue,} = (config || {});

    const isEqual:(t1:T, t2:T) => boolean = isEqual_in || ((t1:T, t2:T) => t1===t2);

    const value_prev = HookTool.spinlockPrevious(value, initialValue);
    const has_changed = !isEqual(value, value_prev);
    // console.log({function:'spinlockChanged', value_prev, value, initialValue, has_changed});
    return has_changed;
  }

  static isTriggered = <T>(config : {
    value:T,
    f_equal?:(t1:T,t2:T) => boolean,
    f_trigger?: (t:T) => boolean,
    initialValue?:T,
  }) => {
    const {value, initialValue, f_equal:f_equal_in, f_trigger:f_trigger_in} = config;

    const f_equal = f_equal_in || lodash.isEqual;
    const f_trigger = f_trigger_in || (x=>!!x);

    const is_changed = HookTool.spinlockChanged(value, {isEqual:f_equal, initialValue});
    const is_triggered = is_changed && f_trigger(value);
    // console.log({value, initialValue, is_changed, is_triggered});

    return is_triggered;
  }

  static useEffectDebugger = (effectHook, dependencies, dependencyNames = []) => {
    const cls = HookTool;
    // https://stackoverflow.com/a/59843241
    
    const previousDeps = cls.usePrevious(dependencies, []);
  
    const changedDeps = dependencies.reduce((accum, dependency, index) => {
      if (dependency !== previousDeps[index]) {
        const keyName = dependencyNames[index] || index;
        return {
          ...accum,
          [keyName]: {
            before: previousDeps[index],
            after: dependency
          }
        };
      }
  
      return accum;
    }, {});
  
    if (Object.keys(changedDeps).length) {
      // console.log('[use-effect-debugger] ', changedDeps);
    }
  
    React.useEffect(effectHook, dependencies);
  }

  static setTrigger_if_semaphore = (setTrigger, semaphoreRef,) => {
    if(semaphoreRef.current > 0){
      semaphoreRef.current -= 1;
      setTrigger();
    }
  }

  static repeat = (func, period) => {
    React.useEffect(() => {
      const interval = setInterval(func, period)
      return () => clearInterval(interval)
    }, []);
  }

  static useCrawl = <X>(props: {
    style_init: X,
    millisecs2styledict: ([ms_duration, ms_delay]: [number, number]) => X,
    ms_tuple: [number, number, number],
    secs_passed: number,
  }): X => {
    const self = HookTool;
    const callname = `HookTool.useCrawl @ ${DateTool.time2iso(new Date())}`;

    const { style_init, millisecs2styledict, ms_tuple, secs_passed } = props;

    const [ms_wait_pre, ms_scroll, ms_wait_post] = ms_tuple; // [500, choicecount_others * 500, 500];
    const ms_period = MathTool.sum([ms_wait_pre, ms_scroll, ms_wait_post]);

    const ms_remainder = secs_passed * 1000 % ms_period;

    // const style_init = {
    //   transition: 'transform 0s linear',
    //   transform: 'translate(0, 0)',
    // };

    const [style, setStyle] = React.useState(style_init);
    const repeatLimit = undefined;
    const repeatRef = React.useRef(1);

    // console.log({callname, ms_scroll});

//     // const [animation, setAnimation] = React.useState(null);
    React.useEffect(() => {
      const proportion = (() => {
        // const ms_remainder = ms % ms_period;
        if(ms_remainder<=ms_wait_pre){ return 0; }
        if(ms_remainder>=ms_wait_pre+ms_scroll){ return 1; }
        return (ms_remainder - ms_wait_pre) / ms_scroll;
      })();
      const ms_duration = (1-proportion)*ms_scroll;
      const ms_delay = Math.max(ms_wait_pre - ms_remainder,0);

      console.log({callname, ms_scroll, ms_duration, ms_delay});

      setStyle(millisecs2styledict([ms_duration, ms_delay]));
      // setStyle({
      //   transition:`transform ${ms_duration/1000}s linear ${ms_delay/1000}s`,
      //   transform :'translate(0, -100%)',
      // });

      const f_repeat = () => {
        setStyle(style_init);

        if (NativeTool.is_null_or_undefined(repeatLimit) || repeatRef.current + 1 < repeatLimit) {
          repeatRef.current += 1;
          setTimeout(f_repeat, ms_period);
        }

        setTimeout(() => {
          setStyle(millisecs2styledict([ms_duration, 0]));
          // setStyle({
          //   transition:`transform ${ms_duration/1000}s linear 0s`,
          //   transform:'translate(0, -100%)',
          // });
        }, ms_wait_pre);
      }

      
      setTimeout(f_repeat, (ms_period - ms_remainder));
    }, []);

    return style;
  }

  static usePreviousCascading = <X>(
    v: X,
    v_init: X = undefined,
    secs_offset_in: number = undefined,
  ): { prev: X, isUpdating: boolean } => {

    const [prev, setPrev] = React.useState(v_init);
    // const updating_ref = React.useRef(false);
    const secs_offset = secs_offset_in || 0;

    React.useEffect(() => {
      setTimeout(() => setPrev(v), secs_offset*1000);  // force callback
    }, [v]);

    const isUpdating = v!==prev;
    return {prev, isUpdating};
  }

  static useCountClock = (secs_period: number): number => {
    const self = HookTool;

    // const {bucketindex:pageindex_init, remainder:secs_remainder} = ArrayTool.number2bucketindex_remainder_rotational(secs, secs_page_list)
    const startedAt = React.useRef(new Date()).current;
    const secs_offset = 0;
    const date_pivot = DateTool.secs2added(startedAt, secs_offset);

    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
      const f_repeat = () => {
        setCount(x => x+1);

        const ms_remainder = DateTool.subtract2millisecs(new Date(), date_pivot) % (secs_period*1000);
        setTimeout(f_repeat, ms_remainder);
      }

      setTimeout(f_repeat, secs_offset*1000);
    }, []);

    return count;
  }

  static useSectionindexClock = (secs_list: number[]): number => {
    const self = HookTool;

    // const {bucketindex:pageindex_init, remainder:secs_remainder} = ArrayTool.number2bucketindex_remainder_rotational(secs, secs_page_list)
    const startedAt = React.useRef(new Date()).current;
    const secs_offset = 0;
    const date_pivot = DateTool.secs2added(startedAt, secs_offset);

    const sectioncount = ArrayTool.len(secs_list);
    // assert(sectioncount>1);

    const secs_period = MathTool.sum(secs_list);

    const [sectionindex, setSectionindex] = React.useState(undefined);
    // const pageindexRef = self.ref2updated(React.useRef(), pageindex);
    // const [pageindexPrev, setPageindexPrev] = React.useState(pageindex);

    React.useEffect(() => {
      const f_repeat = () => {
        const secs_remainder = DateTool.subtract2secs(new Date(), date_pivot) % secs_period;
        const {bucketindex:sectionindex, remainder:secs_wait} = ArrayTool.number2bucketindex_remainder(secs_remainder, secs_list);
        setSectionindex(sectionindex);

        setTimeout(f_repeat, secs_wait*1000);
      }

      setTimeout(f_repeat, secs_offset*1000);
    }, []);

    return sectionindex!;
  }

  static func2delayed = <X>(func: (() => X), key:any=undefined, ms_delay:number=undefined,): X => {
    const callname = `HookTool.func2delayed @ ${DateTool.time2iso(new Date())}`;

    const [x, set_x] = React.useState<X>();
    const f = () => set_x(func());
    React.useEffect(() => {
      ms_delay ? setTimeout(f, ms_delay) : f();
    }, key ? [key] : []);
    return x!;
  }

  static use_isfirst = ():boolean => {
    const ref = HookTool.arrayref2lshift(React.useRef([true,true]), false);
    return ref.current[0];
  }

  // static setter2synced = <T,K>(
  //   value_source: T,
  //   set_target:React.Dispatch<React.SetStateAction<T>>,
  //   onChange_target?: (t1: T) => void,
  //   // onChange?: React.Dispatch<React.SetStateAction<T>>,
  //   options?:{
  //     value2key?: (t: T) => K,
  //     skip_first_effect:boolean,
  //   }
  // ):void => {
  //   const t0 = value_source;
  //   const set_t1 = set_target;
  //   // const onChange_t1 = onChange_target;

  //   const {skip_first_effect, value2key: value2key_in} = (options ?? {});
  //   const value2key = value2key_in ?? ((t:T) => t);

  //   // const ref = HookTool.arrayref2lshift(React.useRef([true,true]), false);
  //   const isfirst = HookTool.use_isfirst();
  //   const is_skipping = () => (skip_first_effect && isfirst);
    
  //   // React.useEffect(() => !is_skipping() && onChange_t1 && onChange_t1(t1), [value2key(t1)]);
  //   React.useEffect(() => !is_skipping() && set_t1(t0), [set_t1(t0)]);
  // }

  // https://stackoverflow.com/a/71941802

  // static storage2itemhandlers(storage:Storage){
  //   return {
  //     get_item: storage.getItem,
  //     set_item: storage.setItem,
  //     remove_item: storage.removeItem,
  //   };
  // }

  static synced2value = <V>(
    hook: Reacthook<V>,
    value_in:V
  ): Reacthook<V> => {
    const [v, set_v] = hook;
    React.useEffect(() => { set_v(value_in); }, [value_in]);
    return hook;
  }

  static synced2storage = <X>(
    hook: Reacthook<X>,
    k: string,
    itemhandlers:{
      get_item: (k:string) => string,
      set_item: (k:string, v:string) => void,
      remove_item: (k:string) => void,
    },
    options?:{
      is_equal?:(x1:X, x2:X) => boolean,
    }
  ): Reacthook<X> => {
    const cls = HookTool;
    const callname = `HookTool.synced2storage @ ${DateTool.time2iso(new Date())}`;

    const encode = (x:any):string => JsonTool.stringify(JsonTool.hdoc2jdoc(x))
    const decode = (s:string):any => JsonTool.jdoc2hdoc(JsonTool.parse(s))

    const {get_item, set_item, remove_item} = itemhandlers;
    const {is_equal:is_equal_in} = (options || {});
    const is_equal = is_equal_in ?? EqualTool.isStrictlyEqual;

    // const hook = React.useState<X>(options?.initialValue);
    const [value, set_value] = hook;
    const s = encode(value);
    // console.log({ callname, s, hook, k })

    const is_first = HookTool.useFirst();

    React.useEffect(() => {
      const x = decode(get_item(k));
      if (x != null) { set_value(v => is_equal(v,x) ? v : x) };
    }, []);

    React.useEffect(() => {
      if (is_first) { return; }

      if (s == null) {
        if(get_item(k) != null){ remove_item(k); }
      }
      else {
        if(get_item(k) !== s){ set_item(k, s); }
      }
    }, [s]);
    return hook;
  }


  static hook2wineventlinked = <X>(
    hook_in: Reacthook<X>,
    eventkey: string,
    option?: { isEqual?: Bicomparator<X>, },
  ):Reacthook<X> => {
    const cls = HookTool;
    const callname = `HookTool.hook2wineventlinked @ ${DateTool.time2iso(new Date())}`;

    const isEqual = option?.isEqual ?? CmpTool.pair2eq_strict;

    // listen: event => hook
    const listener = (e:CustomEvent<X>) => {
      const x = WindoweventTool.event2value<X>(e);
      // console.log({callname, x});

      hook_in[1](x_prev => (isEqual(x_prev, x) ? x_prev : x));
    };

    HookTool.useEffectUpclock(() => {
      window.addEventListener(eventkey, listener, false);
      return () => window.removeEventListener(eventkey, listener, false);
    }, eventkey != null);

    // dispatch: hook => event
    const hook_out = HookTool.hook2codeced<X,X>(hook_in, {
      decode:x => x,
      encode: (c, p_prev) => {
        if(isEqual(c, p_prev)){ return p_prev; }

        const event = WindoweventTool.key_value2event(eventkey, c);
        // console.log({callname, eventkey, c, event});
        window.dispatchEvent(event);
        return c;
      }
    });
    return hook_out;
  }

  static hook2synced = <T,K>(
    hook_target:Reacthook<T>,
    value_source: T,
    
    // onChange?: React.Dispatch<React.SetStateAction<T>>,
    options?:{
      onChange_target?: (t1: T) => void,
      value2key?: (t: T) => K,
      skip_first_effect:boolean,
    }
  ):Reacthook<T> => {
    const t0 = value_source;
    const [t1, setT1] = hook_target;
    const {skip_first_effect, value2key: value2key_in, onChange_target} = (options ?? {});

    const onChange_t1 = onChange_target;
    const value2key = value2key_in ?? ((t:T) => t);

    // const ref = HookTool.arrayref2lshift(React.useRef([true,true]), false);
    const isfirst = HookTool.use_isfirst();
    const is_skipping = () => (skip_first_effect && isfirst);
    
    React.useEffect(() => !is_skipping() && onChange_t1 && onChange_t1(t1), [value2key(t1)]);
    React.useEffect(() => !is_skipping() && setT1(t0), [value2key(t0)]);
    return hook_target;
  }

  static codec_teestorage = <X>(
    webstorage:Storage,
    storage_key:string,
  ):Hookcodec<X,X> => {
    const f_listen = (x:X) => StorageTool.updateItem(webstorage, storage_key, JsonTool.hdoc2jstr(x))
    return HookTool.f_out2hookcodec<X>(f_listen);
  }

  static versionhook2synced = <T>(
    versionhook: { version:number, update: React.Dispatch<React.SetStateAction<T>>, value: T, ref: React.MutableRefObject<T>, },
    value_in: T,
    onChange?: (t:T) => void,
  ) => {
    const { version, update, value, ref, } = versionhook; // Trighook.useTrighook({ initialValue: item_in, });
    React.useEffect(() => onChange && onChange(ref.current), [version]);
    React.useEffect(() => update(value_in), [value_in]); // in case of change of reference
    return versionhook;
  }

  // static value2synced_hook<T>(
  //   // hook:[T,Dispatch<SetStateAction<T>>],
  //   value_in: T,
  //   onChange?: (t: T) => void,
  // ):[T,Dispatch<SetStateAction<T>>]  {
  //   const [value, setValue] = React.useState<T>(value_in);
  //   React.useEffect(() => onChange && onChange(value), [value]);
  //   React.useEffect(() => setValue(value_in), [value_in]);

  //   return [value, setValue];
  // }

  static useTimedIndexTransition = (durations: number[]) => {
    const [index, setIndex] = React.useState(0);

    // const [visible, setVisible] = React.useState(true);
    React.useEffect(() => {
      if(index >= durations.length){ return; }
      
      setTimeout(
        () => setIndex(index + 1),
        durations[index],
      );

    }, [index, durations]);

    return index;
  }

  static decode2codec_ll2list = <T>(decode:(ll:T[][]) => T[]) => ({ decode, encode: ArrayTool.one2l<T[]>, });
  static codec_ll2list = <T,>():Hookcodec<T[][], T[]> => ({ decode: ll => ll?.flat(), encode: ArrayTool.one2l<T[]>, });
}

export type Asyncresult = {
  state:string;
  errormessage?:any;
}
export class Asynctracker {
  static State = class {
    static READY = 'READY';
    static INACTION = 'INACTION';
    static DONE = 'DONE';
    static ERROR = 'ERROR';

    static state2is_actionable(state:string){
      const cls = Asynctracker.State;
      return state != cls.INACTION;
    }
  }

  static afunc_statehook2conn = <T=any, P extends any[]=any[]>(
    action:(...args:P) => (T|Promise<T>),
    asyncresult_hook:Reacthook<Asyncresult>,
    option?:{
      is_actionable_whileinaction?:boolean,
      neverending_inaction?:boolean,
    }
  ):({
    hook:Reacthook<Asyncresult>,
    action:(...args:P) => Promise<T>,
  }) => {
    const cls = Asynctracker;
    const callname = `Asynctracker.afunc_statehook2conn @ ${DateTool.time2iso(new Date())}`;

    const asyncstate_hook = HookTool.hook2down<Asyncresult, string>(asyncresult_hook, ['state'])
    // const [state, set_state] = React.useState<string>();
    // const [state, set_state] = statehook;
    const is_actionable = ArrayTool.any([
      !!option?.is_actionable_whileinaction,
      Asynctracker.State.state2is_actionable(asyncstate_hook[0]),
    ]);

    return {
      hook: asyncresult_hook,
      action: async (...args: P) => {

        // the following two statements must be ATOMIC because javascript doesn't context switch in random
        if(!is_actionable){ return; }
        asyncstate_hook[1](cls.State.INACTION);

        return Promise.resolve(action(...args))
          ?.then((t: T) => {
            // console.log({callname, state:cls.State.DONE});
            // console.log({callname, t})

            if (!option?.neverending_inaction) {
              asyncstate_hook[1](cls.State.DONE);
            }
            return t;
          })
          ?.catch((jdoc: any) => {
            const errormessage = jdoc?.errors?.join(', ');
            // console.log({callname, jdoc, errormessage})
            asyncresult_hook[1]({state:cls.State.ERROR, errormessage});
            throw jdoc;
          })
      },
    };
  }

  static async2tracked = <K, T,>(
    action_in: (...args: K[]) => Promise<T>,
    options?: {
      ms_delay?: number,
      // callback?: (t: T) => void,
    },
  ): {
    state: string,
    action: (...args: K[]) => Promise<T>,
  } => {
    /**
     * use afunc_statehook2conn
     */
    const cls = Asynctracker;
    const { ms_delay: ms_delay_in } = (options || {});

    const [state, setState] = React.useState<string>(cls.State.READY);

    /**
     * convert DONE => READY
     * after ms_delay
     */
    const ms_delay = ms_delay_in ?? 1000;
    React.useEffect(() => {
      if (state !== cls.State.DONE) { return; }

      setTimeout(() => setState(cls.State.READY), ms_delay);
    }, [state]);

    const action_out = async (...args: K[]):Promise<T> => {
      setState(cls.State.INACTION);
      return action_in(...args)
        .then((x: T) => {
          setState(cls.State.DONE);
          return x;
          // callback && callback(x);
        });
    };

    return { state, action: action_out, };
  }
}

export class Observerhook{
  // https://medium.com/strise/making-use-of-observers-in-react-a29b1fd05fa7
  static useIntersectionObserver = (
    callback:IntersectionObserverCallback,
    options?:IntersectionObserverInit,
  ) => {
    const observer = React.useRef(null)
  
    return React.useCallback((node) => {
      if (!node) {
        if (observer.current) {
          observer.current.disconnect()
        }
        return
      }
  
      observer.current = new window.IntersectionObserver(callback, options)
      observer.current.observe(node)
    }, [])
  }

  // https://stackoverflow.com/a/67826055
  static useOnscreen = (ref: RefObject<HTMLElement>) => {
    const observerRef = React.useRef<IntersectionObserver>();
    const [isOnScreen, setIsOnScreen] = React.useState(false);

    React.useEffect(() => {
      observerRef.current = new IntersectionObserver(([entry]) => {
        setIsOnScreen(entry.isIntersecting)
      });
    }, []);

    React.useEffect(() => {
      observerRef.current.observe(ref.current);

      return () => {
        observerRef.current.disconnect();
      };
    }, [ref]);

    return isOnScreen;
  }
}