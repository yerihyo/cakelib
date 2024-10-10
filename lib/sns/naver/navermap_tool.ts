export default class NavermapTool{
  static placeid2url = (placeid:string):string => 
    placeid == null ? undefined : `https://map.naver.com/v5/entry/place/${placeid}`;
}