import { Pair } from "../../native/native_tool";
import ArrayTool from "./array_tool";

const assert = require('assert');


export class Pageinfo{
  pageindex:number;
  pagesize:number;

  static pageinfo2span(pageinfo:Pageinfo):Pair<number>{
    const {pageindex, pagesize} = pageinfo;

    return [
      pageindex*pagesize,
      (pageindex+1)*pagesize,
    ]
  }
  // static count2pagecount(count:number):{pagecount:number, pagesize:number}{
  //   pagesize
  // }
}
export default class ChunkTool {
  static chunksize2chunks<X>(items: X[], chunksize: number,): X[][] {
    assert(chunksize)

    const n = ArrayTool.len(items);
    let chunks: X[][] = [];
    for (var i = 0; i < n; i += chunksize) {
      const chunk = items.slice(i, i + chunksize);
      chunks.push(chunk);
    }
    return chunks;
  }

  static chunkcount2chunks<X>(items: X[], chunkcount: number,): X[][] {
    const self = ChunkTool;
    assert(chunkcount)

    const n = ArrayTool.len(items);
    const chunksize = Math.ceil(n / chunkcount);
    return self.chunksize2chunks(items, chunksize,);
  }

  static pageinfo2paged<T>(items:T[], pageinfo:Pageinfo):T[]{
    const cls = ChunkTool;

    const [s,e] = Pageinfo.pageinfo2span(pageinfo);
    return items?.slice(s,e)
  }
}

