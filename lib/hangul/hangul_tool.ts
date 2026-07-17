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


  /** 숫자 1자리의 한국어 읽기. (0 은 '영'/'공' 둘 다 ㅇ받침이라 조사 판정 결과 동일) */
  static DIGIT2TEXT:{[k:string]:string} = {
    '0':'영', '1':'일', '2':'이', '3':'삼', '4':'사',
    '5':'오', '6':'육', '7':'칠', '8':'팔', '9':'구',
  };

  /** 숫자를 자릿수별 읽기로 치환 — "1530" → "일오삼영". 숫자가 아닌 문자는 그대로 통과.
   *  수 읽기('천오백삼십')가 아니라 전화번호/식별번호처럼 한 자리씩 읽는 방식.
   *  조사 판정(text2ro_suffix 등)은 한글 기준이라, 숫자로 끝나는 텍스트는 이걸 통과시켜 넘긴다. */
  static digits2text = (text:string):string => {
    if(text == null){ return undefined; }

    return (text.split('') as string[])
      .map((char) => HangulTool.DIGIT2TEXT[char] ?? char)
      .join('');
  }

  /** '로' / '으로' 중 붙일 조사만 반환. 받침 없음 또는 ㄹ받침 → '로', 그 외 → '으로'.
   *  한글 기준 판정 — 숫자로 끝나는 텍스트는 caller 가 digits2text() 로 변환해 넘긴다
   *  (표시용 텍스트와 판정용 텍스트가 다를 수 있어 여기서 임의로 치환하지 않는다). */
  static text2ro_suffix = (text:string):string => {
    if(text == null){ return undefined; }

    const jamo_last = ArrayTool.last(disassemble(text));
    return (isVowel(jamo_last) || jamo_last == 'ㄹ') ? '로' : '으로';
  }

  /** '로/으로' 부착 (한글 텍스트 전용). 표시/판정 텍스트가 다르면 text2ro_suffix 를 직접 쓸 것. */
  static text2ro_added = (text:string):string =>
    text == null ? undefined : `${text}${HangulTool.text2ro_suffix(text)}`;
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
