import DictTool from '../collection/dict/dict_tool';
import MathTool from '../number/math/math_tool';
import {stringify} from 'csv-stringify/sync';

export default class CsvTool{
  static array2stringify = function(l_in){
    return stringify([l_in]).trim()
  }

  static str_ll2csv_blob(str_ll:string[][]):Blob{
    const newline = '\r\n';
    return new Blob(["\ufeff" + str_ll.map(strs => strs.join(',')).join(newline)+newline], { type: 'text/csv; charset=utf-8' })
  }

  static str_ll2objs = (data: (string|number)[][]): Record<string,string|number>[] => {
    return data == null
      ? undefined
      : MathTool.lt(data?.length, 1)
        ? []
        : data.slice(1)
            .map(row => DictTool.listpair2dict<string,string|number>(data[0] as string[], row));
  }

}
