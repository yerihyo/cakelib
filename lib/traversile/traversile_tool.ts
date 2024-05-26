import ArrayTool from "../collection/array/array_tool"
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";

export default class TraversileTool{
  static func2traversile(
    reducer: (k: any) => any,
    options?:{
      merger?: (x:any) => any,
    },
  ): ((x: any) => any) {
    // if target_types is None:
    //     target_types = {dict, list, set, tuple}

    const {merger:merger_in} = options || {};
    const merger = merger_in ?? (x => x);

    const traversiled = (x) => {
      const reduced = (() => {
        if (ArrayTool.is_array(x)) {
          return x.map(traversiled);
        }
        if (DictTool.is_dict(x)) {
          return Object.keys(x).reduce((z, k) => ({ ...z, [k]: traversiled(x[k]) }), {});
        }
        return reducer(x);
      })();
      
      return merger(reduced);
    }

    
    return traversiled
  }

  static validator2merger(
    v2is_valid: (v:any) => boolean,
  ){
    return (v) => {
      if (Array.isArray(v)) {
        const v_out = v.filter(v2is_valid);
        return ArrayTool.bool(v_out) ? v_out : undefined;
      }
      if (DictTool.is_dict(v)) {
        const v_out = Object.keys(v).reduce((z, k) => ({ ...z, ...(v2is_valid(v[k]) ? { [k]: v[k] } : {})}), {});
        return DictTool.bool(v_out) ? v_out : undefined;
      }
      return v;
    }
  }

  static merger_nullexcluded(v:any){
    return TraversileTool.validator2merger(x => x!=null)(v);
  }
}