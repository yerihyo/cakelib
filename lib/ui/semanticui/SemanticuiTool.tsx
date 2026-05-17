import React from "react";
import { CSSProperties } from "react";
import HookTool, { Hookcodec, Reacthook } from "../../react/hook/hook_tool";
import DateTool from "../../date/date_tool";

export default class SemanticuiTool{
  static Button = class {
    static style_none(): CSSProperties {
      return {
        boxShadow: 'none',
        padding: 0,
      }
    }
  }

  static CodecedInput = (props:{
    hook: Reacthook<string>,
    hookcodec: Hookcodec<string,string>,
    // hookcodec: Hookcodec<T,string>,
    [k: string]: any,  // https://stackoverflow.com/a/50288327/1902064
  }) => {
    const callname = `SemanticuiTool.CodecedInput @ ${DateTool.time2iso(new Date())}`;

    const {hook:exhook, hookcodec, option, ...rest} = props;

    const [exvalue, set_exvalue] = HookTool.hook2codeced(exhook, hookcodec);

    const inhook = React.useState<string>();
    const [invalue, set_invalue] = inhook;

    // console.log({callname, exvalue});
    React.useEffect(() => { set_invalue(exvalue); }, [exvalue]);
    
    return (
      <input
        type='text'
        value={invalue ?? ''}
        onChange={(e) => { set_invalue(e.target.value); }}
        onBlur={() => {
          HookTool.setter2codeced(set_invalue, hookcodec)(invalue);
          set_exvalue(invalue);
        }}
        {...(rest ?? {})}
        style={{
          width: '5ch', textAlign: 'right',
          border: 'none', outline: 'none', backgroundColor: 'transparent',
          ...(rest?.style ?? {}),
        }}
      />
    )
  }
}

export class SemanticuiSegment{
  static cssprop_boxshadow = ():CSSProperties => ({
    boxShadow:'0 1px 2px 0 rgba(34,36,38,.15)', 
  })
  static cssprop_borderradius = ():CSSProperties => ({
    borderRadius: '.3em',
  })

  static cssprop_border = ():CSSProperties => ({
    border: '1px solid rgba(34,36,38,.15)',
    ...SemanticuiSegment.cssprop_borderradius(),
  })
}

export class SemanticuiModal{
  static cssprop_center = ():CSSProperties => ({top:'auto', left:'auto', height:'auto',});
}