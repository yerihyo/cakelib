
export type SetStateActionAsync<V> = V | Promise<V> | ((v: V) => (V | Promise<V>));

export default class ReactTool{
  static is_serverside():boolean {
    const cls = ReactTool;
    // https://stackoverflow.com/a/13644360
    return !cls.is_clientside();
  }

  static is_clientside():boolean {
    const cls = ReactTool;

    // https://stackoverflow.com/a/13644360
    return (typeof window !== 'undefined' && !!window.document);
  }


  static can_use_dom():boolean{
    const cls = ReactTool;
    // https://stackoverflow.com/a/32598826
    return !!(
      cls.is_clientside()
      && window.document.createElement
    );
  }  

  // static prev2actioned<T>(
  //   action:React.SetStateAction<T>,
  //   prev:T,
  // ):T{
  //   const is_function = x => (typeof x === 'function');
  //   return is_function(action) ? (action as ((t: T) => T))(prev) : (action as T);
  // }

  static prev2reduced<I,O>(
    reducer: O | ((i: I) => O),
    prev:I,
  ):O{
    const is_function = x => (typeof x === 'function');
    return is_function(reducer) ? (reducer as ((t: I) => O))(prev) : (reducer as O);
  }

  static prev2actioned = <T>(action: React.SetStateAction<T>, prev: T,): T => ReactTool.prev2reduced(action, prev)
  // static prev2actioned = <T>ReactTool.prev2reduced<T,T>;
}