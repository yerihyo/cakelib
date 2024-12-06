import {disassemble, isVowel} from 'hangul-js';

import ArrayTool from '../collection/array/array_tool';

export default class HangulTool{
  static choseungs2wisp(choseungs:string):string{
    const operations = [
      (s:string) => s.replace(/ㄱㄱ/g, "ㄲ"),
      (s:string) => s.replace(/ㄷㄷ/g, "ㄸ"),
      (s:string) => s.replace(/ㅂㅂ/g, "ㅃ"),
      (s:string) => s.replace(/ㅅㅅ/g, "ㅆ"),
      (s:string) => s.replace(/ㅈㅈ/g, "ㅉ"),
    ];
    const wisp = operations.reduce((s, op) => op(s), choseungs);
    return wisp === choseungs ? undefined : wisp;
  }

  static text2is_vowelending = (text:string):boolean => {
    const jamo_last = ArrayTool.last(disassemble(text));
    return isVowel(jamo_last);
  }

  static text2eun_added = (text:string):string => {
    const cls = HangulTool;
    if(text == null){ return undefined; }

    return cls.text2is_vowelending(text) ? `${text}는` : `${text}은`
  }

  static text2ga_added = (text:string):string => {
    const cls = HangulTool;
    if(text == null){ return undefined; }

    return cls.text2is_vowelending(text) ? `${text}가` : `${text}이`
  }


  static text2ro_added(text:string):string{
    if(text == null){ return undefined; }
    
    const jamo_last = ArrayTool.last(disassemble(text));
    const is_ro = isVowel(jamo_last) || jamo_last == 'ㄹ';
    return is_ro ? `${text}로` : `${text}으로`;
  }
}
export class HangulRomanization{
  static jamos():{romaja:string,jamo:string}[]{
    return [
      {jamo:'ㅏ', romaja:'a', },
      {jamo:'ㅑ', romaja:'ya', },
      {jamo:'ㅓ', romaja:'eo', },
      {jamo:'ㅕ', romaja:'yeo', },
      {jamo:'ㅗ', romaja:'o', },
      {jamo:'ㅛ', romaja:'yo', },
      {jamo:'ㅜ', romaja:'u', },
      {jamo:'ㅠ', romaja:'yu', },
      {jamo:'ㅡ', romaja:'eu', },
      {jamo:'ㅣ', romaja:'i', },
      {jamo:'ㅐ', romaja:'ae', },
      {jamo:'ㅒ', romaja:'yae', },
      {jamo:'ㅔ', romaja:'e', },
      {jamo:'ㅖ', romaja:'ye', },
      {jamo:'ㅚ', romaja:'oe', },
      {jamo:'ㅟ', romaja:'wi', },
      {jamo:'ㅢ', romaja:'ui', },
      {jamo:'ㅘ', romaja:'wa', },
      {jamo:'ㅝ', romaja:'wo', },
      {jamo:'ㅙ', romaja:'wae', },
      {jamo:'ㅞ', romaja:'we', },
    ]
  }

  // static romajas2hangul(text_in:string):string{
  //   const romajas = text_in.split('');
  //   return Hangul.assemble(jamos);
  // }
}
