import { CSSProperties } from "react";
import CssTool from "../html/CssTool";

export class CakeaholicSwiper{
  static cssprop_navibutton_shadow = ():CSSProperties => {
    return {
      textShadow: '0 0 2px white, 1px 1px 2px #666',
    };
  }

  static cssprop_navibutton = ():CSSProperties => {
    return {
      "--swiper-navigation-color": "#000",
      "--swiper-navigation-size": "25px",
    } as CSSProperties
  }
}