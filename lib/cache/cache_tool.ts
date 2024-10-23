import ArrayTool from "../collection/array/array_tool";
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";
import LruCache from "./lru_cache/lru_cache";


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
    options?: {
      logname?: string,
      isEqual?: (x1: K[], x2: K[]) => boolean,
    },
  ): ((...args: K[]) => T) {
    // const isEqual = options?.isEqual ?? lodash.isEqual;
    const isEqual = options?.isEqual ?? ArrayTool.areAllTriequal; // CmpTool.isEqual;

    var prev: any = undefined;
    const logname = options?.logname;

    return (...args) => {
      const prev_args = prev ? prev[0] : undefined;

      if (logname) {
        console.log({
          fn,
          logname,
          args,
          prev_args,
          'isEqual(args, prev_args)': isEqual(args, prev_args),
        });
      }

      // throw new Error();
      const is_equal = prev_args && isEqual(args, prev_args);
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
}