import FunctionTool from "../function/function_tool";
import ArrayTool from "../collection/array/array_tool";
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";
import MathTool from "../number/math/math_tool";
import LruCache from "./lru_cache/lru_cache";

type Cachelike<X, A extends any[]> = {
  get: (args?:A) => X,
  set: (x:X, args?:A) => void,
  remove?: (args?:A) => void,
};

// type Cachemask<A extends any[]> = {
//   args2hit: (a:A) => boolean,
//   args2notified?: (a:A) => void,
// }

export type Timedobj<X> = {
  time:number;
  obj:X;
}

export default class CacheTool {
  // static f_key2f_isEqual<K, T>(
  //   f_item2key: (t: T) => K,
  //   isEqual?: (k1: K, k2: K) => boolean,
  // ) {
  //   const isEqual_ = isEqual || lodash.isEqual;

  //   const f_isEqual = (item1: T, item2: T) => {
  //     const callname = `CacheTool.f_key2f_isEqual @ ${DateTool.time2iso(new Date())}`;
  //     // console.log({callname, item1, item2});
  //     // throw new Error('hello world');

  //     const [key1, key2] = [f_item2key(item1), f_item2key(item2)];
  //     const is_equal = isEqual_(key1, key2);
  //     return is_equal;
  //   };
  //   return f_isEqual;
  // }
  static dummy(fn: any): any {
    return fn;
  }

  static nomemo_one = <T>(fn: T):T => fn;

  static memo_one<T, K = any>(
    fn: ((...args: K[]) => T),
    // options?: {
      // logname?: string,
      // isEqual?: (x1: K[], x2: K[]) => boolean,
    // },
  ): ((...args: K[]) => T) {
    // const isEqual = options?.isEqual ?? lodash.isEqual;
    const f_eq = ArrayTool.areAllTriequal; // CmpTool.isEqual;

    var prev: any = undefined;
    // const logname = options?.logname;

    return (...args) => {
      const prev_args = prev ? prev[0] : undefined;

      const is_equal = prev_args!==undefined && f_eq(args, prev_args);
      if (is_equal) {
        return prev[1];
      }

      const result = fn(...args);

      prev = [args, result];
      // cache[k] = result;
      return result;
    }
  }

  static memo<T, A extends any[], K=any>(
    fn: ((...args: A) => T),
    config?: {
      args2key?: (...args: A) => K,
      limit?: number,
    }
    // args2key = undefined,
    // limit = undefined,
  ): ((...args: A) => T) {
    const callname = `CacheoTool.memo @ ${DateTool.time2iso(new Date())}`;

    const args2key = config?.args2key ?? ((...args) => args);
    const limit = DictTool.in('limit', config) ? config.limit : 10;
    // if (!args2key) { args2key = x => x; }

    const cache = new LruCache(limit);
    return (...args) => {
      const k = args2key(...args);
      if (cache.has(k)) {
        return cache.read(k);
      }

      const result = fn(...args);
      cache.write(k, result);
      return result;
    }
  }

  static onecache = <X>():Cachelike<X,never> => {
    var x:X = undefined;

    return {
      get: () => x,
      set: (x_in:X,) => { x = x_in; },
      remove: () => { x = undefined; }
    }
  }

  // static dictcache = <X>():Cachelike<X,[string]> => {
  //   const h:Record<string,X> = {};

  //   return {
  //     get: (args:[string]) => h[args[0]],
  //     set: (x:X, args:[string]) => { h[args[0]] = x; },
  //     remove: (args:[string]) => { delete h[args[0]]; }
  //   }
  // }

  static cache2wrapped = <X, P extends any[], C extends any[]>(
    cache:Cachelike<X,C>,
    encoder:(p:P) => C,
  ):Cachelike<X,P> => {

    return {
      get: (p:P) => cache.get(encoder(p)),
      set: (x:X, p:P) => cache.set(x, encoder(p)),
      ...cache.remove == null
        ? {}
        : {remove:(p:P) => cache.remove?.(encoder(p)),},
    }
  }

  static func2cached = <X, A extends any[]>(
    fn: ((...args: A) => X),
    cache: Cachelike<X,A>,
  ): ((...args: A) => X) => {
    const cls = CacheTool;
    const callname = `CacheTool.func2cached @ ${DateTool.time2iso(new Date())}`;
    
    return (...args) => {
      const x_cache = cache.get(args);
      // console.log({callname, x_cache, args})
      if (x_cache !== undefined) return x_cache;

      const x_calced = fn(...args);
      cache.set(x_calced, args);
      return x_calced
    }
  }

  static afunc2timedcached = <X, A extends any[]>(
    fn: ((...args: A) => Promise<X>),
    timedcache: Cachelike<Timedobj<X>,A>,
    ttl:number,
    fallback_mode: 'BLOCKING'|'NONBLOCKING',
    // option?:{
    //   fallback_mode?: 'BLOCKING'|'NONBLOCKING',
    // }
  ): ((...args: A) => Promise<X>) => {
    const cls = CacheTool;
    const callname = `CacheTool.func2tcached @ ${DateTool.time2iso(new Date())}`;
    
    return async (...args) => {
      const secs_pivot = (new Date()).getTime() - ttl;

      const timedobj_cache = timedcache.get(args);
      // console.log({callname, x_cache, args})
      if(ArrayTool.all([
        timedobj_cache !== undefined,
        MathTool.gt(timedobj_cache?.time, secs_pivot),
      ])) return timedobj_cache.obj;

      // const fallback_mode = option?.fallback_mode ?? 'NONBLOCKING';
      const obj_promise = fn(...args)
        .then(FunctionTool.func2f_tee(x => timedcache.set({obj:x, time:(new Date()).getTime()}, args)));

      return fallback_mode == 'NONBLOCKING'
        ? timedobj_cache?.obj
        : (await obj_promise);
    }
  }

  // static cache2lrued = <X>(
  //   cache: Cachelike<X,[string]>,
  //   limit:number,
  // ):Cachelike<X,[string]> => {
  //   var args_lru = [];

  //   return {
  //     get: (args:[string]) => {
  //       const x = cache.get(args);
  //       if(x !== undefined){
  //         args_lru = [
  //           args,
  //           ...args_lru?.filter(args_ => args_[0] != args[0]),
  //         ];
  //       }
  //       return x;
  //     },
  //     set: (x:X, args:[string]) => {
  //       cache.set(x, args);
  //       if(args_lru.length > limit){
  //         args_lru.slice(limit).forEach(args_ => {
  //           cache.remove(args_)
  //         });
  //         args_lru = args_lru.slice(0,limit)
  //       }
  //     },
  //     remove: (args:[string]) => {
  //       cache.remove?.(args);
  //       args_lru = args_lru?.filter(args_ => args_[0] != args[0])
  //     },
  //   };
  // }

  // static func_ttl2cached = <O, A extends any[]>(
  //   func:(...args:A) => O,
  //   ttl:number,
  //   timedcache:Cachelike<Timedobj<O>,A>,
  // ):((...args:A) => O) => {
  //   const cls = CacheTool;

  //   const cache = {
  //     get: (args:A) => {
  //       const tx = timedcache.get(args);
  //       return MathTool.lt(tx.time, (new Date()).getTime() - ttl)
  //         ? undefined
  //         : tx.obj;
  //     },
  //     set: (o:O, args:A) => { timedcache.set({obj:o, time:(new Date()).getTime()}, args); },
  //     ...!timedcache.remove
  //       ? {}
  //       : {
  //         remove: (args:A) => { timedcache.remove(args); }
  //       }
  //   };
  //   return cls.func2cached(func, cache);
  // }

  static timedcache2cache = <O, A extends any[]>(
    timedcache:Cachelike<Timedobj<O>,A>,
    ttl:number,
  ):Cachelike<O,A> => {
    const cls = CacheTool;
    const callname = `CacheoTool.timedcache2cache @ ${DateTool.time2iso(new Date())}`;

    return {
      get: (args:A) => {
        const tx = timedcache.get(args);
        // console.log({callname, tx, args});

        if(tx === undefined) return undefined;

        const pivot = (new Date()).getTime() - ttl;
        return MathTool.gt(tx.time, pivot)
            ? tx.obj
            : undefined;
      },
      set: (o:O, args:A) => { timedcache.set({obj:o, time:(new Date()).getTime()}, args); },
      ...!timedcache.remove
        ? {}
        : {
          remove: (args:A) => { timedcache.remove(args); }
        }
    };
  }
  

  // static ttlmemo1<X, K = any>(
  //   fn: ((...args: K[]) => X),
  //   option?: {
  //     argpair2eq?: (x1: K[], x2: K[]) => boolean,
  //   },
  // ): ((ttl:number) => (...args: K[]) => X) {
  //   // const isEqual = options?.isEqual ?? lodash.isEqual;
  //   const argpair2eq = option?.argpair2eq ?? ArrayTool.areAllTriequal; // CmpTool.isEqual;

  //   var h: {args:K[], x:X, created_at:number} = undefined;

  //   return (ttl:number) => {
  //     return (...args:K[]):X => {
  //       const now = (new Date())?.getTime();

  //       const is_hit = (() => {
  //         if(!h) return false;
  //         if(now > h?.created_at + ttl) return false;
  //         if(!argpair2eq(h?.args, args)) return false;
  //         return true;
  //       })();

  //       if(!is_hit){
  //         const x = fn(...args);
  //         h = {args, x, created_at:(new Date()).getTime()};
  //       }

  //       return h.x;
  //     }
  //   }
  // }
}