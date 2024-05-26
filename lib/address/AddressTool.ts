import CacheTool from "../cache/cache_tool";
import ArrayTool from "../collection/array/array_tool";
import { Pair } from "../native/native_tool";

export default class AddressTool{
  static zipcodespans_island = CacheTool.memo_one((): ([number] | Pair<number>)[] => {
    // https://imweb.me/faq?mode=view&category=29&category2=40&idx=71671
    return [
      [63000, 63644],
      [22386, 22388],
      [23004, 23010],
      [23100, 23116],
      [23124, 23136],
      [31708],
      [32133],
      [33411],
      [40200, 40240],
      [46768, 46771],
      [52570, 52571],
      [53031, 53033],
      [53089, 53104],
      [54000],
      [56347, 56349],
      [57068, 57069],
      [58760, 58762],
      [58800, 58810],
      [58816, 58818],
      [28826],
      [58828, 58866],
      [58953, 58958],
      [59102, 59103],
      [59106],
      [59127],
      [59129],
      [59137, 59166],
      [59650],
      [59766],
      [59781, 59790],
    ];
  });

  static zipcode2is_island(zipcode:(string|number)):boolean{
    const cls = AddressTool;
    const x = +zipcode;

    return cls.zipcodespans_island().some(
      span => (span[0] <= x) && (x <= ArrayTool.last(span))
    );
  }
}