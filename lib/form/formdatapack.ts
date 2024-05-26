import React from "react";
import * as Yup from 'yup';
import { ObjectShape, OptionalObjectSchema } from "yup/lib/object";
import CmpTool from "../cmp/CmpTool";
import ArrayTool from "../collection/array/array_tool";
import { Jpath, XpathTool } from "../collection/dict/json/json_tool";
import DateTool from "../date/date_tool";
import HookTool, { Reacthook } from "../react/hook/hook_tool";
import YupTool from "./yup/yup_tool";

export class Erroranchor{
  xpath:string;
  ref?:React.MutableRefObject<HTMLElement>;
}

export class Formfielddata<V>{
  jpath:Jpath;
  xpath: string; // data passing
  ref: React.MutableRefObject<HTMLDivElement>;  // data passing
  data_hook: Reacthook<V>;
  errors_hook: Reacthook<Yup.ValidationError[]>;
  validator: (v:V) => Promise<any>;
}

/**
 * DEPRECATED
 */
export default class Formdatapack<T>{
  data_hook: Reacthook<T>;
  errors_hook: Reacthook<Yup.ValidationError[]>;
  anchors_ref: React.MutableRefObject<Erroranchor[]>
  schema_validator: <X extends ObjectShape,V>(schema: OptionalObjectSchema<X>, v: V) => Promise<any>;

  static xpaths2codec_filter(
    xpaths: string[],
  ) {
    const cls = Formdatapack;
    const callname = `Formdatapack.xpaths2codec_filter @ ${DateTool.time2iso(new Date())}`;

    return HookTool.listcodec_filter_n_extend((p: Yup.ValidationError) => xpaths.some(xpath => p.path?.startsWith(xpath)))
  }

  static xpath_ref2registered(fdpack: Formdatapack<any>, xpath: string, ref: React.MutableRefObject<HTMLElement>) {
    fdpack.anchors_ref.current = ArrayTool.upsert(
      fdpack.anchors_ref.current ?? [],
      { xpath, ref },
      { isEqual: CmpTool.f_key2f_eq(anchor => anchor.xpath) }
    );
  }

  static xpath2codec_pathprefixremoved(xpath:string){
    return {
      decode: (ps: Yup.ValidationError[]): Yup.ValidationError[] => ps?.map(p => ({...p, path:p.path.substr(xpath.length+1)})),
      encode: (cs_post: Yup.ValidationError[],): Yup.ValidationError[] => cs_post?.map(c => ({...c, path:`${xpath}.${c.path}`})),
    };
  }

  static schema_validator2down<V, X extends ObjectShape,>(
    schema_validator: (schema: OptionalObjectSchema<X>, v: V) => Promise<any>,
    jpath:Jpath,
  ){
    const cls = Formdatapack;
    const callname = `Formdatapack.schema2validator @ ${DateTool.time2iso(new Date())}`;

    const xpath = XpathTool.jpath2xpath(jpath)
    const error2path_updated = (error:Yup.ValidationError) => ({
      ...error,
      path: YupTool.path2concat([xpath, error.path]),
    });

    return async (schema_child:OptionalObjectSchema<X>, c:V) => {
      try{
        return await schema_validator(schema_child, c);
      }
      catch(e){
        const error_in = e as Yup.ValidationError;
        if(!error_in){ return; }

        const inner_out = error_in.inner?.map(error2path_updated);
        const error_out = ({
          ...error2path_updated(error_in),
          ...(inner_out ? {inner:inner_out} : {}),
        } as Yup.ValidationError);

        throw error_out;
      }
    }

  }

  static errors_hook2prefix_filtered = (
    errors_hook:Reacthook<Yup.ValidationError[]>,
    jpath:Jpath,
  ):Reacthook<Yup.ValidationError[]> => {
    const cls = Formdatapack;
    const xpath = XpathTool.jpath2xpath(jpath);
    return HookTool.hook2codeced(errors_hook, Formdatapack.xpaths2codec_filter([xpath]),);
  }

  static jpath2fielddata = <P,C,X1 extends ObjectShape = ObjectShape>(
    fdpack: Formdatapack<P>,
    schema_parent:OptionalObjectSchema<X1>,
    jpath: Jpath,
    // options?: {
    //   // schema2validator?: (schema_child: X2) => ((c: C) => Promise<any>),
    //   schema_validator?: (schema_child: X2, c: C) => Promise<any>,
    // },
    // ref?: React.MutableRefObject<E>,
  ):Formfielddata<C> => {
    const cls = Formdatapack;
    const callname = `Formdatapack.jpath2fielddata @ ${DateTool.time2iso(new Date())}`;

    const xpath = XpathTool.jpath2xpath(jpath);

    // global values
    const ref = React.useRef<HTMLDivElement>();
    if (ref) { cls.xpath_ref2registered(fdpack, xpath, ref as React.MutableRefObject<HTMLElement>); }

    const data_hook = HookTool.hook2down<P, C>(fdpack.data_hook, jpath);
    
    
    const errors_hook = cls.errors_hook2prefix_filtered(fdpack.errors_hook, jpath);

    const schema_validator = cls.schema_validator2down(fdpack.schema_validator, jpath);
    const schema_child = Yup.reach(schema_parent, xpath);
    const validator = (c:C) => schema_validator(schema_child, c);

    return {
      jpath,
      xpath,  // data passing
      ref,  // data passing
      data_hook,
      // get_hook: () => data_hook,  // for data update
      // schema:schema_child,
      // get_schema: () => schema_child,  // for validation
      errors_hook,
      validator,
      // schema_validator,
      // value2errors_updated,
      // errors: errors_hook?.[0],
      // get_errors_hook: () => errors_hook, // for error showing & error update
    }
  }

  static datahook2fdpack = <T,>(
    datahook:Reacthook<T>,
    options?:{
      schema_validator?:<X extends ObjectShape,V>(schema: OptionalObjectSchema<X>, v: V) => Promise<any>,
    },
  ):Formdatapack<T> => {
    const anchors_ref = React.useRef<Erroranchor[]>([]);
    const errors_hook = Formdatapack.anchors_ref2errors_hook(anchors_ref);

    const schema_validator_default = <X extends ObjectShape, V>(schema: OptionalObjectSchema<X>, v: V) => schema.validate(v, { abortEarly: false },)
    const schema_validator = options?.schema_validator ?? schema_validator_default;

    const fdpack = {
      data_hook: datahook,
      errors_hook,
      anchors_ref,
      schema_validator,
    };
    return fdpack;
  }

  static anchors_ref2errors_hook = (
    anchors_ref:React.MutableRefObject<Erroranchor[]>,
  ) => {
    return HookTool.hook2codeced(
      React.useState<Yup.ValidationError[]>([]),
      HookTool.encoder2codec(
        (errors_in: Yup.ValidationError[], errors_prev:Yup.ValidationError[],) => {
          if(errors_in===errors_prev){ return errors_prev; }

          // errors_in might be 'null' from submit() function
          // if prev is empty array, return as is
          if(!ArrayTool.bool(errors_in)){
            return (errors_prev && !ArrayTool.bool(errors_prev)) ? errors_prev : [];
          }

          // console.log({callname, errors_in});
          // if (!errors_in) { throw new Error("'errors_in' empty") }
          const xpath_comparator = ArrayTool.array2indexcomparator(anchors_ref.current.map(a => a.xpath));
          return ArrayTool.sorted(errors_in, (e1, e2) => xpath_comparator(e1.path, e2.path));
        }
      ),
    );
  }

  static async schema2is_valid<T>(
    // validate: () => Promise<any>,
    fdpack:Formdatapack<T>,
    yup:any,
  ){
    try {
      const data = fdpack.data_hook?.[0];
      await yup.validate(data, { abortEarly: false });
      return true;
    } catch (error) {
      const errors = YupTool.error2errors(error);
      // console.log({callname, errors});
      

      const [_, set_errors] = fdpack.errors_hook;
      // const anchorederrors_out = errors.map(e => ({ xpath: e.path, error: e }));
      // set_anchorederrors(anchorederrors_out);
      set_errors(errors);

      // console.log({callname, anchorederrors_out});

      const xpath_first = errors?.[0]?.path;
      const anchor_first = xpath_first ? fdpack.anchors_ref.current.find(anchor => anchor.xpath === xpath_first) : undefined;
      const element_first = anchor_first?.ref?.current;

      if(element_first){
        const yOffset = -10;
        const y = element_first.getBoundingClientRect().top + window.scrollY + yOffset;

        // element_first.scrollIntoView();
        window.scrollTo({top: y, behavior: 'smooth'});
      }
      
      // set_dict_errors(GroupbyTool.dict_groupby(errors, [e => e.path]));
      // err.name; // => 'ValidationError'
      // err.errors; // => ['Deve ser maior que 18']
    }
    return false;
  }
}
