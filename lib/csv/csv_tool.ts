// const stringify = require('csv-stringify/sync')
import {stringify} from 'csv-stringify/sync';

export default class CsvTool{
  static array2stringify = function(l_in){
    return stringify([l_in]).trim()
  }

  static str_ll2csv_blob(str_ll:string[][]):Blob{
    const newline = '\r\n';
    return new Blob(["\ufeff" + str_ll.map(strs => strs.join(',')).join(newline)+newline], { type: 'text/csv; charset=utf-8' })
  }
}
