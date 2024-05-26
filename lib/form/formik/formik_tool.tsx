import { useFormikContext, FormikProps } from 'formik';
import React from 'react';
import JsonTool from '../../collection/dict/json/json_tool';
import DateTool from '../../date/date_tool';
import NativeTool from '../../native/native_tool';
import HookTool from '../../react/hook/hook_tool';

/**
 * Formik problem: have to have "initial" value
 */
export default class FormikTool {
  static Dropdown = class {
    static value2is_cleared(v:any){
      if(v === ''){ return true; }
      if(v == null){ return true; }
      return false;
    }
  }
  static getFieldErrorNames(formikErrors) {
    const self = FormikTool;
    const transformObjectToDotNotation = (obj, prefix = "", result = []) => {
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        if (!value) return

        const nextKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === "object") {
          transformObjectToDotNotation(value, nextKey, result)
        } else {
          result.push(nextKey)
        }
      })

      return result
    }

    return transformObjectToDotNotation(formikErrors)
  }

  /**
   * SOURCE: https://dev.to/diegocasmo/scroll-to-input-on-formik-failed-submission-1c3c
   */
  static ScrollToFieldError = (formik:FormikProps<any>,) => {
    const self = FormikTool;
    const callname = `FormikTool.ScrollToFieldError @ ${DateTool.time2iso(new Date())}`;

    // const {formik} = props;

    const { isValid, errors } = formik; // useFormikContext()
    
    const downcount = HookTool.boolean2downcount(formik.isSubmitting);

    React.useEffect(() => {
      // console.log({callname, isValid, submitCount, errors,});

      if (isValid) return;
      // if (formik.isSubmitting) { return; }

      const fieldErrorNames = self.getFieldErrorNames(errors)
      // console.log({ callname, stage:'before', fieldErrorNames, 'formik.touched':JSON.stringify(formik.touched) });
      if (fieldErrorNames.length <= 0) return

      fieldErrorNames.map(fn => formik.setFieldTouched(fn, true, false));
      // console.log({ callname, stage:'after', fieldErrorNames, 'formik.touched':JSON.stringify(formik.touched) });

      const element = document.querySelector(`[name='${fieldErrorNames[0]}']`);
      if (!element) return

      // Scroll to first known error into view
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }, [downcount]) // eslint-disable-line react-hooks/exhaustive-deps

    return;
  }

  static jpath2touched_error<T>(formik: FormikProps<T>, jpath: (string | number)[]): string {
    const is_touched = JsonTool.down(
      formik.touched,
      jpath,
      { down_one: (obj, jstep) => NativeTool.is_boolean(obj) ? obj : JsonTool.down_one(obj, jstep), },
    )
    // return is_touched ? JsonTool.down(formik.errors, jpath) as string : undefined;
    return is_touched ? jpath.reduce((x, jstep) => x?.[jstep], formik.errors) as string : undefined;
  }

  static regex_phonenumber() {
    return /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
    // phoneNumber: Yup.string().matches(phoneRegExp, 'Phone number is not valid');
  }
}