export default class SetTool {
  // https://stackoverflow.com/a/31129384

  static list2set_or_undef<T>(l:T[]):Set<T>{
    return l == null ? undefined : (new Set(l));
  }

  static all(f, set_in) {
    for (var x of set_in) if (!f(x)) return false;
    return true;
  }

  static bool<T>(x:Set<T>){ return x && !SetTool.isEmpty(x); }
  static isEmpty<T>(x:Set<T>): boolean {
    if (x == null) { return undefined; }
    return x.size === 0;
  }

  static in(x, h) {
    return h.has(x)
  }

  static xor<T>(s1:Set<T>, s2:Set<T>): Set<T>{
    const cls = SetTool;
    return cls.subtract(cls.cup(s1,s2),cls.cap(s1,s2));
  }


  static equals(set1, set2) {
    if (set1.size !== set2.size) { return false }

    for (let x of set1) {
      if (!this.in(x, set2)) { return false }
    }
    return true
  }


  static cup<T>(...sets:Iterable<T>[]):Set<T>{
    return new Set(sets.map(x => [...x]).flat());
  }

  static cap<T>(...sets:Set<T>[]):Set<T>{
    if(!sets){ return undefined; }
    if(sets.length===0){ return new Set(); }

    const cap2 = (s1:Set<T>, s2:Set<T>) => {
      return new Set([...s1].filter(x => s2.has(x)));
    };
    return sets.slice(1).reduce(cap2, sets[0]);
  }

  static issuperset<T>(s1:Set<T>, s2:Iterable<T>):boolean{
    for (const t of s2) {
      if (!s1.has(t)) { return false; }
    }
    return true;
  }
  static issubset<T>(s1:Iterable<T>, s2:Set<T>):boolean{
    return SetTool.issuperset(s2, s1);
  }

  static subtract<T>(s1:Iterable<T>, s2:Set<T>):Set<T>{
    return new Set([...s1].filter(x => !s2.has(x)));
  }

}