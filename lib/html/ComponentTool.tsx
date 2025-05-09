import React, { MutableRefObject } from 'react';
import DictTool from '../collection/dict/dict_tool';
import DateTool from '../date/date_tool';
import NativeTool from '../native/native_tool';
import MathTool from '../number/math/math_tool';
import { Reacthook } from '../react/hook/hook_tool';

export default class ComponentTool {
  static useBound = (props: { containerRef: MutableRefObject<HTMLElement> }): { height: number, width: number } => {
    const { containerRef } = props;

    const [bound, setBound] = React.useState({ height: null, width: null });
    // const ratio = width / b.w;

    const getWidth = () => {
      if (NativeTool.is_null_or_undefined(containerRef.current)) { return undefined; }
      return containerRef.current.offsetWidth;
    };

    const getHeight = () => {
      if (NativeTool.is_null_or_undefined(containerRef.current)) { return undefined; }
      return containerRef.current.clientHeight;
    };

    const updateBound = () => {
      const [width, height] = [getWidth(), getHeight()];
      // console.log({"msg":"updateBound", 'containerRef.current':containerRef.current, width, height, containerRef});

      if (NativeTool.is_null_or_undefined(width)) { return; }
      if (NativeTool.is_null_or_undefined(height)) { return; }
      setBound({ width, height });
    };

    React.useEffect(() => { updateBound(); }, [containerRef.current]);
    React.useEffect(() => {
      window.addEventListener('resize', updateBound);
      return () => { window.removeEventListener('resize', updateBound); }
    }, []);

    return bound;
  }

  static detect_horizontal_scroll = (ref: MutableRefObject<HTMLElement>) => {
    // const {ref} = props;

    const [hscroll, setHscroll] = React.useState(false);
    // const ratio = width / b.w;

    const resize = () => {
      if (!ref.current) { return; }

      // console.log({
      //     'ref.current.scrollWidth':ref.current.scrollWidth,
      //     'ref.current.offsetWidth':ref.current.offsetWidth,
      //     'ref.current.clientWidth':ref.current.clientWidth,
      // });

      // ref.current.style.minHeight = `${window.innerHeight - ref.current.offsetTop}px`;
      // setHscroll(x => x+1);
    };

    React.useEffect(() => { resize(); }, [ref.current]);
    React.useEffect(() => {
      window.addEventListener('resize', resize);
      return () => { window.removeEventListener('resize', resize); }
    }, []);
  }

  static growToBottom = <T extends HTMLElement=HTMLElement,>(ref: MutableRefObject<T>):MutableRefObject<T> => {
    // const {ref} = props;

    const [version, setVersion] = React.useState(1);
    // const ratio = width / b.w;

    const resize = () => {
      if (!ref.current) { return; }

      // console.log({
      //     'ref.current.clientHeight':ref.current.clientHeight,
      //     'window.innerHeight':window.innerHeight,
      //     'ref.current.offsetTop':ref.current.offsetTop,
      // });

      ref.current.style.minHeight = `${window.innerHeight - ref.current.offsetTop}px`;
      setVersion(x => x + 1);
    };

    React.useEffect(() => { resize(); }, [ref.current]);
    React.useEffect(() => { setTimeout(resize, 500); }, []); // redo this. just in case
    React.useEffect(() => {
      window.addEventListener('resize', resize);
      return () => { window.removeEventListener('resize', resize); }
    }, []);
    
    return ref;
  }

  static Scrollinfo = class {
    is_scrollable_left: boolean;
    is_scrollable_right: boolean;
    scrollLeft: number;
    offsetWidth: number;
    scrollWidth: number;
    leftscrollMax: number;
    rightscrollMax: number;

    static container2info = (element: HTMLElement): (typeof ComponentTool.Scrollinfo.prototype) => {
      const cls = ComponentTool;
      const callname = `ComponentTool.container2endofscrolls @ ${DateTool.time2iso(new Date())}`;

      // const outer = ref.current;

      // console.log({
      //     callname,
      //     'element.scrollLeft':element.scrollLeft,
      //     'element.offsetWidth':element.offsetWidth,
      //     'element.scrollWidth':element.scrollWidth,
      // })
      const leftscrollMax = element.scrollLeft;
      const rightscrollMax = element.scrollWidth - (element.offsetWidth + element.scrollLeft);
      return {
        is_scrollable_left: element.scrollLeft > 0,
        is_scrollable_right: (element.offsetWidth + element.scrollLeft < element.scrollWidth),
        scrollLeft: element.scrollLeft,
        offsetWidth: element.offsetWidth,
        scrollWidth: element.scrollWidth,
        leftscrollMax,
        rightscrollMax,
      };
    }

    static use_info = (ref: MutableRefObject<HTMLElement>): (typeof ComponentTool.Scrollinfo.prototype) => {
      const cls = ComponentTool.Scrollinfo;
      const callname = `ComponentTool.Scrollinfo.use_info @ ${DateTool.time2iso(new Date())}`;


      const [info, set_info] = React.useState<(typeof ComponentTool.Scrollinfo.prototype)>();

      React.useEffect(() => {
        if (!ref.current) { return; }

        set_info(cls.container2info(ref.current));

        ref.current!.addEventListener("scroll", function (e) {
          // console.log({
          //     callname,
          //     'ref.current==e.currentTarget':ref.current==e.currentTarget,
          //     'ref.current': ref.current,
          //     'e.currentTarget': e.currentTarget,
          // });
          set_info(cls.container2info(ref.current));
        });
      }, [ref.current == null]);

      // console.log({callname, endofscrolls});

      return info;
    }
  }

  static scrollTo(element: HTMLElement, scrollTo: { top?: number, left?: number }, callback: () => void) {

    const scrollToFixed = {
      ...(scrollTo.left != null ? { left: scrollTo.left.toFixed() } : {}),
      ...(scrollTo.top != null ? { top: scrollTo.top.toFixed() } : {}),
    }
    // const fixedOffset = offset.toFixed();
    const onScroll = function () {
      const { left: leftFixed, top: topFixed } = scrollToFixed;

      const is_done = (() => {
        if (leftFixed != null) {
          if (element.offsetLeft.toFixed() !== leftFixed) { return false; }
        }

        if (topFixed != null) {
          if (element.offsetTop.toFixed() !== topFixed) { return false; }
        }
        return true;

      })();

      if (is_done) {
        element.removeEventListener('scroll', onScroll)
        callback()
      }
    }

    element.addEventListener('scroll', onScroll)
    onScroll()
    element.scrollTo({ ...scrollTo, });
  }

  static useWindowsize = (): { width: number, height: number } => {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = React.useState<{ width: number, height: number }>({
      width: undefined,
      height: undefined,
    });
    React.useEffect(() => {

      // Handler to call on window resize
      function handleResize() {
        // Set window width/height to state
        setWindowSize(window_prev => ({
          ...window_prev,
          width: window.innerWidth,
          height: window.innerHeight,
        }));
      }
      // Add event listener
      window.addEventListener("resize", handleResize);
      // Call handler right away so state gets updated with initial window size
      handleResize();


      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
  }

}

export class WindowTool{
  static window2top = (w:Window):number => { return w.scrollY || document.documentElement.scrollTop; };

  static scrollY_eqzero = () => MathTool.eq(window.scrollY,0);

  static element2top_tight = (element:HTMLElement):number => {
    if(!element){ return ; }

    // const yOffset = -10;
    const y = element.getBoundingClientRect().top + window.scrollY
    return y;
  }

  static bufferpx_natural = ():number => 10;
  // static element2top_natural = (
  //   element:HTMLElement,
  //   option?:{
  //     bufferpx?:number
  //   }
  // ) => {
  //   const cls = WindowTool;
  //   if(!element){ return ; }

  //   const bufferpx = option?.bufferpx ?? cls.bufferpx_scroll_default();
  //   return WindowTool.element2top_tight(element)-bufferpx;
  // }

  // static is_backnavigated = ():boolean => {
  //   const callname = `WindowTool.is_backnavigated @ ${DateTool.time2iso(new Date())}`;

  //   const navtimings = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  //   // const types = navtimings.map( navtiming => navtiming.type );
  //   // console.log({callname, types});
  //   return navtimings.some( navtiming => navtiming.type === 'back_forward');
  // }

  // static fields_value = () => [
  //   'closed', 'innerHeight', 'innerWidth', 'length',
  //   'screenLeft', 'screenTop', 'screenX', 'screenY', 'scrollX', 'scrollY',
  // ];
  static window_hook = (): Reacthook<Window> => {
    const cls = WindowTool;
    const callname = `WindowTool.window_hook @ ${DateTool.time2iso(new Date())}`;

    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const window_hook = React.useState<ReturnType<typeof WindowTool.window_hook>[0]>();
    const handle = () => {
      // console.log({callname, window, 'window?.scrollY':window?.scrollY})
      window_hook[1](DictTool.dict2valuetypeonly<Window>(window));
    }

    React.useEffect(() => {
      handle();
      // Handler to call on window resize
      
      // Add event listener
      window.addEventListener("resize", handle);
      window.addEventListener("scroll", handle);

      // Remove event listener on cleanup
      return () => {
        window.removeEventListener("resize", handle);
        window.removeEventListener("scroll", handle);
      }
    }, []); // Empty array ensures that effect is only run on mount
    return window_hook;
  }

  static use_scrollyzero = ():boolean => {
    const hook = React.useState<boolean>();
    const handle = () => hook[1](MathTool.eq(window?.scrollY, 0));
    
    React.useEffect(() => {
      handle();
      // Handler to call on window resize
      
      // Add event listener
      window.addEventListener("resize", handle);
      window.addEventListener("scroll", handle);

      // Remove event listener on cleanup
      return () => {
        window.removeEventListener("resize", handle);
        window.removeEventListener("scroll", handle);
      }
    }, []); // Empty array ensures that effect is only run on mount
    return hook[0];
  }
  // static addWindowscrollbarListener = <K extends keyof WindowEventMap>(
  //   // listener: (this: Window, ev: WindowEventMap[K]) => any,
  //   listener: EventListenerOrEventListenerObject,
  //   options?: boolean | AddEventListenerOptions,
  // ) => {
  //   window.addEventListener("resize", listener, options);
  //   window.addEventListener("scroll", listener, options);
  // };
}