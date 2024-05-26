export default class RegexTool{
  static find_all = function(pattern:RegExp, str:string):RegExpExecArray[]{
    let matches:RegExpExecArray[] = [];
    let match:RegExpExecArray;
    while ((match = pattern.exec(str)) != null) {
      matches.push(match)
      // console.log(match.index + ' ' + pattern.lastIndex);
    }
    return matches;
  }

  static result2endindex(r:RegExpExecArray){
    return r == null ? undefined : r.index + r[0].length;
  }

  static pattern_email(){
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  }

  static string2is_email(x:string){
    return RegexTool.pattern_email().test(x);
    // return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(x);
  }
}
