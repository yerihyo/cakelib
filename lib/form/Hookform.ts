import React from "react";
import * as Yup from 'yup';
import CmpTool, { Comparator } from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool";
import { Jpath, JpathTool, XpathTool } from "../collection/dict/json/json_tool";
import DateTool from "../date/date_tool";
import HookTool, { Hookcodec, Reacthook } from "../react/hook/hook_tool";
import ReactTool from "../react/react_tool";
import YupTool from "./yup/yup_tool";
import { ValidateOptions } from "yup/lib/types";
import MathTool from "../number/math/math_tool";
import { AbsoluteOrder } from "../collection/array/minimax_tool";
import { WindowTool } from "../html/ComponentTool";
import lodash from 'lodash';

export class Fieldinfo<T extends HTMLElement=HTMLElement>{
  // global:boolean;
  jpath:Jpath; // null means root
  ref:React.MutableRefObject<T>;
  // ms_createdat: number;
  // jpath_hookform:Jpath;

  static isEqual = <T extends HTMLElement=HTMLElement>(f1:Fieldinfo<T>, f2:Fieldinfo<T>):boolean => {
    if(f1===f2){ return true; }
    if(f1 == null || f2 == null){ return undefined; }
    if(!JpathTool.equals(f1?.jpath, f2?.jpath)){ return false; }
    
    return f1?.ref?.current === f2?.ref?.current;
  }

  
  static jpath2hookcodec_down = (
    jpath: Jpath
  ): Hookcodec<Fieldinfo[], Fieldinfo[]> => {

    return HookTool.codecs2piped([
      // should we consider GLOBAL for down
      HookTool.listcodec_filter_n_extend<Fieldinfo>(
        (f: Fieldinfo) => JpathTool.is_prefix(jpath, f.jpath),
        // Fieldinfo.comparator_createdat(),
      ),
      {
        decode: (ps: Fieldinfo[]) => ps
          ?.map(p => ({
            ref: p.ref,
            // ms_createdat: p.ms_createdat,
            jpath: p.jpath == null ? null : JpathTool.jpath2prefix_stemmed(p.jpath, jpath)
          }) as Fieldinfo),
        encode: (cs: Fieldinfo[],) => cs?.map(c => ({
          ref: c.ref,
          // ms_createdat: c.ms_createdat,
          jpath: c.jpath == null ? null : [...jpath, ...(c.jpath ?? [])] ,
        }) as Fieldinfo),
      } as Hookcodec<Fieldinfo[], Fieldinfo[]>,
    ]);
  }

  // /**
  //  * indexes (예: [0, 2, 5]) 의 element 들만 통과시키며 jpath[0] 의 array index 를 압축된 새 인덱스 (0, 1, 2) 로 remap.
  //  * encode 시 새 jpath[0] 를 원본 index 로 복원, 통과 안 한 fieldinfo 는 자동 보존.
  //  * (Hookform.hookform2filtered 에서 활용)
  //  */
  // static indexes2hookcodec_indexed = (
  //   indexes: number[],
  // ): Hookcodec<Fieldinfo[], Fieldinfo[]> => {
  //   const old2new = new Map<number, number>(indexes.map((i_old, i_new) => [i_old, i_new]));

  //   // jpath 가 root (null/[]) 또는 첫 element 가 array index 가 아니면 그대로 통과.
  //   // array index 인 경우만 indexes 기반 filter + remap.
  //   const jpath2idx0 = (jpath: Jpath): number | undefined => {
  //     if (jpath == null) return undefined;
  //     const idx0 = jpath[0];
  //     return typeof idx0 === 'number' ? idx0 : undefined;
  //   };

  //   return HookTool.codecs2piped([
  //     HookTool.listcodec_filter_n_extend<Fieldinfo>((f: Fieldinfo) => {
  //       const idx0 = jpath2idx0(f?.jpath);
  //       return idx0 == null ? true : old2new.has(idx0);
  //     }),
  //     {
  //       decode: (ps: Fieldinfo[]) => ps?.map(p => {
  //         const idx0 = jpath2idx0(p?.jpath);
  //         if (idx0 == null) return p;
  //         return { ref: p.ref, jpath: [old2new.get(idx0), ...p.jpath.slice(1)] } as Fieldinfo;
  //       }),
  //       encode: (cs: Fieldinfo[]) => cs?.map(c => {
  //         const idx0 = jpath2idx0(c?.jpath);
  //         if (idx0 == null) return c;
  //         return { ref: c.ref, jpath: [indexes[idx0], ...c.jpath.slice(1)] } as Fieldinfo;
  //       }),
  //     } as Hookcodec<Fieldinfo[], Fieldinfo[]>,
  //   ]);
  // };

  static fieldinfo2xpath = (fieldinfo:Fieldinfo):string => XpathTool.jpath2xpath(fieldinfo?.jpath);
  static fieldinfos2xpath_comparator = (
    fieldinfos:Fieldinfo[],
  ):Comparator<string> => {
    return ArrayTool.array2indexcomparator(fieldinfos.map(Fieldinfo.fieldinfo2xpath));
  }

  static fieldinfo2upserted = (ps_prev:Fieldinfo[], c_post:Fieldinfo):Fieldinfo[] => {
    const callname = `Fieldinfo.fieldinfo2upserted @ ${DateTool.time2iso(new Date())}`;

    const index_jpathmatching = ps_prev?.findIndex(f => JpathTool.equals(f.jpath, c_post.jpath));
    const has_jpathmatch = MathTool.gte(index_jpathmatching,0)
    
    const is_cpost_null = c_post.ref.current == null;

    if (is_cpost_null) {
      return has_jpathmatch
        ? ArrayTool.splice(ps_prev, index_jpathmatching, 1)
        : ps_prev;
    }

    if(!has_jpathmatch){
      return [...(ps_prev ?? []), c_post];
    }

    const p_prev = ps_prev[index_jpathmatching];
    p_prev.ref.current = c_post.ref.current;
    return ps_prev;
  }
}



export default class Hookform<T>{
  datahook: Reacthook<T>;
  errorshook: Reacthook<Yup.ValidationError[]>;
  fieldinfoshook: Reacthook<Fieldinfo[]>;

  // fieldinfosref: React.MutableRefObject<Fieldinfo[]>
  // schema_validator: <X extends ObjectShape,V>(schema: OptionalObjectSchema<X>, v: V) => Promise<any>;

  static xpaths2codec_filter(
    xpaths: string[],
  ) {
    const cls = Hookform;
    const callname = `Hookform.xpaths2codec_filter @ ${DateTool.time2iso(new Date())}`;

    return HookTool.listcodec_filter_n_extend((p: Yup.ValidationError) => xpaths.some(xpath => p.path?.startsWith(xpath)))
  }

  static xpath2codec_pathprefixremoved(xpath:string){
    return {
      decode: (ps: Yup.ValidationError[]): Yup.ValidationError[] => ps?.map(p => ({...p, path:p.path.substr(xpath.length+1)})),
      encode: (cs_post: Yup.ValidationError[],): Yup.ValidationError[] => cs_post?.map(c => ({...c, path:`${xpath}.${c.path}`})),
    };
  }

  static fieldinfo_upserted2hookform = <T extends HTMLElement=HTMLElement>(
    fieldinfo:Fieldinfo<T>,
    hookform:Hookform<any>,
  ):Fieldinfo<T> => {
    const cls = Fieldinfo;
    const callname = `Fieldinfo.fieldinfo_upserted2hookform @ ${DateTool.time2iso(new Date())}`;

    // console.log({
    //   callname,
    //   xpath_hookform:XpathTool.jpath2xpath(fieldinfo.jpath_hookform),
    //   ms_createdat:fieldinfo.ms_createdat,
    // });
    
    const [fieldinfos, set_fieldinfos] = hookform.fieldinfoshook;

    // console.log({
    //   callname,
    //   jpath:fieldinfo?.jpath,
    //   created_at:DateTool.date2iso(fieldinfo?.created_at),
    // })

    // if(fieldinfo.ref.current == null){ return fieldinfo; }

    const has_match = fieldinfos?.some(f => Fieldinfo.isEqual(f,fieldinfo));
    const is_update_skippable = ArrayTool.any([
      has_match && (fieldinfo.ref.current !=null),
      !has_match && (fieldinfo.ref.current ==null),
    ]);
    
    // console.log({callname, has_match, fieldinfos, fieldinfo});
    if(is_update_skippable){ return fieldinfo; };

    set_fieldinfos(ps_prev => Fieldinfo.fieldinfo2upserted(ps_prev, fieldinfo));
    return fieldinfo;
  }

  static baseref_upserted2hookform = <E extends HTMLElement=HTMLElement,>(
    baseref:React.MutableRefObject<E>,
    hookform:Hookform<any>,
    // jpath_hookform?:Jpath,
  ):React.MutableRefObject<E> => {
    const cls = Hookform;
    const callname = `Hookform.baseref_upserted2hookform @ ${DateTool.time2iso(new Date())}`;

    // const ms_createdat = (new Date())?.getTime();
    const fieldinfo_out = cls.fieldinfo_upserted2hookform({
      ref: baseref,
      jpath: [],
      // ms_createdat,
      // jpath_hookform,
    }, hookform);
    return fieldinfo_out?.ref as React.MutableRefObject<E>;
  }

  static codec_validate<X, O={},>(
    hookform:Hookform<X>,
    // schema: OptionalObjectSchema<ObjectShape>,
    schema: Yup.BaseSchema,
    options:ValidateOptions<O>,
  ){
    const cls = Hookform;
    return HookTool.encoder2codec<X>((c, p_prev) => {
      if (c === p_prev) { return p_prev; }

      schema.validate(c, options).catch(e => { cls.errors2handled(e, hookform); })
        
      return c;
    });
  }

  static hookform2datahook_codeced = <X>(hookform:Hookform<X>, hookcodec:Hookcodec<X,X>,):Hookform<X> => {
    return {
      ...hookform,
      datahook: HookTool.hook2codeced(hookform.datahook, hookcodec)
    }
  }

  static hookform2down = <P,C,>(
    hookform_in: Hookform<P>,
    jpath: Jpath,
    option?: {encoder?: (c:C, p?:P) => P}
  ):Hookform<C> => {
    const cls = Hookform;
    const callname = `Hookform.jpath2fielddata @ ${DateTool.time2iso(new Date())}`;

    return {
      datahook:HookTool.hook2down<P, C>(hookform_in.datahook, jpath, option),
      fieldinfoshook:HookTool.hook2codeced(hookform_in.fieldinfoshook, Fieldinfo.jpath2hookcodec_down(jpath)),
      errorshook: HookTool.hook2codeced(hookform_in.errorshook, YupTool.xpath2errorhookcodec_down(XpathTool.jpath2xpath(jpath)))
    }
  }

  static flathook_vs2v = <V, X>(
    hook_in: Reacthook<X[]>,
    index2hookcodec_down: (index: number) => Hookcodec<X[], X[]>,
    data: V[],
    filter: (v: V) => boolean,
  ): Reacthook<X[]> => {
    const index = data?.findIndex(filter);
    return [
      MathTool.gtezero(index) ? index2hookcodec_down(index).decode(hook_in[0]) : [],
      (action) => {
        hook_in[1]((p_prev) => {
          const idx = data?.findIndex(filter);
          if (!MathTool.gtezero(idx)) return p_prev;

          const codec = index2hookcodec_down(idx);
          const c_prev = codec.decode(p_prev);
          const c_post = ReactTool.prev2reduced(action, c_prev);
          return c_prev === c_post ? p_prev : codec.encode(c_post, p_prev);
        });
      },
    ];
  };

  static hookform_vs2v = <V>(hookform_in:Hookform<V[]>, filter:(v:V) => boolean):Hookform<V> => {
    const codec = HookTool.filter2codec_vs2v<V>(filter);
    const data = hookform_in?.datahook[0];

    return {
      datahook: HookTool.hook2codeced(hookform_in.datahook, codec),
      fieldinfoshook: Hookform.flathook_vs2v<V, Fieldinfo>(
        hookform_in.fieldinfoshook, (i) => Fieldinfo.jpath2hookcodec_down([i]), data, filter,
      ),
      errorshook: Hookform.flathook_vs2v<V, Yup.ValidationError>(
        hookform_in.errorshook, (i) => YupTool.xpath2errorhookcodec_down(XpathTool.jpath2xpath([i])), data, filter,
      ),
    };
  }

  static hookform2indexed = <V>(hookform_in:Hookform<V[]>, index:number):Hookform<V> => Hookform.hookform2down(hookform_in, [index]);

  // /**
  //  * Hookform<V[]> → Hookform<V[]>: predicate 통과한 element 만 노출.
  //  * - datahook: listcodec_filter_n_extend (encode 시 통과 못한 element 보존, 단 끝으로 밀림)
  //  * - fieldinfoshook/errorshook: indexes 기반 indexed codec — 통과한 element 의 array index 를 압축/복원하면서 통과 안 한 메타도 자동 보존
  //  */
  // static hookform2filtered = <V>(hookform_in: Hookform<V[]>, predicate: (v: V) => boolean): Hookform<V[]> => {
  //   const data = hookform_in?.datahook[0] ?? [];
  //   const indexes_passed = ArrayTool.findIndexes(data, predicate);

  //   return {
  //     datahook: HookTool.hook2codeced(hookform_in.datahook, HookTool.listcodec_filter_n_extend<V>(predicate)),
  //     fieldinfoshook: HookTool.hook2codeced(hookform_in.fieldinfoshook, Fieldinfo.indexes2hookcodec_indexed(indexes_passed)),
  //     errorshook: HookTool.hook2codeced(hookform_in.errorshook, YupTool.indexes2errorhookcodec_indexed(indexes_passed)),
  //   };
  // };

  // /**
  //  * Hookform<P[]> → Hookform<C[]>: 각 element 의 jpath 로 down. 예: Hookform<{body:X}[]> → Hookform<X[]> (jpath=['body']).
  //  * fieldinfo/error 의 path 처리는 단순 pass-through (array index 다음 단계는 caller schema 가 처리).
  //  */
  // static hookform2downeach = <P, C>(hookform_in: Hookform<P[]>, jpath: Jpath): Hookform<C[]> => {
  //   return {
  //     datahook: HookTool.hook2codeced(hookform_in.datahook, HookTool.codec_downeach<P, C>(jpath)),
  //     fieldinfoshook: hookform_in.fieldinfoshook as any,
  //     errorshook: hookform_in.errorshook as any,
  //   };
  // };

  static datahook2hookform = <T,>(
    datahook:Reacthook<T>,
  ):Hookform<T> => {
    const fieldinfoshook = React.useState<Fieldinfo[]>([]);
    const errorshook = React.useState<Yup.ValidationError[]>([]);
    return {
      datahook,
      errorshook,
      fieldinfoshook,
    };
  }

  static errors2handled = (
    errors:Yup.ValidationError[],
    hookform:Hookform<any>,
    option?:{
      element2yoffset: (element:HTMLElement) => number,
    }
  ) => {
    const cls = Hookform;
    const callname = `Hookform.errors2handled @ ${DateTool.time2iso(new Date())}`;

    const {errorshook, fieldinfoshook} = hookform;
    const [fieldinfos] = fieldinfoshook;

    const errors_all = YupTool.errors2cleaned(errors);
    // console.log({callname, errors_all});

    const xpaths_error = errors_all?.map(e => e.path);
    const fieldinfo0 = ArrayTool.sorted(
      fieldinfos
        ?.filter(f => {
          if (f.ref.current == null) { return false; }
          return ArrayTool.in(XpathTool.jpath2xpath(f.jpath), xpaths_error);
        }),
      CmpTool.f_key2f_cmp(
        f => f.ref.current?.getBoundingClientRect()?.top,
        AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default),
      )
    )?.[0]

    // cls.element2scrollTo(fieldinfo0?.ref?.current);
    const element2yoffset = option?.element2yoffset ?? lodash.flow(WindowTool.element2top_tight, px => MathTool.minus(px,WindowTool.bufferpx_natural()));
    window.scrollTo({
      top: element2yoffset(fieldinfo0?.ref?.current),
      behavior: 'smooth',
    });
    // const element0 = fieldinfo0?.ref?.current;
    // if(element0){
    //   const yOffset = -10;
    //   const y = element0.getBoundingClientRect().top + window.scrollY + yOffset;

    //   // console.log({callname, y});
    //   // element_first.scrollIntoView();
    //   window.scrollTo({top: y, behavior: 'smooth'});
    // }
    errorshook[1](errors_all);
    
    // set_dict_errors(GroupbyTool.dict_groupby(errors, [e => e.path]));
    // err.name; // => 'ValidationError'
    // err.errors; // => ['Deve ser maior que 18']
  }

  static validator2handled = async (
    f_validate: () => Promise<any>,
    hookform:Hookform<any>,
  ) => {
    const callname = `Hookform.validator2handled @ ${DateTool.time2iso(new Date())}`;

    try{
      await f_validate();
      hookform.errorshook[1]([]);
    }
    catch(error){
      Hookform.errors2handled(ArrayTool.one2l(error as Yup.ValidationError), hookform);
      // console.log({callname, error})
      // window.scrollTo({top: 0, behavior: 'smooth'});
      throw error;
    }
  }
}
