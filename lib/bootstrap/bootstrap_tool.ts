import React from 'react';
import CacheTool from '../cache/cache_tool';
import CmpTool from '../cmp/CmpTool';
import ArrayTool from '../collection/array/array_tool';
import { AbsoluteOrder } from '../collection/array/minimax_tool';
import DateTool from '../date/date_tool';
import { WindowTool } from '../html/ComponentTool';

export class Gridsize{
  // index:number;
  value:string;
  minwidth_screen?:number;
  width_container?:number;

  static XS:Gridsize = { value:'XS', };
  static SM:Gridsize = { value:'SM', minwidth_screen:576, width_container:540, };
  static MD:Gridsize = { value:'MD', minwidth_screen:768, width_container:720, };
  static LG:Gridsize = { value:'LG', minwidth_screen:992, width_container:960, };
  static XL:Gridsize = { value:'XL', minwidth_screen:1200, width_container:1140, };
  static XXL:Gridsize = { value:'XXL', minwidth_screen:1400, width_container:1320, };

  static list():Gridsize[]{
    const cls = Gridsize;
    return [cls.XS, cls.SM, cls.MD, cls.LG, cls.XL, cls.XXL];
  }

  static dict_value2obj = CacheTool.memo_one(
    ():Record<string,Gridsize> => ArrayTool.array2dict(Gridsize.list(), x=> x.value)
  );
  static value2info = (v:string):Gridsize => Gridsize.dict_value2obj()?.[v];

  static dict_value2index = CacheTool.memo_one(
    ():Record<string,number> => ArrayTool.array2dict_item2index(Gridsize.list().map(x => x.value))
  );
  static value2index = (v:string) => Gridsize.dict_value2index()?.[v];

  static pair2cmp = CmpTool.f_key2f_cmp((v:string) => Gridsize.value2index(v));

  static gte = CmpTool.f_cmp2f_gte(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static gt = CmpTool.f_cmp2f_gt(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static lte = CmpTool.f_cmp2f_lte(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static lt = CmpTool.f_cmp2f_lt(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));

  static useScreenwidth = (): number  => {
    const cls = Gridsize;
    const callname = `Gridsize.useScreenwidth @ ${DateTool.time2iso(new Date())}`;

    const screenwidth_hook = React.useState<number>();

    const handle_resize = () => {
      const screenwidth = Math.min(...[
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth,
      ].filter(x => x != null));

      screenwidth_hook[1](screenwidth);
    };

    React.useEffect(() => {
      window.addEventListener("resize", handle_resize);
      handle_resize();
    }, []);
    

    // console.log({callname, gridsize});

    return screenwidth_hook[0];
  }

  static screenwidth2gridsize(width:number): string{
    const cls = Gridsize;
    const callname = `Gridsize.screenwidth2gridsize @ ${DateTool.time2iso(new Date())}`;

    if(!width) return undefined;
    if (width < Gridsize.SM.minwidth_screen) return cls.XS.value; 
    if (width < Gridsize.MD.minwidth_screen) return cls.SM.value;
    if (width < Gridsize.LG.minwidth_screen) return cls.MD.value;
    if (width < Gridsize.XL.minwidth_screen) return cls.LG.value;
    if (width < Gridsize.XXL.minwidth_screen) return cls.XL.value;
    if (width >= Gridsize.XXL.minwidth_screen) return cls.XXL.value;

    throw new Error(`screenwidth: ${width}`);
  }

  static containerwidth2gridsize(width:number): string{
    const cls = Gridsize;
    const callname = `Gridsize.screenwidth2gridsize @ ${DateTool.time2iso(new Date())}`;

    if(!width) return undefined;
    if (width < Gridsize.SM.width_container) return cls.XS.value; 
    if (width < Gridsize.MD.width_container) return cls.SM.value;
    if (width < Gridsize.LG.width_container) return cls.MD.value;
    if (width < Gridsize.XL.width_container) return cls.LG.value;
    if (width < Gridsize.XXL.width_container) return cls.XL.value;
    if (width >= Gridsize.XXL.width_container) return cls.XXL.value;

    throw new Error(`width: ${width}`);
  }

  /**
   * https://stackoverflow.com/a/66828111
   */
  static useGridsize = (): string  => {
    const cls = Gridsize;
    const callname = `Gridsize.useGridsize @ ${DateTool.time2iso(new Date())}`;

    const screenwidth = cls.useScreenwidth();
    return cls.screenwidth2gridsize(screenwidth);
  }
}

export type Layoutinfo = {
  gridsize:string;
  pivot:string;
  pagelayout: string;
  is_mobile: boolean;
  is_desktop: boolean;
}

export class Pagelayout{
  static MOBILE = 'MOBILE';
  static DESKTOP = 'DESKTOP';

  static gridsize2layout(gridsize:string):string{
    return Pagelayout.gridsize_pivot2layout(gridsize, Gridsize.MD.value);
  }

  static gridsize_pivot2layout(gridsize:string, pivot:string):string{
    if(gridsize==null){ return undefined; }
    if(Gridsize.lt(gridsize, pivot)){ return Pagelayout.MOBILE; }
    if (Gridsize.gte(gridsize, pivot)) { return Pagelayout.DESKTOP; }
    throw new Error(`gridsize: ${gridsize}`);
  }

  static gridsize_pivot2layout_info = (
    gridsize: string,
    pivot_desktop: string,
  ): Layoutinfo => {
    const cls = Pagelayout;
    const pagelayout: string = cls.gridsize_pivot2layout(gridsize, pivot_desktop);
    return pagelayout == null
      ? {} as Layoutinfo
      : {
        pivot: pivot_desktop,
        gridsize,
        pagelayout,
        is_mobile: pagelayout === cls.MOBILE,
        is_desktop: pagelayout === cls.DESKTOP,
      }
      ;
  }

  static layout2bools(layout: string): boolean[] {
    const cls = Pagelayout;

    return [
      layout === cls.DESKTOP,
      layout === cls.MOBILE,
    ]
  }
}

// export class Windowinfo{
//   pagelayout:string;
//   window: ReturnType<typeof WindowTool.window_hook>[0];

//   static use_windowinfo = ():Windowinfo => {
//     const { pagelayout, } = Pagelayout.gridsize_pivot2layout_info(Gridsize.useGridsize(), Gridsize.MD.value);
//     const window_hook = WindowTool.window_hook();
//     return { pagelayout, window: window_hook[0] };
//   }
// }

export default class BootstrapTool{
  // REFERNCE: https://stackoverflow.com/a/55649820
  static vw2margin_container = (vw:number):number => {
    if(vw>=1200){ return vw/2 - 585; } // 600-15
    if(vw>=992){ return vw/2 - 485; } // 500-15
    if(vw>=768){ return vw/2 - 375; } // 390-15
    return 0;
  }
}
