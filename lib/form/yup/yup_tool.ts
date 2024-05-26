import * as Yup from 'yup';
import DateTool from '../../date/date_tool';
import HookTool, { Hookcodec, Reacthooksetter } from '../../react/hook/hook_tool';
import JsonTool, { Jpath, XpathTool } from '../../collection/dict/json/json_tool';
import { ObjectShape } from 'yup/lib/object';
import DictTool from '../../collection/dict/dict_tool';
import ArrayTool from '../../collection/array/array_tool';
import lodash from 'lodash';

export default class YupTool{

  static error2is_rooterror = (error:Yup.ValidationError):boolean => !error.path;

  static error2errors(error:Yup.ValidationError):Yup.ValidationError[]{
    const callname = `YupTool.error2errors @ ${DateTool.time2iso(new Date())}`;

    const errors_inner = error?.inner?.map(YupTool.error2errors)?.flat()
    

    const errors_out = lodash.uniqBy(
      [
        ...(errors_inner ?? []),
        error,
      ],
      x => JsonTool.encode(DictTool.keys2filtered(x, ['path', 'message'])),
    );
    // console.log({callname,error,errors_inner, errors_out});
    return errors_out;
  }

  static path2concat(paths:string[]):string{
    return paths.filter(Boolean).join('.');
  }

  // static xpath2error_down(error:Yup.ValidationError, xpath:string):Yup.ValidationError{
  //   return {...error, path:XpathTool.xpath2prefix_stemmed(error.path, xpath),};
  // }

  // static xpath2error_up(error_in:Yup.ValidationError, xpath:string):Yup.ValidationError{
  //   const error_out = {...error_in, path:XpathTool.concat(xpath, error_in.path),};
  //   return error_out;
  // }

  static xpath2errors_down(errors:Yup.ValidationError[], xpath:string):Yup.ValidationError[]{
    return errors
      ?.filter(e => XpathTool.is_prefix(xpath, e.path))
      ?.map(e => {
        const inner_out = YupTool.xpath2errors_down(e?.inner, xpath);
        return {
          ...DictTool.keys2excluded(e, ['inner', 'path']),
          ...(ArrayTool.bool(inner_out) ? { inner: inner_out } : {}),
          // path: YupTool.path2concat([xpath, error.path]),
          path: XpathTool.xpath2prefix_stemmed(e.path, xpath),
        }
      })
  }

  static xpath2errors_up(errors:Yup.ValidationError[], xpath:string):Yup.ValidationError[]{
    return errors?.map(e => {
      const inner_out = YupTool.xpath2errors_up(e?.inner, xpath);
      return {
        ...DictTool.keys2excluded(e, ['inner', 'path']),
        ...(inner_out ? { inner: inner_out } : {}),
        // path: YupTool.path2concat([xpath, error.path]),
        path: XpathTool.xpath2prefix_added(e.path, xpath),
      };
    });
  }

  static xpath2errorhookcodec_down = (
    // jpath: Jpath,
    xpath:string,
  ): Hookcodec<Yup.ValidationError[], Yup.ValidationError[]> => {
    const cls = YupTool;

    return HookTool.codecs2piped([
      HookTool.listcodec_filter_n_extend((e: Yup.ValidationError) => XpathTool.is_prefix(xpath, e.path)),
      {
        decode: (ps: Yup.ValidationError[]) => YupTool.xpath2errors_down(ps, xpath),
        encode: (cs: Yup.ValidationError[]) => YupTool.xpath2errors_up(cs, xpath),
      } as Hookcodec<Yup.ValidationError[], Yup.ValidationError[]>,
    ]);
  }

  // static xpath2errors_filterdown(errors:Yup.ValidationError[], xpath:string):Yup.ValidationError[]{
  //   const cls = YupTool;

  //   return errors
  //     ?.filter(e => e.path?.startsWith(xpath))
  //     ?.map(e => cls.xpath2error_down(e, xpath));
  // }

  /**
   * REF: https://stackoverflow.com/a/61782161/1902064
   */
  static regex_nowhitespace_gte1():RegExp{
    // return /^(?!\s+$)/;
    // return /^\w+/;
    return /([^\s]+)/;
  }
  static async schema2validated(
    validate: () => void | Promise<void>,
    // schema:any,
    set_errors: Reacthooksetter<Yup.ValidationError[]>,
  ) {
    const callname = `YupTool.schema2validated @ ${DateTool.time2iso(new Date())}`;
    // console.log({callname, stage:'start'});

    try {
      await validate(); // schema.validate(value, {abortEarly:false});
      set_errors(undefined);
    } catch (error) {
      const errors = YupTool.error2errors(error)
      // console.log({callname, error})

      set_errors(errors);
    }
  }
}

// https://github.com/jquense/yup/issues/398#issuecomment-916693907
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/49512#issuecomment-726150393
export type YupContext<T, X extends ObjectShape=ObjectShape> = Yup.TestContext<T> & {
  from: {
    schema: Yup.ObjectSchema<X>;
    value: any;
  }[];
}