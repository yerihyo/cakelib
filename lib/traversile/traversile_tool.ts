import ArrayTool from "../collection/array/array_tool"
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";

export default class TraversileTool{

  static bool = (x:any):boolean => {
    if(ArrayTool.is_array(x)){ return ArrayTool.bool(x); }
    if(DictTool.is_dict(x)){ return DictTool.bool(x); }
    return x != null;
  }

  static f_leaf2f_tree = <I, O=I>(
    f_leaf: (x: any) => any,
    // options?:{
    //   merger?: (x:any) => any,
    // },
  ): ((v: I) => O) => {
    // if target_types is None:
    //     target_types = {dict, list, set, tuple}

    // const {merger:merger_in} = options || {};
    // const merger = merger_in ?? (x => x);

    const f_tree = (v:I):O => {
      if (ArrayTool.is_array(v)) {
        return (v as any[]).map(f_tree) as O;
      }
      if (DictTool.is_dict(v)) {
        return Object.keys(v).reduce((z, k) => ({ ...z, [k]: f_tree(v[k]) }), {}) as O;
      }
      return f_leaf(v);
    }
    return f_tree
  }

  // static validator2merger(
  //   v2is_valid: (v:any) => boolean,
  // ){
  //   return (v) => {
  //     if (Array.isArray(v)) {
  //       const v_out = v.filter(v2is_valid);
  //       return ArrayTool.bool(v_out) ? v_out : undefined;
  //     }
  //     if (DictTool.is_dict(v)) {
  //       const v_out = Object.keys(v).reduce((z, k) => ({ ...z, ...(v2is_valid(v[k]) ? { [k]: v[k] } : {})}), {});
  //       return DictTool.bool(v_out) ? v_out : undefined;
  //     }
  //     return v;
  //   }
  // }

  // static merger_nullexcluded(v:any){
  //   return TraversileTool.validator2merger(x => x!=null)(v);
  // }

  static validatorpair2pruner = <V>(
    validator:{
      dict:(x:any, k?:(string), p?:any) => boolean,
      list:(x:any, i?:number, l?:any[]) => boolean,
    },
  ):((v:V)=>V) => {

    const pruner = (v_in: V): V => {
      if (ArrayTool.is_array(v_in)) {
        return (v_in as any[])?.map(pruner)?.filter(validator.list) as V;
      } else if (DictTool.is_dict(v_in)) {
        return Object.keys(v_in).reduce((h, k) => {
          const c_in = v_in?.[k];
          const c_out = pruner(c_in);
          return !validator.dict(c_out, k, v_in) ? h : { ...h, [k]: c_out };
        }, {}) as V;
      } else {
        return v_in;
      }
    };

    return pruner;
  }

  static validator2pruner = <V>(x2is_valid: (x:any) => boolean,):((v:V)=>V) => TraversileTool.validatorpair2pruner({dict:x2is_valid, list:x2is_valid});
}