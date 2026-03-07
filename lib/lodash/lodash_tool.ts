import lodash from "lodash";
import CmpTool, { BicmpTool } from "../cmp/CmpTool";
import JsonTool, { Jpath } from "../collection/dict/json/json_tool";

export default class LodashTool{
  static omit_deep<V=any>(v:V, jpaths:Jpath[]):V{

    const omit_one = (v:V, jpath:Jpath) => JsonTool.reduceUp(v, jpath, undefined, JsonTool.reducer2delete_if_empty(JsonTool.edge2reduced_ooplike));
    return jpaths.reduce((x, jpath) => omit_one(x, jpath), v)
  }

  static union = <T>(arrays: Array<T[] | null | undefined>) => {
    return arrays == null ? undefined : lodash.union<T>(...arrays);
  }

  static isEqualPassfast = BicmpTool.f_bicmps2f_bicmp_some([CmpTool.pair2eq_trinative, lodash.isEqual]);
}
