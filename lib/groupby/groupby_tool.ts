import FunctionTool from "../function/function_tool";
import CmpTool from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool"
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";
import { Dictkey } from "../native/native_tool";

export type Groupnode<P, X> = [P, X[]]
export type Pack<P, X, K extends Dictkey = Dictkey,> = { key: K, parent: P, entries: X[] }

export default class GroupbyTool {

  static dict_groupby<X, OTREE, K extends Dictkey,>(
    items: X[],
    f_item2key_list: ((item: X) => K)[],
  ): OTREE {
    const cls = GroupbyTool;
    const callname = `GropubyTool.dict_groupby @ ${DateTool.time2iso(new Date())}`;

    // console.log({callname, stage:'in', funcs, items,});
    if (!ArrayTool.bool(f_item2key_list)) { return items as unknown as OTREE; }
    if (items == null) { return undefined; }

    const h_tree = items.reduce((h_in, x) => {
      const k = f_item2key_list[0](x);

      if (!(k in h_in)) { h_in[k] = [] }
      h_in[k].push(x);
      return h_in;
    }, {} as Record<K, X[]>);

    const h_out = DictTool.dict2values_mapped(h_tree,
      (_: K, l: X[]) => cls.dict_groupby(l, f_item2key_list.slice(1))
    );

    // console.log({callname, stage:'out', funcs, items, h_out});
    return h_out as unknown as OTREE;
  }

  static dict_groupby_1step<X, K extends Dictkey = Dictkey>(
    items: X[],
    item2key: (item: X, index?: number, array?: X[]) => K,
  ): Record<K, X[]> {
    const self = GroupbyTool;
    // const {item2key,} = funcdict;

    return items?.reduce((h, x, i, l) => {
      const k = item2key(x, i, l);

      if (!(k in h)) { h[k] = [] }
      h[k].push(x);

      return h;
    }, {} as Record<K, X[]>);
  }

  static Deprecated = class {
    static dict_groupby_1step<K extends Dictkey, X, L>(
      items: X[],
      funcdict: {
        item2key: (item: X) => K,
        key_items2leaf?: (k: K, items: X[]) => L,
      }
    ): Record<K, L> {

      // https://stackoverflow.com/a/34890276/1902064
      let {
        item2key,
        key_items2leaf,
      } = funcdict;
      const n: number = ArrayTool.len(items);

      const reducer = (h, x) => {
        const k = item2key(x)

        if (!(k in h)) { h[k] = [] }
        h[k].push(x)

        return h
      }
      const dict_key2items = items.reduce(reducer, {});

      const dict_key2leaf = key_items2leaf ? DictTool.dict2values_mapped(dict_key2items, key_items2leaf) : dict_key2items;
      return dict_key2leaf;
    }
  }

  static gbtree2dict_count(dict_k2vs: Record<any, any>) {
    return DictTool.merge_dicts(
      Object.entries(dict_k2vs).map(([k, vs]) => ({ [k]: ArrayTool.len(vs) })),
      DictTool.WritePolicy.no_duplicate_key,
    );
  }

  static dict_groupby2reversed<K extends Dictkey, V extends Dictkey>(
    dict_k2vs: Record<K, V[]>
  ): Record<V, K> {
    const k2vs_list: ([K, V[]])[] = Object.entries(dict_k2vs) as ([K, V[]])[];

    const dict_v2k_list: (Record<V, K>)[] = [].concat(...k2vs_list.map(([k, vs]) => (vs.map(v => ({ [v]: k })))));
    const dict_v2k: Record<V, K> = DictTool.merge_dicts(dict_v2k_list, DictTool.WritePolicy.no_duplicate_key);
    return dict_v2k;
  }

  static packby_global<P, X, K extends Dictkey,>(
    items: X[],
    funcdict: {
      item2parent: (item: X, index?: number, array?: X[]) => P,
      parent2key?: (parent: P) => K,
      // items2leaf?: (items:X[]) => L,
    },
  ): Pack<P, X, K>[] {
    const cls = GroupbyTool;
    const callname = `GropubyTool.grouped_global_1step @ ${DateTool.time2iso(new Date())}`;

    // if(!items){ return undefined; }
    const { item2parent, parent2key } = funcdict;

    if (!items) { return undefined; }

    const n: number = ArrayTool.len(items);
    const parents: P[] = items.map(item2parent);
    const keys: K[] = parent2key ? parents.map(parent2key) : (parents as unknown as K[]);

    const key2indexes = cls.groupby_global_1step(ArrayTool.range(0, n), { item2parent: i => keys[i] });
    return key2indexes.map(
      ([k, indexes]) => ({
        key: k,
        parent: parents[indexes[0]],
        entries: indexes.map(i => items[i]),
      })
    );
  }

  static groupby_global_1step<P, X>(
    items: X[],
    funcdict: {
      item2parent: (item: X, index?: number, array?: X[]) => P,
      parent2key?: (parent: P) => Dictkey,
      // items2leaf?: (items:X[]) => L,
    },
  ): ([P, X[]])[] {
    const self = GroupbyTool;
    const callname = `GropubyTool.groupby_global_1step @ ${DateTool.time2iso(new Date())}`;

    // if(!items){ return undefined; }
    const { item2parent, parent2key } = funcdict;

    if (!items) { return undefined; }

    const n: number = ArrayTool.len(items);
    const parents: P[] = items.map(item2parent);
    const keys: Dictkey[] = parent2key ? parents.map(parent2key) : (parents as unknown as string[]);

    const dict_key2indexes: { [key: string]: number[] } = self.dict_groupby_1step(ArrayTool.range(0, n), i => keys[i]);

    // const is2leaf: ((items:X[]) => L) = items2leaf || ((l: X[]) => (l as unknown as L));
    return Object.values(dict_key2indexes).map(
      (indexes) => {
        const parent = parents[indexes[0]];
        const children = indexes.map(i => items[i])
        // const leaf:L = children as unknown as L);

        // console.log({callname, parent, children, leaf});
        return [parent, children];
      }
    );
  }

  static groupby_global<X>(
    items: X[],
    funcdicts: {
      item2parent: (item: X, index?: number, array?: X[]) => any,
      parent2key?: (parent: any) => Dictkey,
      // items2leaf?: (items:X[]) => L,
    }[],
  ): any[] {
    const cls = GroupbyTool;
    const callname = `GropubyTool.groupby_global @ ${DateTool.time2iso(new Date())}`;

    // if(!items){ return undefined; }
    // const {item2parent, parent2key} = funcdict;

    if (!items) { return undefined; }
    if (!ArrayTool.bool(funcdicts)) { return items; }

    const k2vs_list = cls.groupby_global_1step(items, funcdicts[0]);
    return k2vs_list.map(([k, vs]) => [k, cls.groupby_global(vs, funcdicts.slice(1))]);
  }

  static groupby_global_1step_sorted<P, X>(
    items: X[],
    funcdict: {
      item2parent: (item: X, index?: number, array?: X[]) => P,
      parent2key?: (parent: P) => Dictkey,
      // items2leaf?: (items:X[]) => L,
      entries2cmp?: (pl1: [P, X[]], pl2: [P, X[]]) => number,
    },
  ): Groupnode<P, X>[] {
    const self = GroupbyTool;
    if (!items) { return undefined; }

    const { item2parent, parent2key, entries2cmp } = funcdict;
    const pl_list_raw: ([P, X[]])[] = self.groupby_global_1step(items, { item2parent, parent2key });
    const pl_list_sorted: ([P, X[]])[] = ArrayTool.sorted(pl_list_raw, (pl1, pl2) => entries2cmp(pl1, pl2));
    return pl_list_sorted;
  }

  static dict_gbtree(items, funcs) {
    const self = GroupbyTool;

    if (!ArrayTool.bool(funcs)) { return items; }

    const item2key = funcs[0];
    const dict_key2items = self.dict_groupby_1step(items, item2key);

    return Object.entries(dict_key2items).reduce(
      (h, [k, items_child]) => {
        const tree_child = self.dict_gbtree(items_child, funcs.slice(1));
        h[k] = tree_child;
        return h;
      },
      {});
  }

  static groupby_global_sorted<X>(
    items: X[],
    funcdicts: {
      item2parent: (item: any, index?: number, array?: any[]) => any,
      parent2key?: (parent: any) => Dictkey,
      // items2leaf?: (items:X[]) => L,
      entries2cmp?: (pl1: [any, any[]], pl2: [any, any[]]) => number,
    }[],
  ): any[] {
    const cls = GroupbyTool;
    const callname = `GropubyTool.groupby_global @ ${DateTool.time2iso(new Date())}`;

    // if(!items){ return undefined; }
    // const {item2parent, parent2key} = funcdict;

    if (!items) { return undefined; }
    if (!ArrayTool.bool(funcdicts)) { return items; }

    const k2vs_list = cls.groupby_global_1step_sorted(items, funcdicts[0]);
    return k2vs_list.map(([k, vs]) => [k, cls.groupby_global_sorted(vs, funcdicts.slice(1))]);
  }

  static array2dict_count(array, item2key) {
    const self = GroupbyTool;

    const dict_key2objects = self.dict_groupby_1step(array, item2key);

    const reducer = (h, [k, l]) => {
      h[k] = ArrayTool.len(l);
      return h;
    };
    return Object.entries(dict_key2objects).reduce(reducer, {});
  }

  static dict_groupby2groups_list_by_count<K extends Dictkey, V>(
    dict_key2items: Record<K, V[]>,
  ) {
    const dict_count2keys: Record<number, K[]> = GroupbyTool.dict_groupby_1step(
      Object.keys(dict_key2items) as K[],
      k => ArrayTool.len(dict_key2items[k]),
    );

    const counts_sorted = ArrayTool.sorted(Object.keys(dict_count2keys), CmpTool.subtract_typeignore);
    const groups_list = counts_sorted.map(c => dict_count2keys[c].map(k => dict_key2items[k]));
    return groups_list;
  }

  static array2firstK_minimaxindexes_list<K, X>(
    array: X[],
    limit: number,
    config?: {
      item2parent?: (x: X) => K,
      parents2cmp?: (k1: K, k2: K) => number,
    }
  ): [number[][], number[][]] {
    const n = ArrayTool.len(array);

    const item2parent = (config && config.item2parent) ? config.item2parent : ((x: X) => (x as unknown as K));
    const parents2cmp = (config && config.parents2cmp) ? config.parents2cmp : CmpTool.pair2cmp_default;

    const key2indexes_list: ([K, number[]])[] = GroupbyTool.groupby_global_1step_sorted(
      ArrayTool.range(0, n),
      {
        item2parent: i => item2parent(array[i]),
        entries2cmp: (kx1, kx2) => parents2cmp(kx1[0], kx2[0]),
      },
    );

    const indexes_list_min = (() => {
      const indexes_list: number[][] = [];
      let p = 0;

      for (const [key, indexes] of key2indexes_list) {
        if (p >= limit) { break; }
        indexes_list.push(indexes);
        p += ArrayTool.len(indexes);
      }
      return indexes_list;
    })();

    const indexes_list_max = (() => {
      const indexes_list: number[][] = [];
      let p = 0;

      for (const [key, indexes] of ArrayTool.reversed(key2indexes_list)) {
        if (p >= limit) { break; }
        indexes_list.push(indexes);
        p += ArrayTool.len(indexes);
      }
      return indexes_list;
    })();

    return [indexes_list_min, indexes_list_max]
  }

  static array2firstK_minindexes_list<K, X>(
    array: X[],
    limit: number,
    config?: {
      item2parent?: (x: X) => K,
      parents2cmp?: (k1: K, k2: K) => number,
    },
  ) {
    return GroupbyTool.array2firstK_minimaxindexes_list(array, limit, config)[0];
  }

  static array2firstK_maxindexes_list<K, X>(
    array: X[],
    limit: number,
    config: {
      item2parent?: (x: X) => K,
      parents2cmp?: (k1: K, k2: K) => number,
    },
  ) {
    return GroupbyTool.array2firstK_minimaxindexes_list(array, limit, config)[1];
  }

  static gbtree2flat<K, V, X>(
    gbtree: [K, V[]][],
    options?: {
      k2flat?: (k: K) => X,
      v2flat?: (v: V) => X,
      kvs2flat?: (k: X, vs: X[]) => X[],
    },
  ) {
    const k2flat = options?.k2flat ?? ((k: K) => (k as unknown as X));
    const v2flat = options?.v2flat ?? ((v: V) => (v as unknown as X));
    const kvs2flat = options?.kvs2flat ?? ((k, vs) => [k, ...vs]);

    return gbtree
      ?.map(([k, vs]) => kvs2flat(k2flat(k), vs.map(v2flat)))
      ?.flat();
  }

}

export class Mapinfo<X, Y, A extends any[]=any[],>{
  f_cond: (x: X, i?:number) => boolean
  f_batch: (l: X[], ...args: A) => Y[]|Promise<Y[]>

  static infos2infos_condsdisjoint = <X, Y, A extends any[]=any[],>(infos:Mapinfo<X, Y, A>[]):Mapinfo<X, Y, A>[] => {
    const f_conds_disjoint = FunctionTool.f_bools2f_bools_disjoint(infos?.map(info => info.f_cond));

    return infos?.map((info,i) => {
      return {
        f_cond: f_conds_disjoint[i],
        f_batch: info.f_batch,
      }
    })
    
  }
}
export class MapreduceTool{

  static async_mapreduce = <X, Y, A extends any[]=any[]>(
    mapinfos: Mapinfo<X, Y, A>[],
  ): (l: X[], ...args: A) => Promise<Y[]> => {
    const cls = GroupbyTool;
    const callname = `MapreduceTool.async_mapreduce @ ${DateTool.time2iso(new Date())}`;

    return async (l_in: X[], ...args: A): Promise<Y[]> => {
      if (l_in == null) return undefined;

      const n = l_in?.length;
      const p = mapinfos?.length;

      const dict_j2is = cls.dict_groupby_1step(
        ArrayTool.range(n),
        i => ArrayTool.filter2one(
          j => mapinfos[j].f_cond(l_in[i], i),
          ArrayTool.range(p),
          {emptyresult_forbidden:true},
        )?.toString(),
      );
      const is_list = ArrayTool.range(p).map(j => dict_j2is[j?.toString()]);

      const ys_list = await Promise.all(mapinfos?.map(async (mapinfo,j) => {
        const is = is_list[j];
        // console.log({callname, 'ArrayTool.bool(is)':ArrayTool.bool(is), is, dict_j2is, j});
        if(!ArrayTool.bool(is)) return [];
          
        const ys_out = await mapinfo.f_batch(is?.map(i => l_in[i]), ...args);
        // console.log({callname, ys_out})
        return ys_out;
      }))

      // console.log({
      //   callname,
      //   n, p, 
      //   'is_list?.length':is_list?.length,
      //   'is_list?.map(is => is?.length)':is_list?.map(is => is?.length),
      //   'ys_list?.length':ys_list?.length,
      //   'ys_list?.map(ys => ys?.length)':ys_list?.map(ys => ys?.length),
      // })

      const dict_i2y = DictTool.merge_dicts<Record<number,Y>>(
        ArrayTool.range(p).flatMap(j => {
          const is = is_list[j];
          const ys = ys_list[j];
          return is?.map((i,ii) => ({[i?.toString()]:ys[ii]} as Record<number,Y>)) ?? [];
        }),
        DictTool.WritePolicy.no_duplicate_key
      );

      return ArrayTool.range(n).map(i => dict_i2y[i?.toString()]);
    }
  }
}
