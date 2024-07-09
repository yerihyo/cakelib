const time2iso = (d:Date) => d?.toISOString()?.split("T")?.[1];

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

  // static pattern2span = (pattern:RegExp, str:string):[number,number] => {
  //   const callname = `RegexTool.pattern2span @ ${time2iso(new Date())}`;

  //   const match = pattern.exec(str);
  //   console.log({
  //     callname,
  //     'match?.index':match?.index,
  //     'pattern.lastIndex':pattern.lastIndex,
  //     match,
  //   });
  //   return match == null ? undefined : [match.index, pattern.lastIndex];
  // }

  static match2span = (match:RegExpExecArray):[number,number] => {
    const callname = `RegexTool.match2span @ ${time2iso(new Date())}`;

    // console.log({
    //   callname,
    //   // 'match?.index':match?.index,
    //   // 'pattern.lastIndex':pattern.lastIndex,
    //   match,
    // });
    return match == null ? undefined : [match.index, match.index + match[0].length];
  }

  static result2endindex(r:RegExpExecArray){
    return r == null ? undefined : r.index + r[0].length;
  }

  static pattern_email(){
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  }

  static string2is_email = (x:string):boolean => RegexTool.pattern_email().test(x);
  // return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(x);
}
