import React, { MutableRefObject } from 'react';
import ResizeObserver from "resize-observer-polyfill";
import ArrayTool from '../collection/array/array_tool';
import DateTool from '../date/date_tool';

export default class ResizeObserverPolyfillTool {
  static useDimension = (ref: MutableRefObject<HTMLElement>): DOMRectReadOnly => {
    const callname = `HookTool.useResizeObserver @ ${DateTool.time2iso(new Date())}`;

    //, dimension_init=undefined){
    const dimension_hook = React.useState<DOMRectReadOnly>();

    const ref2is_valid = (ref_:MutableRefObject<HTMLElement>) => {
      if (ref == null) return false;
      if (ref.current == null) return false;
      return true;
    }
    React.useEffect(() => {
      if(!ref2is_valid(ref)) return ;
      
      const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const entry = ArrayTool.l2one(entries);
        dimension_hook[1](entry.contentRect);
      });

      resizeObserver.observe(ref.current);
      return () => {
        if(!ref2is_valid(ref)) return;
        resizeObserver.unobserve(ref.current);
      };
    }, [ref]);

    // console.log({callname, dimension:dimension_hook[0]});
    return dimension_hook[0];
  };
}
