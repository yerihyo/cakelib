import React from 'react';
import CacheTool from '../cache/cache_tool';
import CmpTool from '../cmp/CmpTool';
import ArrayTool from '../collection/array/array_tool';
import { AbsoluteOrder } from '../collection/array/minimax_tool';
import DateTool from '../date/date_tool';

export class Gridsizeinfo{
  index:number;
  name:string;
  minwidth_screen?:number;
  width_container?:number;

  static XS:Gridsizeinfo = { index:0, name:'XS', };
  static SM:Gridsizeinfo = { index:1, name:'SM', minwidth_screen:576, width_container:540, };
  static MD:Gridsizeinfo = { index:2, name:'MD', minwidth_screen:768, width_container:720, };
  static LG:Gridsizeinfo = { index:3, name:'LG', minwidth_screen:992, width_container:960, };
  static XL:Gridsizeinfo = { index:4, name:'XL', minwidth_screen:1200, width_container:1140, };
  static XXL:Gridsizeinfo = { index:5, name:'XXL', minwidth_screen:1400, width_container:1320, };

  static list():Gridsizeinfo[]{
    const cls = Gridsizeinfo;
    return [cls.XS, cls.SM, cls.MD, cls.LG, cls.XL, cls.XXL];
  }

  static dict_name2info = CacheTool.memo_one(():Record<string,Gridsizeinfo> => {
    const cls = Gridsizeinfo;
    return ArrayTool.array2dict(cls.list(), x=> x.name);
  });

  static name2info(name:string):Gridsizeinfo{
    const cls = Gridsizeinfo;
    return cls.dict_name2info()?.[name];
  }
}
export class Gridsize{
  static XS = Gridsizeinfo.XS.name;
  static SM = Gridsizeinfo.SM.name;
  static MD = Gridsizeinfo.MD.name;
  static LG = Gridsizeinfo.LG.name;
  static XL = Gridsizeinfo.XL.name;
  static XXL = Gridsizeinfo.XXL.name;

  static pair2cmp = CmpTool.f_key2f_cmp(
    (s:string) => Gridsizeinfo.name2info(s).index
  );

  static gte = CmpTool.f_cmp2f_gte(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static gt = CmpTool.f_cmp2f_gt(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static lte = CmpTool.f_cmp2f_lte(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));
  static lt = CmpTool.f_cmp2f_lt(AbsoluteOrder.f_cmp2f_cmp_nullable(Gridsize.pair2cmp));

  static window2gridsize(): string{
    const cls = Gridsize;
    const callname = `Gridsize.window2gridsize @ ${DateTool.time2iso(new Date())}`;

    // console.log({
    //   callname,
    //   'window.innerWidth': window?.innerWidth,
    //   'document.body.scrollWidth': document.body.scrollWidth,
    //   'document.documentElement.scrollWidth': document.documentElement.scrollWidth,
    //   'document.body.offsetWidth': document.body.offsetWidth,
    //   'document.documentElement.offsetWidth': document.documentElement.offsetWidth,
    //   'document.documentElement.clientWidth': document.documentElement.clientWidth,
    // });

    // const width = window.innerWidth;
    const screenwidth = Math.min(...[
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth,
    ].filter(x => x != null))

    if(!screenwidth){ return undefined; }
    if (screenwidth < Gridsizeinfo.SM.minwidth_screen) { return cls.XS; }
    if (screenwidth < Gridsizeinfo.MD.minwidth_screen) { return cls.SM; }
    if (screenwidth < Gridsizeinfo.LG.minwidth_screen) { return cls.MD; }
    if (screenwidth < Gridsizeinfo.XL.minwidth_screen) { return cls.LG; }
    if (screenwidth < Gridsizeinfo.XXL.minwidth_screen) { return cls.XL; }
    if (screenwidth >= Gridsizeinfo.XXL.minwidth_screen) { return cls.XXL; }

    throw new Error(`screenwidth: ${screenwidth}`);
  }

    /**
   * https://stackoverflow.com/a/66828111
   */
  static useGridsize = (): string  => {
    const cls = Gridsize;
    const callname = `Gridsize.useGridsize @ ${DateTool.time2iso(new Date())}`;

    const [gridsize, setGridsize] = React.useState<string>();

    const handle_resize = () => {
      const gridsize = cls.window2gridsize();
      // console.log({callname, gridsize});
      setGridsize(gridsize);
    };

    React.useEffect(() => {
      window.addEventListener("resize", handle_resize);
      handle_resize();
    }, []);
    

    // console.log({callname, gridsize});

    return gridsize;
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
    return Pagelayout.gridsize_pivot2layout(gridsize, Gridsize.MD);
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
