import { TextFieldProps } from "@mui/material";
import TraversileTool from "../../traversile/traversile_tool";
import JsonTool from "../../collection/dict/json/json_tool";
import DictTool from "../../collection/dict/dict_tool";
import ArrayTool from "../../collection/array/array_tool";

export default class MaterialuiTool {
  //   static textfieldprops2cleaned = (props:TextFieldProps):TextFieldProps => {

  //     const x2is_valid = TraversileTool.bool;
  //     const pruner_default = TraversileTool.validator2pruner<TextFieldProps>(x2is_valid);
  //     const pruner = (v_in: TextFieldProps): TextFieldProps => {
  //         if (ArrayTool.is_array(v_in)) {
  //             return (v_in as any[])?.map(pruner)?.filter(x2is_valid) as V;
  //         } else if (DictTool.is_dict(v_in)) {
  //             return Object.keys(v_in).reduce((h, k) => {
  //             const c_in = v_in?.[k];
  //             const c_out = pruner(c_in);
  //             return !x2is_valid(c_out) ? h : { ...h, [k]: c_out };
  //             }, {}) as V;
  //         } else {
  //             return v_in;
  //         }
  //       };

  //     return {
  //     //   ...JsonTool.jpaths2filtered(props, [["ref"]]),
  //       ...TraversileTool.validatorpair2pruner<TextFieldProps>({
  //         list:TraversileTool.bool,
  //         dict:(h,k) => k === 'ref' ? true : TraversileTool.bool(h),
  //     })(props),
  //     };
  //   }

  static textfieldprops2cleaned = TraversileTool.validatorpair2pruner<TextFieldProps>({
    list: TraversileTool.bool,
    dict: (h, k) => (ArrayTool.in(k, ["ref", "value",]) ? true : TraversileTool.bool(h)),
  });
}