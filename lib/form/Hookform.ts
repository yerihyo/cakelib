import React from "react";
import * as Yup from 'yup';
import { ObjectShape, OptionalObjectSchema } from "yup/lib/object";
import CmpTool, { Comparator } from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool";
import { Jpath, JpathTool, XpathTool } from "../collection/dict/json/json_tool";
import DateTool from "../date/date_tool";
import HookTool, { Hookcodec, Reacthook } from "../react/hook/hook_tool";
import YupTool from "./yup/yup_tool";
import { ValidateOptions } from "yup/lib/types";
import MathTool from "../number/math/math_tool";
import { AbsoluteOrder } from "../collection/array/minimax_tool";
import { WindowTool } from "../html/ComponentTool";

// export class Xpathanchor{
//   xpath:string;
//   ref?:React.MutableRefObject<HTMLElement>;

//   static anchors2down = (
//     anchors_in:Xpathanchor[],
//     jpath:Jpath,
//   ):Reacthook<Yup.ValidationError[]> => {
//     const cls = Hookform;
//     const xpath = XpathTool.jpath2xpath(jpath);
//     return HookTool.hook2codeced(anchors_in, Hookform.xpaths2codec_filter([xpath]),);
//   }
// }

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
    
    // if(f1?.ref?.current == null && f2?.ref?.current == null){ return true; }
    return f1?.ref?.current === f2?.ref?.current;
  }
  // static jpath2is_root = (jpath:Jpath):boolean => jpath === null;

  // static comparator_createdat = (): Comparator<Fieldinfo> => {
  //   return CmpTool.f_key2f_cmp<Fieldinfo>(
  //     fieldinfo => fieldinfo.ms_createdat,
  //   );
  // }
  
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
    // console.log({
    //   callname,
    //   is_cpost_null,
    //   has_jpathmatch,
    //   index_jpathmatching,
    //   ps_prev,
    //   c_post,
    // });
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

    // if(!has_match){
    //   return [...(ps_prev ?? []), c_post];
    // }

    // const p_prev = ps_prev?.[index_matching];

    // const div_prev = p_prev?.ref?.current;
    // const div_post = c_post?.ref?.current;

    // if(div_prev === div_post){
    //   return ps_prev;
    // }
    
    // if (div_prev != null) {
    //   console.log({
    //     callname,
    //     state:'ERROR',
    //     div_prev,
    //     div_post,
    //     index_matching,
    //     'p_prev?.ref?.current':p_prev?.ref?.current,
    //     p_prev,
    //     ps_prev,
    //     c_post,
    //   })
    //   throw new Error(`ps_prev:${ps_prev}, c_post:${c_post}`);
    // }
    // const cs_post = ArrayTool.splice(ps_prev, index_matching, 1, c_post);
    // console.log({
    //   callname,
    //   index_matching,
    //   cs_post,
    //   p_prev,
    //   ps_prev,
    //   c_post,
    // })
    // return cs_post;
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

  // static hookform2setter_validating<X, O={},>(
  //   hookedform:Hookform<X>,
  //   // schema: OptionalObjectSchema<ObjectShape>,
  //   schema: Yup.BaseSchema,
  //   options:ValidateOptions<O>,
  // ){
  //   const cls = Hookform;
  //   const codec = cls.codec_validate(hookedform, schema, options);

  //   const {data_hook} = hookedform;
  //   const [_, setter] = data_hook;
  //   return HookTool.setter2codeced<X, X>(setter, codec);
  // }

  // static schema_validator2down<V, X extends ObjectShape,>(
  //   schema_validator: (schema: OptionalObjectSchema<X>, v: V) => Promise<any>,
  //   jpath:Jpath,
  // ){
  //   const cls = Hookform;
  //   const callname = `Hookform.schema2validator @ ${DateTool.time2iso(new Date())}`;

  //   const xpath = XpathTool.jpath2xpath(jpath)
  //   const error2path_updated = (error:Yup.ValidationError) => ({
  //     ...error,
  //     path: YupTool.path2concat([xpath, error.path]),
  //   });

  //   return async (schema_child:OptionalObjectSchema<X>, c:V) => {
  //     try{
  //       return await schema_validator(schema_child, c);
  //     }
  //     catch(e){
  //       const error_in = e as Yup.ValidationError;
  //       if(!error_in){ return; }

  //       const inner_out = error_in.inner?.map(error2path_updated);
  //       const error_out = ({
  //         ...error2path_updated(error_in),
  //         ...(inner_out ? {inner:inner_out} : {}),
  //       } as Yup.ValidationError);

  //       throw error_out;
  //     }
  //   }
  // }


  // static jpath2fielddata = <P,C,X1 extends ObjectShape = ObjectShape>(
  //   fdpack: Hookform<P>,
  //   schema_parent:OptionalObjectSchema<X1>,
  //   jpath: Jpath,
  //   // options?: {
  //   //   // schema2validator?: (schema_child: X2) => ((c: C) => Promise<any>),
  //   //   schema_validator?: (schema_child: X2, c: C) => Promise<any>,
  //   // },
  //   // ref?: React.MutableRefObject<E>,
  // ):Formfielddata<C> => {
  //   const cls = Hookform;
  //   const callname = `Hookform.jpath2fielddata @ ${DateTool.time2iso(new Date())}`;

  //   const xpath = XpathTool.jpath2xpath(jpath);

  //   // global values
  //   const ref = React.useRef<HTMLDivElement>();
  //   if (ref) { cls.xpath_ref2registered(fdpack, xpath, ref as React.MutableRefObject<HTMLElement>); }

  //   const data_hook = HookTool.hook2down<P, C>(fdpack.data_hook, jpath);
    
    
  //   const errors_hook = cls.errors_hook2prefix_filtered(fdpack.errors_hook, jpath);

  //   const schema_validator = cls.schema_validator2down(fdpack.schema_validator, jpath);
  //   const schema_child = Yup.reach(schema_parent, xpath);
  //   const validator = (c:C) => schema_validator(schema_child, c);

  //   return {
  //     jpath,
  //     xpath,  // data passing
  //     ref,  // data passing
  //     data_hook,
  //     // get_hook: () => data_hook,  // for data update
  //     // schema:schema_child,
  //     // get_schema: () => schema_child,  // for validation
  //     errors_hook,
  //     validator,
  //     // schema_validator,
  //     // value2errors_updated,
  //     // errors: errors_hook?.[0],
  //     // get_errors_hook: () => errors_hook, // for error showing & error update
  //   }
  // }

  static hookform2down = <P,C,>(
    hookform_in: Hookform<P>,
    // schema_parent:OptionalObjectSchema<X1>,
    jpath: Jpath,
    // options?: {
    //   // schema2validator?: (schema_child: X2) => ((c: C) => Promise<any>),
    //   schema_validator?: (schema_child: X2, c: C) => Promise<any>,
    // },
    // ref?: React.MutableRefObject<E>,
  ):Hookform<C> => {
    const cls = Hookform;
    const callname = `Hookform.jpath2fielddata @ ${DateTool.time2iso(new Date())}`;

    // const xpath = XpathTool.jpath2xpath(jpath);

    // global errors
    // const ref = React.useRef<HTMLDivElement>();
    // if (ref) { cls.xpath_ref2registered(hookform_in, xpath, ref as React.MutableRefObject<HTMLElement>); }

    
    // const schema_child = Yup.reach(schema_parent, xpath);
    // const validator = (c:C) => schema_validator(schema_child, c);

    return {
      datahook:HookTool.hook2down<P, C>(hookform_in.datahook, jpath),
      fieldinfoshook:HookTool.hook2codeced(hookform_in.fieldinfoshook, Fieldinfo.jpath2hookcodec_down(jpath)),
      errorshook: HookTool.hook2codeced(hookform_in.errorshook, YupTool.xpath2errorhookcodec_down(XpathTool.jpath2xpath(jpath)))
    }
  }
  static hookform2indexed = <V>(hookform_in:Hookform<V[]>, index:number):Hookform<V> => Hookform.hookform2down(hookform_in, [index]);

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

  // static async schema2is_valid<T extends ObjectShape>(
  //   // validate: () => Promise<any>,
  //   hookform:Hookform<T>,
  //   yup:Yup.ObjectSchema<T>,
  // ){
  //   try {
  //     const data = hookform.datahook?.[0];
  //     await yup.validate(data, { abortEarly: false });
  //     return true;
  //   } catch (error) {
  //     const errors = YupTool.error2errors(error);
  //     // console.log({callname, errors});
      

  //     const [_, set_errors] = hookform.errors_hook;
  //     set_errors(errors);

  //     const xpath_first = errors?.[0]?.path;
  //     const anchor_first = xpath_first ? fdpack.anchors_ref.current.find(anchor => anchor.xpath === xpath_first) : undefined;
  //     const element_first = anchor_first?.ref?.current;

  //     if(element_first){
  //       const yOffset = -10;
  //       const y = element_first.getBoundingClientRect().top + window.scrollY + yOffset;

  //       // element_first.scrollIntoView();
  //       window.scrollTo({top: y, behavior: 'smooth'});
  //     }
  //   }
  //   return false;
  // }

  // static element2scrollTo = (element:HTMLElement) => {
  //   if(!element){ return ; }
    
  //   // if (element_first) {
  //     //   const yOffset = -MathTool.sum([
  //     //     HermesFrame.h_topline(),
  //     //     HermesFrame.pagelayout2h_topmenu(Pagelayout.DESKTOP),
  //     //   ]);
  //     //   const y = element_first.getBoundingClientRect().top + window.scrollY + yOffset

  //     //   window.scrollTo({top: y, behavior: 'smooth'});
  //     // }

  //   // console.log({callname, y});
  //   // element_first.scrollIntoView();
  //   window.scrollTo({
  //     top: WindowTool.element2top_natural(element),
  //     behavior: 'smooth',
  //   });
  // }

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
    const element2yoffset = option?.element2yoffset ?? WindowTool.element2top_natural;
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
      Hookform.errors2handled(ArrayTool.v2l_or_undef(error as Yup.ValidationError), hookform);
      // console.log({callname, error})
      // window.scrollTo({top: 0, behavior: 'smooth'});
      throw error;
    }
  }
}
