import { Pair } from "../../native/native_tool";

export default class GooglemapTool{
  // Google Maps URLs (공식 문서화된 포맷): https://developers.google.com/maps/documentation/urls/get-started
  static latlon2url = (latlon:Pair<number>):string =>
    latlon == null ? undefined : `https://www.google.com/maps/search/?api=1&query=${latlon[0]},${latlon[1]}`;
}
