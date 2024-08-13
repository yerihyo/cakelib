import { kebabCase } from 'lodash';
import { nanoid } from "nanoid";
import { CSSProperties } from "react";
import ArrayTool from "../collection/array/array_tool";
import StringTool from '../string/string_tool';
import { Quad, Triple } from '@submodule/native/native_tool';
// import assert from 'assert';
// const assert = require('assert');

export default class CssTool{
  static px2str = (px:number):string => px== null ? undefined : `${px}px`;

  static rgba2cssvalue(rgba:Triple<number>|Quad<number>):string{
    return `rgba(${rgba.join(', ')})`;
  }

  static rgb2hex(rgb:Triple<number>):string {
    return '#' + rgb.map(c => {
      const hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }).join('');
  }

  static hex2rgb(hex:string):Triple<number>{
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [result[1],result[2],result[3]].map(x => parseInt(x, 16)) as Triple<number> : undefined;
  }

  static width2gridinfo(
    width:number,
    colcount:number,
    colgap:number,
  ):{gridwidth:number, colgap:number, colcount:number, width:number}{
    const gridwidth = (width - colgap*(colcount-1)) / colcount;
    return {gridwidth, colgap, colcount, width};
  }

  static styledict2string = (styledict:CSSProperties) => {
    /**
     * https://stackoverflow.com/a/63772178/1902064
     */
    return Object.keys(styledict).reduce((accumulator, key) => {
      // transform the key from camelCase to kebab-case
      const cssKey = kebabCase(key)
      // remove ' in value
      // const cssValue = styledict[key].replace("'", "");
      const v = styledict[key];
      const cssValue = StringTool.x2is_string(v) ? v.trim().replace(/^['"]/, '').replace(/['"]$/, '') : v
      // build the result
      // you can break the line, add indent for it if you need
      return [accumulator, `${cssKey}:${cssValue};`].join('\n');
    }, '');
  }

  static classname_random():string{
    return nanoid().replace('-','_');
  }
  static css_multiline_ellipsis(linecount:number): CSSProperties {
    // https://stackoverflow.com/a/13924997
    // https://stackoverflow.com/a/41137262
    // const assert = require('assert');
    if(!linecount){ throw new Error(`linecount: ${linecount}`)};

    /**
     * Object.assign() necessary to go around the following typescript error 
     * 
     * Type error: Type '{ display: string; WebkitLineClamp: number; textOverflow: string; overflow: string; WebkitBoxOrient: string; }' is not assignable to type 'CSSProperties'.
     *  Types of property 'WebkitBoxOrient' are incompatible.
     *   Type 'string' is not assignable to type 'BoxOrient'.
     * 
     * Solved using 'as const'
     */
    
    return { 
      display: '-webkit-box',
      WebkitLineClamp: linecount,
      // -webkit-line-clamp: 2,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      WebkitBoxOrient: 'vertical' as const,
      // -webkit-box-orient: 'vertical',
    };
  }
  static textShadow_darkbg = () => [`0 0 .1em #aaa`, `0 0 1em #fff`,].join(',');
  
  static textShadow_universalbackground_white = () => {
    return [
      `0 0 2px #d0d0d0`,
      `0 0 20px #ccc`,
    ].join(',')
  }

  static textShadow_4way(
    color:string,
    width:string,
    option?:{
      blur?:string,
    }
  ) : string {
    const blur = option?.blur ?? 0;

    return ArrayTool.join(',', [
      `${width} ${width} ${blur} ${color}`,
      `${width} -${width} ${blur} ${color}`,
      `-${width} ${width} ${blur} ${color}`,
      `-${width} -${width} ${blur} ${color}`,
    ]);
  }

  static num2percent(v:number){ return `${v*100}%`; }
  static style_w100p_h100p(): CSSProperties { return {width:'100%', height:'100%'}; }

  static style_absolute_center(): CSSProperties { return {position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', }; }

  static wratio2lratio(wratio:number){ return (1 - wratio) / 2; }
}
