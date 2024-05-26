import React from "react";
import * as Yup from 'yup';
import { ObjectShape, OptionalObjectSchema } from "yup/lib/object";
import CmpTool, {Comparator} from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool";
import { Jpath, XpathTool } from "../collection/dict/json/json_tool";
import DateTool from "../date/date_tool";
import HookTool, { Hookcodec, Reacthook, Reacthooksetter, Reactref } from "../react/hook/hook_tool";
import YupTool from "./yup/yup_tool";
import { ValidateOptions } from "yup/lib/types";
import { AbsoluteOrder } from "../collection/array/minimax_tool";

// class Schemainfo{
//   schema:OptionalObjectSchema<ObjectShape>;
//   option?:ValidateOptions;
// }

export class Xinfo{
  xpath:string;
  // value:T;
  anchor:React.MutableRefObject<HTMLElement>;

  static xinfo2down(xinfo:Xinfo, xpath:string):Xinfo{
    return {...xinfo, xpath: XpathTool.xpath2prefix_stemmed(xinfo.xpath, xpath)};
  }
  static xinfo2up(xinfo:Xinfo, xpath:string):Xinfo{
    return {...xinfo, xpath: XpathTool.concat(xpath, xinfo.xpath)};
  }

  static codec_down(xpath:string,):Hookcodec<Xinfo[],Xinfo[]>{
    const cls = Xinfo;
    // const xinfo2prefix_stemmed = (p:Xinfo) => ({...p, xpath:XpathTool.xpath2prefix_stemmed(p.xpath, xpath)} as Xinfo);
    const decode = (ps:Xinfo[]) => ps.map(p => cls.xinfo2down(p, xpath));

    const codec_prefixstem:Hookcodec<Xinfo[],Xinfo[]> = {
      decode,
      encode:(cs_post, ps_prev) => {
        const is_identical = (() => {
          if(cs_post == null && ps_prev == null){ return true; }
          if(cs_post == null || ps_prev == null){ return false; }

          if(cs_post?.length !== ps_prev?.length){ return false; }
          
          const cs_prev = decode(ps_prev);
          if(cs_prev === cs_post){ return true; }

          return cs_post?.every((c_post, i) => c_post === cs_prev[i]);
        })();

        return is_identical ? ps_prev : cs_post.map(c => Xinfo.xinfo2up(c, xpath));
      },
    };

    return HookTool.codecs2piped([
      HookTool.listcodec_filter_n_extend<Xinfo>(xinfo => XpathTool.is_prefix(xpath, xinfo.xpath)),
      codec_prefixstem,
    ]);
  }
}


// class Anchorxinfo{
//   xpath:string;
//   anchor:React.MutableRefObject<HTMLElement>;
// }

// class Touchedxinfo{
//   xpath:string;
//   touched:boolean;
// }

// export class Hookedfield<V>{
//   data_hook: Reacthook<V>;
//   anchor: React.MutableRefObject<HTMLDivElement>;  // data passing
//   errors_hook: Reacthook<Yup.ValidationError[]>;

//   static register<T>(hookedform_in:Hookedform<T>, xpath:string, anchor:React.MutableRefObject<HTMLElement>){
//     hookedform_in.dict_xpath2anchor_ref.current[xpath] = anchor;
//   }
// }

/**
 * DEPRECATED
 */
export default class Hookedform<T>{
  jpath:Jpath;

  data_hook: Reacthook<T>;
  
  errors_hook: Reacthook<Yup.ValidationError[]>;
  // anchorxinfos_ref: React.MutableRefObject<Xinfo<React.MutableRefObject<HTMLElement>>[]>;
  // dict_xpath2anchor_ref: React.MutableRefObject<Record<string,React.MutableRefObject<HTMLElement>>>;
  // dict_anchor_hook: Reacthook<Record<string,React.MutableRefObject<HTMLElement>>>;
  xinfos_ref: Reactref<Xinfo[]>;
  // xinfos_hook: Reacthook<Xinfo[]>;
  // touchedxinfos_ref: Reacthook<Touchedxinfo[]>
  // schemainfo?:Schemainfo;

  // static xpath_ref2registered(hookedform: Hookedform<any>, xpath: string, ref: React.MutableRefObject<HTMLElement>) {
  //   hookedform.xinfos_ref.current = ArrayTool.upsert(
  //     hookedform.xinfos_ref.current ?? [],
  //     { xpath, ref },
  //     { isEqual: CmpTool.f_key2f_eq(anchor => anchor.xpath) }
  //   );
  // }

  static xpath2codec_pathprefixremoved(xpath:string){
    return {
      decode: (ps: Yup.ValidationError[]): Yup.ValidationError[] => ps?.map(p => ({...p, path:p.path.substr(xpath.length+1)})),
      encode: (cs_post: Yup.ValidationError[],): Yup.ValidationError[] => cs_post?.map(c => ({...c, path:`${xpath}.${c.path}`})),
    };
  }

  static errors_hook2prefix_filtered = (
    errors_hook:Reacthook<Yup.ValidationError[]>,
    jpath:Jpath,
  ):Reacthook<Yup.ValidationError[]> => {
    const cls = Hookedform;
    const xpath = XpathTool.jpath2xpath(jpath);
    
    const codec_filter = HookTool.listcodec_filter_n_extend((p: Yup.ValidationError) => p.path?.startsWith(xpath));
    return HookTool.hook2codeced(errors_hook, codec_filter,);
  }

  static xpath2codec_errors_down(xpath:string):Hookcodec<Yup.ValidationError[], Yup.ValidationError[]>{
    const callname = `Hookedform.xpath2codec_errors_down @ ${DateTool.time2iso(new Date())}`;

    const decode = (ps:Yup.ValidationError[]) => YupTool.xpath2errors_down(ps, xpath);
    return {
      decode,
      encode: (cs_post, ps_prev) => {
        const cs_prev = decode(ps_prev);

        // console.log({callname, cs_prev, ps_prev,
        //   xpath,
        //   'cs_post?.map(c => YupTool.xpath2error_up(c, xpath))':cs_post?.map(c => YupTool.xpath2error_up(c, xpath))
        // });
        return ArrayTool.isTriequalEvery(cs_prev, cs_post)
          ? ps_prev
          : YupTool.xpath2errors_up(cs_post, xpath);
      }
    }
  }

  static prefix_xinfos2updated(hookedform:Hookedform<any>, jpath_target:Jpath, xinfos:Xinfo[]){
    const xinfos_prev = hookedform.xinfos_ref.current;

    const jpath_prefix = [...(hookedform.jpath ?? []), ...(jpath_target ?? []),];
    const xpath_prefix = XpathTool.jpath2xpath(jpath_prefix);

    const xinfos_post = [
      ...(xinfos_prev?.filter(xinfo => !XpathTool.is_prefix(xpath_prefix, xinfo.xpath)) ?? []),
      ...(xinfos?.map(xinfo => Xinfo.xinfo2up(xinfo, xpath_prefix)) ?? []),
    ];
    hookedform.xinfos_ref.current = xinfos_post;
    return hookedform;
  }

  static hookedform2xinfos(hookedform:Hookedform<any>):Xinfo[]{
    const xinfos_ref = hookedform.xinfos_ref;
    if(xinfos_ref == null){ throw new Error(`Not defined`); }

    const xpath_prefix = XpathTool.jpath2xpath(hookedform.jpath);
    return xinfos_ref.current
      ?.filter(xinfo => XpathTool.is_prefix(xpath_prefix, xinfo.xpath))
      ?.map(xinfo => Xinfo.xinfo2down(xinfo, xpath_prefix));
  }

  // static hookedform2xinfos_hook(hookedform:Hookedform<any>):Reacthook<Xinfo[]>{
  //   const cls = Hookedform;
  //   const callname = `Hookedform.hookedform2xinfos_hook @ ${DateTool.time2iso(new Date())}`;

  //   const xinfos = cls.hookedform2xinfos(hookedform);
  //   const set_xinfos = (xinfos:Xinfo[]) => cls.prefix_xinfos2updated(hookedform, '', xinfos);
  //   return [xinfos, set_xinfos];
  // }

  static xpath2codec_errors_hook_down = (xpath:string):Hookcodec<Yup.ValidationError[],Yup.ValidationError[]> => HookTool.codecs2piped([
    HookTool.listcodec_filter_n_extend<Yup.ValidationError>((p: Yup.ValidationError) => p.path?.startsWith(xpath)),
    Hookedform.xpath2codec_errors_down(xpath),
  ]);

  static hookedform2down<I,O>(hookedform_in:Hookedform<I>, jpath:Jpath):Hookedform<O>{
    const cls = Hookedform;

    const xpath = XpathTool.jpath2xpath(jpath);
    const {
      jpath: jpath_in,
      data_hook:data_hook_in,
      // schemainfo:schemainfo_in,
      errors_hook:errors_hook_in,
      // xinfos_hook:xinfos_hook_in,
      // dict_anchor_hook:dict_anchor_hook_in,
    } = hookedform_in;

    return {
      jpath: [...(jpath_in ?? []), ...(jpath ?? [])],
      data_hook: HookTool.hook2down<I,O>(data_hook_in, jpath),
      errors_hook: HookTool.hook2codeced(errors_hook_in, cls.xpath2codec_errors_hook_down(xpath),),
      // xinfos_hook: HookTool.hook2codeced(
      //   xinfos_hook_in,
      //   Xinfo.codec_down(xpath),
      // ),
      xinfos_ref: hookedform_in.xinfos_ref,
      // dict_anchor_hook: HookTool.hook2codeced(dict_anchor_hook_in, codec_anchor_hook,),
      // ...(schemainfo_out ? {schemainfo: schemainfo_out} : {}),
    } as Hookedform<O>;
  }

  static hookedform2datacodeced<X>(hookedform_in:Hookedform<X>, codec:Hookcodec<X,X>):Hookedform<X>{
    const cls = Hookedform;

    const {data_hook:data_hook_in,} = hookedform_in;

    return {
      ...hookedform_in,
      data_hook: HookTool.hook2codeced<X,X>(data_hook_in, codec),
    } as Hookedform<X>;
  }

  static hookedform2indexed = <V>(hookedform_in:Hookedform<V[]>, index:number):Hookedform<V> => Hookedform.hookedform2down(hookedform_in, [index]);


  // static jpath2fielddata = <P,C,X1 extends ObjectShape = ObjectShape>(
  //   hookedform: Hookedform<P>,
  //   schema_parent:OptionalObjectSchema<X1>,
  //   jpath: Jpath,
  //   // options?: {
  //   //   // schema2validator?: (schema_child: X2) => ((c: C) => Promise<any>),
  //   //   schema_validator?: (schema_child: X2, c: C) => Promise<any>,
  //   // },
  //   // ref?: React.MutableRefObject<E>,
  // ):Formfielddata<C> => {
  //   const cls = Hookedform;
  //   const callname = `Hookedform.jpath2fielddata @ ${DateTool.time2iso(new Date())}`;

  //   const xpath = XpathTool.jpath2xpath(jpath);

  //   // global values
  //   const ref = React.useRef<HTMLDivElement>();
  //   if (ref) { cls.xpath_ref2registered(hookedform, xpath, ref as React.MutableRefObject<HTMLElement>); }

  //   const data_hook = HookTool.hook2down<P, C>(hookedform.data_hook, jpath);
    
    
  //   const errors_hook = cls.errors_hook2prefix_filtered(hookedform.errors_hook, jpath);

  //   const schema_validator = cls.schema_validator2down(hookedform.schema_validator, jpath);
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

  static data_hook2hookedform = <T,>(
    data_hook:Reacthook<T>,
    // options?:{
    //   schemainfo?:Schemainfo,
    // },
  ):Hookedform<T> => {
    // const {schemainfo} = (options ?? {});
    // const xinfos_hook = React.useState<Xinfo[]>([]);
    const xinfos_ref = React.useRef<Xinfo[]>([]);
    // const [xinfos] = xinfos_hook;

    const errors_hook = React.useState<Yup.ValidationError[]>([]);
    // const errors_hook = HookTool.hook2codeced(
    //   React.useState<Yup.ValidationError[]>([]),
    //   HookTool.encoder2codec(
    //     (errors_in: Yup.ValidationError[], errors_prev:Yup.ValidationError[],) => {
    //       if(errors_in===errors_prev){ return errors_prev; }

    //       // errors_in might be 'null' from submit() function
    //       // if prev is empty array, return as is
    //       if(!ArrayTool.bool(errors_in)){
    //         return (errors_prev && !ArrayTool.bool(errors_prev)) ? errors_prev : [];
    //       }

    //       // console.log({callname, errors_in});
    //       // if (!errors_in) { throw new Error("'errors_in' empty") }
    //       const xpath2index = ArrayTool.array2f_index(xinfos_ref.current.map(xinfo => xinfo.xpath));
    //       return ArrayTool.sorted(
    //         errors_in,
    //         CmpTool.f_key2f_cmp(e => xpath2index(e.path), AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default)),
    //       );
    //     }
    //   ),
    // );

    // const schema_validator_default = <X extends ObjectShape, V>(schema: OptionalObjectSchema<X>, v: V) => schema.validate(v, { abortEarly: false },)
    // const schema_validator = options?.schema_validator ?? schema_validator_default;

    const hookedform = {
      jpath:[],
      data_hook: data_hook,
      errors_hook,
      xinfos_ref,
      // dict_anchor_hook,
      // ...(schemainfo ? {schemainfo} : {}),
    };
    return hookedform;
  }

  static async validate2errors_returned<X, O={},>(
    hookedform:Hookedform<X>,
    // schema: OptionalObjectSchema<ObjectShape>,
    schema: Yup.BaseSchema,
    x: X,
    options:ValidateOptions<O>,
  ):Promise<Yup.ValidationError[]> {
    const cls = Hookedform;
    const callname = `Hookedform.validate2errors_returned @ ${DateTool.time2iso(new Date())}`;

    const {errors_hook} = hookedform;
    const [_, set_errors] = errors_hook;
    
    try {
      await schema.validate(x, options);
      set_errors([]);
      return [];
    } catch (error) {
      const errors = YupTool.error2errors(error);
      // console.log({callname, errors});

      set_errors(errors);
      return errors;
    }
  }

  // static async validate2errors_thrown<X, O={}, R=any>(
  //   hookedform:Hookedform<X>,
  //   // schema: OptionalObjectSchema<ObjectShape>,
  //   schema: Yup.BaseSchema,
  //   x: X,
  //   options:ValidateOptions<O>,
  // ):Promise<R> {
  //   const cls = Hookedform;
  //   const callname = `Hookedform.validate2errors_thrown @ ${DateTool.time2iso(new Date())}`;

  //   const {errors_hook} = hookedform;
  //   const [_, set_errors] = errors_hook;
    
  //   try {
  //     const result = await schema.validate(x, options);
  //     set_errors([]);
  //     return result;
  //   } catch (error) {
  //     const errors = YupTool.error2errors(error);
  //     // console.log({callname, errors});

  //     set_errors(errors);
  //     throw errors;
  //   }
  // }

  static codec_validate<X, O={},>(
    hookedform:Hookedform<X>,
    // schema: OptionalObjectSchema<ObjectShape>,
    schema: Yup.BaseSchema,
    options:ValidateOptions<O>,
  ){
    return HookTool.encoder2codec<X>((c, p_prev) => {
      if (c === p_prev) { return p_prev; }

      Hookedform.validate2errors_returned<X>(hookedform, schema, c, options);
      return c;
    });
  }

  // static setter2validator_wrapped<X, O={},>(
  //   setter:Reacthooksetter<X>,
  //   ...args: Parameters<typeof Hookedform.codec_validate<X,O>>
  // ){
  //   const cls = Hookedform;
  //   const codec = cls.codec_validate(...args);
  //   return HookTool.setter2codeced<X, X>(setter, codec);
  // }

  static hookedform2setter_validating<X, O={},>(
    hookedform:Hookedform<X>,
    // schema: OptionalObjectSchema<ObjectShape>,
    schema: Yup.BaseSchema,
    options:ValidateOptions<O>,
  ){
    const cls = Hookedform;
    const codec = cls.codec_validate(hookedform, schema, options);

    const {data_hook} = hookedform;
    const [_, setter] = data_hook;
    return HookTool.setter2codeced<X, X>(setter, codec);
  }

  static errors2scroll<X>(
    hookedform:Hookedform<X>,
    errors:Yup.ValidationError[],
  ){
    const cls = Hookedform;
    const callname = `Hookedform.errors2scroll @ ${DateTool.time2iso(new Date())}`;

    const xinfos = Hookedform.hookedform2xinfos(hookedform);
    // const xpaths_sorted = hookedform.xinfos_ref.current.map(xinfo => xinfo.xpath);
    const xpath2index = ArrayTool.array2f_index(xinfos?.map(xinfo => xinfo.xpath));
    const error_comparator:Comparator<Yup.ValidationError> = CmpTool.f_key2f_cmp(
      e => xpath2index(e.path),
      AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default),
    );

    const error_first = ArrayTool.min(
      errors,
      {comparator:error_comparator,}
    )
    // const errors = ArrayTool.sorted(
    //   errors_raw,
    //   CmpTool.f_key2f_cmp(e => xpath2index(e.path), AbsoluteOrder.f_cmp2f_cmp_nullable2max(CmpTool.pair2cmp_default))
    // );
    
    const xpath_first = error_first?.path;
    const xinfo_first = ArrayTool.filter2one(xinfo => xinfo.xpath === xpath_first, xinfos);
    const element_first = xinfo_first?.anchor?.current;

    if(element_first){
      const yOffset = -10;
      const y = element_first.getBoundingClientRect().top + window.pageYOffset + yOffset;

      // element_first.scrollIntoView();
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

  // static validate<X, O={}>(hookedform:Hookedform<X>, schema: OptionalObjectSchema<ObjectShape>, x: X, options:ValidateOptions<O>) {
  //   const cls = Hookedform;

  //   // const options = {
  //   //   abortEarly: false,
  //   //   context: {swrdata},
  //   // };
  //   return cls.hookedform2is_valid(
  //     hookedform,
  //     () => schema.validate(x, options),
  //   );
  // }
}
