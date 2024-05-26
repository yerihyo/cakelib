export default class NavermapTool{
  static placeid2url(placeid:string):string{
    return `https://map.naver.com/v5/entry/place/${placeid}`;
  }
}