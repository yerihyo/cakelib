import stringify from 'json-stable-stringify';
import lodash from 'lodash';
import CmpTool from '../../../cmp/CmpTool';
import DateTool from '../../../date/date_tool';
import NativeTool, { Dictkey, Lastparam, Omitfirst, ParamsWithoutfirst } from '../../../native/native_tool';
import NumberTool from '../../../number/number_tool';
import ReactTool from '../../../react/react_tool';
import StringTool from '../../../string/string_tool';
import TraversileTool from '../../../traversile/traversile_tool';
import ArrayTool from '../../array/array_tool';
import DictTool from '../dict_tool';

// const assert = require('assert');
// const lodash = require('lodash');
// const stringify = require('json-stable-stringify');

export type Jstep = (string | number)
export type Jpath = Jstep[]

export type Leafducer<PO,PI> = (p_in: PI, jedge: Jstep) => PO
export type Grafter<RO,RI> = (root_in: RI, jpath: Jstep[],) => RO

export class JpathTool {
  static is_prefix = ArrayTool.f_eq2f_is_prefix(CmpTool.pair2eq_nativetri);

  static jpath2prefix_stemmed(jpath: Jpath, prefix: Jpath) {
    if (!jpath) { return undefined; }
    NativeTool.assert(!!prefix);
    prefix.forEach((x, i) => NativeTool.assert(x == jpath[i]))
    return jpath.slice(prefix.length);
  }

  // static equals = (l1:Jpath, l2:Jpath):boolean => ArrayTool.equals<Jstep>(l1,l2);
  static equals = ArrayTool.f_bicmp2f_every<Jstep>(CmpTool.pair2eq_nativebi);

}
export class XpathTool {
  static jpath2xpath(jpath: Jpath): string {
    // const jstep2token = jstep => NumberTool.is_number(jstep) ? `[${jstep}]` : `.${jstep}`;

    // return jpath?.map(jstep2token)?.join('');

    return jpath
      ?.filter(x => x != null)
      ?.reduce(
        (s, jstep) => NumberTool.is_number(jstep) ? `${s}[${jstep}]` : (s !== '' ? `${s}.${jstep}` : jstep),
        '',
      ) as string;
  }

  static xpath2jpath(xpath: string): Jpath {
    const callname = `XpathTool.xpath2jpath @ ${DateTool.time2iso(new Date())}`;

    if (xpath == null) { return undefined; }
    if (xpath === '') { return []; }

    const pattern = /[\.\[]/g;
    const matches = [...xpath.matchAll(pattern)];
    if (!ArrayTool.bool(matches)) { return [xpath]; }

    const p = matches.length;
    return ArrayTool.range(p + 1)
      .filter(j => !(j === 0 && matches[j].index === 0))
      .map(j => {
        const s = j === 0 ? 0 : matches[j - 1].index;
        const e = j < p ? matches[j].index : xpath.length;

        const token = xpath.slice(s, e);
        if (j === 0) { return token; }

        const pivot = token.charAt(0);
        if (pivot == '.') { return token.slice(1); }
        if (pivot == '[') { return NumberTool.x2number(token.slice(1, -1)); }
        throw new Error(`Invalid token: ${token}`);
      })
  }

  static is_prefix(prefix: string, xpath: string): boolean {
    const cls = XpathTool;
    return JpathTool.is_prefix(cls.xpath2jpath(prefix), cls.xpath2jpath(xpath));
  }

  static xpath2prefix_added(xpath: string, prefix: string): string {
    return [prefix, xpath].filter(Boolean).join('.');
  }
  static xpath2prefix_stemmed(xpath: string, prefix: string): string {
    const callname = `XpathTool.xpath2prefix_stemmed @ ${DateTool.time2iso(new Date())}`;

    const jpath_stemmed = JpathTool.jpath2prefix_stemmed(XpathTool.xpath2jpath(xpath), XpathTool.xpath2jpath(prefix));
    return XpathTool.jpath2xpath(jpath_stemmed);
    // if (xpath_in == null || xpath_prefix == null) { return undefined; }
    // return xpath_in.slice(xpath_prefix.length + 1);
  }

  static concat(...xpaths: string[]): string {
    const callname = `XpathTool.concat @ ${DateTool.time2iso(new Date())}`;
    const jpaths: Jpath[] = xpaths?.map(XpathTool.xpath2jpath) ?? [];

    const xpath = XpathTool.jpath2xpath(jpaths?.flat());

    // console.log({callname, jpaths, xpath});
    return xpath;
  }
}

export type Codecpair<P, C> = [
  (p: P) => C,
  (c: C) => P,
]
export type Codecobj<P, C> = {
  encode: (p: P) => C
  decode: (c: C) => P
}

export default class JsonTool {
/**
* ref: https://stackoverflow.com/a/16168003/1902064
*/
static json2sortedstring = <X>(x:X, ...args:Omitfirst<Parameters<typeof stringify>>) => x == null ? undefined : stringify(x, ...args);
// static json2sortedstring<X>(x:X):string{
//     if (x == null) { return undefined; }
//     return stringify(x);
// }

// static codec_default<X>():[(x:X) => string, (s:string) => X]{
//     return [
//         x => JsonTool.json2sortedstring<X>(x),
//         s => JSON.parse(s) as X,
//     ]
// }
  static stringify = (x:any) => x == null ? undefined : JSON.stringify(x)
  static parse = <X>(s: string, ...args: ParamsWithoutfirst<typeof JSON.parse>) => s==null ? undefined : (JSON.parse(s, ...args) as X);

  static encode = <X>(x: X): string => JsonTool.json2sortedstring(x);
  // static encode = JsonTool.json2sortedstring;
  static decode = JsonTool.parse;
  static codecpair = <X>(): Codecpair<X, string> => [JsonTool.encode, JsonTool.decode];
  static codecobj = <X>(): Codecobj<X, string> => ({ encode: JsonTool.encode, decode: JsonTool.decode });
  static eq = CmpTool.f_key2f_eq(JsonTool.encode)

  /**
   * // https://stackoverflow.com/a/60333849
   * [Object: null prototype]
   */
  static nullprototype2native = <X>(x: any):X =>{
    const cls = JsonTool;
    return cls.parse<X>(cls.stringify(x));
  }
  static down_one = <P, C>(obj: P, jstep: Jstep): C => {
    return obj == null
      ? undefined
      : NumberTool.is_number(jstep)
        ? ArrayTool.lookup<C>(obj as unknown as C[], jstep as number)
        : DictTool.get<C, Dictkey>(obj as Record<Dictkey, C>, jstep as string);
  }

  static down = <P, C>(
    obj: P,
    jpath: Jpath,
    options?: { down_one?: (obj: any, jstep: string | number) => any },
  ): C => {
    if (obj == null) { return undefined; }

    const { down_one: down_one_in } = (options || {});
    const down_one = down_one_in ?? JsonTool.down_one;
    return jpath.reduce(down_one, obj) as C
  }

  static down_or_error = function (obj, jpath) {
    var i;
    var h = obj;
    for (i = 0; i < jpath.length; i++) {
      const k = jpath[i]
      if (!(k in h)) {
        throw new Error(`invalid key. k=${k}, jpath=${jpath}, obj=${obj}`)
      }
      h = h[k]
    }
    return h
  }

  static jdoc2hdoc = <T = any>(jdoc_in: any): T => {
    const callname = `JsonTool.jdoc2hdoc @ ${DateTool.time2iso(new Date())}`;
    if (!jdoc_in) { return undefined; }

    const f_node = (x: any) => {
      // console.log({callname, x,'DateTool.is_iso8601(x)':DateTool.is_iso8601(x)})
      if (DateTool.is_iso8601(x)) {
        const d = new Date(Date.parse(x));
        // console.log({callname, x,d})
        return d;
      }

      return x;
    }
    // const f = TraversileTool.f_leaf2f_tree(f_node);
    const hdoc_out = TraversileTool.f_leaf2f_tree<T>(f_node)(jdoc_in);

    // console.log({callname, jdoc_in, hdoc_out});
    return hdoc_out;
  }

  // static jstr2hdoc = <X>(s: string): X => JsonTool.jdoc2hdoc<X>(JsonTool.parse(s));
  static jstr2hdoc:(<X>(s: string) => X) = lodash.flow(JsonTool.parse, JsonTool.jdoc2hdoc)// as (<X>(s: string) => X);
  // static jstr2hdoc = <T>(s: string): T => s != null ? (JsonTool.jdoc2hdoc(JsonTool.parse(s)) as T) : undefined;

  static hdoc2jdoc = <H = any, J = any>(hdoc_in: H): J => {
    const callname = `JsonTool.hdoc2jdoc @ ${DateTool.time2iso(new Date())}`;
    if (hdoc_in == null) return undefined;

    const f_node = (x: any) => {
      if (DateTool.is_date(x)) {
        return x.toISOString();
        // try{ return x.toISOString(); }
        // catch(e){
        //     console.error({callname, x, e});
        //     return undefined;
        // }
      }

      return x;
    }
    const jdoc_out = TraversileTool.f_leaf2f_tree<H, J>(f_node)(hdoc_in);

    return jdoc_out;
  }
  static hdoc2jstr = lodash.flow(JsonTool.hdoc2jdoc, JsonTool.encode);

  // static jstr2hdoc(s: string): any {
  //     const cls = JsonTool;

  //     const jdoc = JsonTool.parse(s);
  //     return cls.jdoc2hdoc(jdoc);
  // }

  static areEqualShallow(a, b) {
    // https://stackoverflow.com/a/22266891

    for (var key in a) {
      if (!(key in b) || a[key] !== b[key]) {
        return false;
      }
    }
    for (var key in b) {
      if (!(key in a) || a[key] !== b[key]) {
        return false;
      }
    }
    return true;
  }

  static json2jitems(dict_in) {
    NativeTool.assert(DictTool.is_dict(dict_in));

    function dict_jpath2jitems(dict_node, jpath_node,) {
      const jitems_list = Object.entries(dict_node).map(([k, v]) => {
        const jpath_child = [].concat(jpath_node, [k]);
        const jitems = DictTool.is_dict(v) ? dict_jpath2jitems(v, jpath_child) : [[jpath_child, v]];
        return jitems;
      });
      const jitems_out = [].concat(...jitems_list);
      return jitems_out;
    }

    return dict_jpath2jitems(dict_in, []);
  }

  static edge2reduced_ooplike = <O, C, P = O>(node: P, edge: Jstep, value: C): O => {
    if (node?.[edge] === value) { return node as unknown as O; }

    return (
      Number.isInteger(edge)
        ? (l => { l.splice(edge as number, 1, value); return l; })(node as Object[] || [])
        : (h => { h[edge] = value; return h; })(node || {})
    ) as O;
  }

  static edge2reduced_voplike = <O, C, P = O>(node: P, edge: Jstep, value: C): O => {
    if (node?.[edge] === value) { return node as unknown as O; }

    return (
      Number.isInteger(edge)
        ? ArrayTool.splice((node as Object[]) || [], edge as number, 1, value)
        : { ...node, [edge]: value }
    ) as O;
  }

  static reducer2delete = (reducer: typeof JsonTool.edge2reduced_voplike) => lodash.flow([
    reducer,
    (x: any) => {
      return undefined;
    }
  ])

  static jpath_v2xdoc = <PO, CI>(jpath: Jpath, v: CI): PO => JsonTool.reduceUp<{}, PO, CI, CI>({}, jpath, v, JsonTool.edge2reduced_voplike);
  static jpaths2filtered = <I, O>(h: I, jpaths: Jpath[],): O => DictTool.merge_dicts(
    jpaths?.map(jpath => JsonTool.jpath_v2xdoc(jpath, JsonTool.down(h, jpath))),
    DictTool.WritePolicy.dict_no_duplicate_key,
  )

  static reducer2delete_if_empty = (reducer: typeof JsonTool.edge2reduced_voplike) => lodash.flow([
    reducer,
    (x: any) => {
      if (x == null) { return undefined; }
      if (ArrayTool.is_array(x)) { return ArrayTool.bool(x) ? x : undefined; }
      if (DictTool.is_dict(x)) { return DictTool.bool(x) ? x : undefined; }
      return x;
    }
  ])

  static deleteByJpath = <P = any>(h: P, jpath: Jpath): P => {
    let newObj: any = { ...h }
    let currentObj = newObj;

    for (let i = 0; i < jpath.length - 1; i++) {
      const key = jpath[i];
      if (key === '*') {
        for (const prop in currentObj) {
          if (Array.isArray(currentObj[prop])) {
            currentObj[prop] = currentObj[prop].map((item: any) => JsonTool.deleteByJpath(item, jpath.slice(i + 1)));
          } else if (currentObj.hasOwnProperty(prop)) {
            currentObj[prop] = JsonTool.deleteByJpath(currentObj[prop], jpath.slice(i + 1));
          }
        }
        return newObj;
      }
      if (currentObj[key] === undefined) {
        return newObj;
      }
      currentObj[key] = { ...currentObj[key] };
      currentObj = currentObj[key];
    }

    const lastKey = jpath[jpath.length - 1];
    if (lastKey === '*') {
      for (const prop in currentObj) {
        if (currentObj.hasOwnProperty(prop)) {
          delete currentObj[prop];
        }
      }
    } else {
      delete currentObj[lastKey];
    }
    return newObj; // Return the modified object
  }

  static deleteByJpaths = <P = any>(h: P, jpaths: Jpath[]): P => {
    return h == null ? undefined : jpaths?.reduce((h_, jpath,) => JsonTool.deleteByJpath(h_, jpath,), h);
    // let newObj = {...h};
    // for (const jpath of jpaths){
    //     newObj = JsonTool.deleteByJpath(newObj, jpath);
    // }
    // return newObj;
  }

  static jpath2excluded = <P = any>(h: P, jpath: Jpath): P => {
    const cls = JsonTool;

    if (!ArrayTool.bool(jpath)) {
      return undefined;
    }
    const jedge = jpath?.[0]
    const child_out = cls.jpath2excluded(h?.[jedge], jpath?.slice(1));
    return {
      ...DictTool.keys2excluded(h, [jedge]),
      ...(DictTool.bool(child_out) ? { [jedge]: child_out } : {}),
    }
  }

  static jpaths2excluded = <P = any>(h: P, jpaths: Jpath[]): P => {
    return h == null
      ? undefined
      : jpaths?.reduce((h_, jpath,) => JsonTool.jpath2excluded(h_, jpath,), h);
  }

  static offspring2reduced = <P = any, C = any>(
    obj_in: P,
    jpath: Jpath,
    action: React.SetStateAction<C>,
    // reduce: (node: Object, edge: Jstep, leaf: any,) => any,
  ): P => {
    const self = JsonTool;
    const callname = `JsonTool.offspring2reduced @ ${DateTool.time2iso(new Date())}`;

    // if(!obj_in){ return undefined; }
    if (!ArrayTool.bool(jpath)) { return ReactTool.prev2actioned(action as React.SetStateAction<P>, obj_in); }

    const jstep = jpath[0];
    const child_in = obj_in == null ? undefined : lodash.get(obj_in, jstep); // obj_in might be undefined
    const child_out = self.offspring2reduced(child_in, jpath.slice(1), action);

    const obj_out = (() => {
      if (NumberTool.is_number(jstep)) { return ArrayTool.splice(obj_in as any[], jstep as number, 1, child_out) as P; }
      if (StringTool.is_string(jstep)) { return { ...obj_in, [jstep]: child_out } as P; }
    })()
    return obj_out;
  }

  // static node2deepmapped = <PI, PO, CI, CO>(
  //   p_in: PI,
  //   jpath: Jpath,
  //   transducer: CO | ((c: CI) => CO),
  //   option?:{
  //     ligator?: (node: Object, edge: Jstep, leaf: any,) => any,
  //   }
  // ):PO => {
  //   const cls = JsonTool;
  //   const callname = `JsonTool.node2deepmapped @ ${DateTool.time2iso(new Date())}`;

  //   const ligator = option?.ligator ?? cls.edge2reduced_voplike;

  //   // if terminal
  //   if (!ArrayTool.bool(jpath)) {
  //     return ReactTool.prev2reduced(transducer, p_in as unknown as CI) as unknown as PO;
  //   }

  //   const jstep = jpath[0];
    
  //   const c_in = lodash.get(p_in, jstep); // obj_in might be undefined

  //   // if List
  //   if (ArrayTool.is_array(c_in)) {
  //     const c_out = StringTool.is_string(jpath?.[1])
      
  //     const c_out = c_in.map(cc_in => cls.node2deepmapped(cc_in, jpath.slice(1), transducer, option))
  //   }

  //   // else (if Dict)
  //   if (DictTool.is_dict(c_in)) {
  //     return cls.node2deepmapped(c_in, jpath.slice(1), transducer, option)
  //   }
  // }


  static action2deepaction<CI = any, CO = any, PI = any, PO = any,>(
    action: CO | ((c: CI) => CO),
    jpath: Jpath,
    option?:{
      reducer?: (node: Object, edge: Jstep, leaf: any,) => any,
    }
  ): ((obj: PI) => PO) {
    const reducer = option?.reducer ?? JsonTool.edge2reduced_voplike;
    return (obj: PI) => JsonTool.reduceUp<PI, PO, CI, CO>(obj, jpath, action, reducer);
  }

  static reduceUp<PI = any, PO = any, CI = any, CO = any>(
    obj_in: PI,
    jpath: Jpath,
    // value: any,
    action: CO | ((c: CI) => CO),
    reducer: (node: Object, edge: Jstep, leaf: any,) => any,
  ) {
    const cls = JsonTool;
    const callname = `JsonTool.reduceUp @ ${DateTool.time2iso(new Date())}`;

    // if(!obj_in){ return undefined; }
    if (!ArrayTool.bool(jpath)) {
      return ReactTool.prev2reduced(action, obj_in as unknown as CI) as unknown as PO;
      // return value;
    }

    const jstep = jpath[0];
    const child_in = lodash.get(obj_in, jstep); // obj_in might be undefined
    const child_out = cls.reduceUp(child_in, jpath.slice(1), action, reducer);

    // console.log({callname, child_in, child_out});

    const obj_out = reducer(obj_in, jstep, child_out);
    return obj_out as PO;
  }

  static node2deepactioned = <CI, CO, PI, PO,>(
    p: PI,
    jpath: Jpath,
    action: Parameters<typeof JsonTool.action2deepaction>[0],
    option?: Lastparam<typeof JsonTool.action2deepaction>,
  ):PO => JsonTool.action2deepaction(action, jpath, option)(p)

  // static jdoc2nullexcluded = TraversileTool.validator2pruner(x => x!=null);
  // static jdoc2nullexcluded(jdoc_in: any) {
  //     const callname = `JsonTool.jdoc2nullexcluded @ ${DateTool.time2iso(new Date())}`;

  //     const merger = TraversileTool.merger_nullexcluded;
  //     const f = TraversileTool.f_leaf2f_tree(x => x, { merger });
  //     const jdoc_out = f(jdoc_in);

  //     // console.log({callname, jdoc_in, jdoc_out});
  //     return jdoc_out;
  // }

  static keys2reduced(jdoc_in: any, key2mapped: (k: string) => string) {
    const cls = JsonTool;

    if (ArrayTool.is_array(jdoc_in)) {
      return jdoc_in.map(jdoc_child => cls.keys2reduced(jdoc_child, key2mapped))
    }

    if (DictTool.is_dict(jdoc_in)) {
      return Object.entries(jdoc_in).reduce((h, [k_in, v]) => {
        const k_out = key2mapped(k_in);
        h[k_out] = cls.keys2reduced(v, key2mapped);
        return h;
      }, {});
    }
    return jdoc_in;
  }

  static jpath2is_equal = CmpTool.f_key2f_eq(XpathTool.jpath2xpath);
}
