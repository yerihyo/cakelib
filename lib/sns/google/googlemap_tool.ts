import { Pair } from "../../native/native_tool";

export default class GooglemapTool{
  // Google Maps URLs (공식 문서화된 포맷): https://developers.google.com/maps/documentation/urls/get-started
  static latlon2url = (latlon:Pair<number>):string =>
    latlon == null ? undefined : `https://www.google.com/maps/search/?api=1&query=${latlon[0]},${latlon[1]}`;

  /** 검색어로 찾기 — 장소 id 를 모를 때 (같은 공식 포맷). 빈 검색어는 undefined */
  static query2url = (query:string):string =>
    !query?.trim() ? undefined : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}
