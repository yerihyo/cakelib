
import lodash from 'lodash';
import NativeTool from '../native/native_tool';

export type Unaryfunc<I,O> = (i:I) => O;
export type Binaryfunc<O,I1,I2> = (i1:I1, i2:I2) => O;

// https://stackoverflow.com/a/73939891
// export type AllLess<T extends ReadonlyArray<unknown>> = T extends readonly [...infer Head, any] ? AllLess<Head> | T : T;

// function f<A extends Function>(a:A):A {
//     var newFunc = (...x:any[]) => {
//         console.log('('+x.join(',')+') => ', a.apply(undefined, x));
//         return null;
//     }
//     return <any>newFunc;
// }

export type FuncAO<O,A extends any[]> = ((...args:A) => O);
export type FuncAB<A extends any[]> = ((...args:A) => boolean);
export type FuncAX<A extends any[]> = ((...args:A) => any);
export type FuncIO<O,I> = ((i:I) => O);
export type FuncXX<X> = (x:X) => X;
export type AfuncXX<X> = (x:X) => X|Promise<X>;
export type Funcwrapper<O,A extends any[]> = (f:FuncAO<O,A>) => FuncAO<O,A>;

export default class FunctionTool{

  // static f_onetoone2f_manytomany_notnull = <X, A extends any[], R>(
  //     f_onetoone:(x:X, ...args:A) => R,
  // ):((l:X[], ...args:A) => R[]) => {
  //     return (l:X[], ...args:A):R[] => l?.map(x => f_onetoone(x, ...args))?.filter(r => r!=null);
  // }

  static fxn2fx1 = <A extends any[], R>(f1n:(...args:A) => R[]):((...args:A) => R) =>
    lodash.flow(
      f1n, 
      (l:R[]):R => { // ArrayTool.l2one
        if(l == null) return undefined; 
        if([0,1].includes(l?.length)) return l?.[0];
        throw new Error(`l?.length=${l?.length}`);
      },
    )

  static f112fnn = <X, A extends any[], R>(f1:(x:X, ...args:A) => R):((l:X[], ...args:A) => R[]) => 
    (l:X[], ...args:A):R[] => f1 == null ? undefined : l?.map(x => f1?.(x, ...args));

  static f12fn = FunctionTool.f112fnn;

  static f1n2fnn = <X, A extends any[], R>(
    f1n:(x:X, ...args:A) => R[],
    option?:{l2is_valid?: (l:R[]) => boolean}
  ):((l:X[], ...args:A) => R[]) => {
    const l2is_valid = option?.l2is_valid ?? ((l:R[]) => Boolean(l));

    return lodash.flow(
      FunctionTool.f112fnn(f1n),
      ll => ll?.filter(l2is_valid)?.flat(),
    );
  }
  static f12fn_flat = FunctionTool.f1n2fnn;

  static fny2f1y = <X, A extends any[], R>(fny:(l:X[], ...args:A) => R):((x:X, ...args:A) => R) =>
    (x:X, ...args:A):R => fny == null ? undefined : fny?.(x == null ? (x as X[]) : [x], ...args);
  
  static f1b2f_every = <X, A extends any[]>(f_decider:(x:X, ...args:A) => boolean,) =>
    (l:X[], ...args:A) => l?.every(x => f_decider(x, ...args));

  static f1b2f_some = <X, A extends any[]>(f_decider:(x:X, ...args:A) => boolean,) =>
    (l:X[], ...args:A) => l?.some(x => f_decider(x, ...args));
  
  // static f11_decider2fn1_every =  <X, A extends any[], R>(
  //   f11:(x:X, ...args:A) => R,
  //   f_decider: (r:R) => boolean,
  // ):((l:X[], ...args:A) => boolean) => lodash.flow(
  //   FunctionTool.f112fnn(f11),
  //   FunctionTool.f_decider2fn1_every(f_decider),
  // )

  // static f1b2fn1_every = <X, A extends any[]>(
  //   f11:(x:X, ...args:A) => boolean,
  // ):((l:X[], ...args:A) => boolean) => lodash.flow(
  //   FunctionTool.f112fnn(f11),
  //   FunctionTool.f_decider2fn1_every(Boolean),
  // )

  // static f_skip2wrapper = <O, A extends any[]>(
  //     f_skip:(...args:A) => boolean,
  // ):Funcwrapper<O,A> => {
  //     // https://stackoverflow.com/a/28998603
  //     return (f:((...args:A) => O)) => {
  //         return (...args:A):O => {
  //             return f_skip(...args) ? undefined : f(...args);
  //         }
  //     }
  // }

  static func2skipped = <O, A extends any[]>(
    f: FuncAO<O,A>,
    f_skip:FuncAB<A>,
  ):FuncAO<O,A> => {
    // https://stackoverflow.com/a/28998603
    return (...args:A):O => {
      if(f_skip(...args)){ return undefined; }
      return f(...args);
    }
  }

  // static f_skip2func_conditioned = <O,A extends any[],>(
  //     f: (...args:A) => O,
  //     f_skip: (...args: A) => boolean,
  // ): (...args:A) => O => {
  //     return FunctionTool.f_skip2wrapper<O,A>(f_skip)(f)
  // }
  
  static func2conditioned = <O,A extends any[],>(
    f: FuncAO<O,A>,
    f_cond: FuncAB<A>,
  ): FuncAO<O,A> => {
    // https://stackoverflow.com/a/28998603
    return (...args:A) => {
      if(!f_cond(...args)){ return undefined; }
      return f(...args);
    }
  }

  // static wrapper_nullargsskip = <O, A extends any[],>() => FunctionTool.f_skip2wrapper<O,A>((...args) => (args?.some(x => x == null)));
  static func2undef_ifany_nullarg = <O, A extends any[],>(
    f: FuncAO<O,A>,
  ): FuncAO<O,A> => {
    const f_skip = (...args:A) => args?.some(x => x == null);
    return FunctionTool.func2skipped(f, f_skip);
  }

  static unary_condition2skipped = <I,O>(f:Unaryfunc<I,O>, f_cond:(x?:I) => boolean):Unaryfunc<I,O> => {
    return (x:I) => f_cond(x) ? (x as unknown as O) : f(x);
  }
  static unary2nullskipped = <I = any, O = any>(f: Unaryfunc<I, O>): Unaryfunc<I, O> => FunctionTool.func2undef_ifany_nullarg(f);
  static binary2nullskipped = <Y, X1, X2>(f: Binaryfunc<Y, X1, X2>): Binaryfunc<Y, X1, X2> => FunctionTool.func2undef_ifany_nullarg(f);

  static deprecated = <O,A extends any[]>(f:FuncAO<O,A>):FuncAO<O,A> => {
    return (...args:A) => {
      throw new Error(`Function deprecated : ${f.name}`)
      // return f();
    }
  }

  static func2preempted = <O1,O2,A extends any[]>(
    f:(...args:A) => O1,
    f_preempt:(...args:A) => O2,
  ):((...args:A) => O2) => {
    return f_preempt;
    // return (...args:A) => f_preempt(...args);
  }

  // https://stackoverflow.com/a/6000009
  static is_function = (v:any) => (typeof v === 'function');
  // static yoo_piped = (func, kwargs) => {
  //     func(kwargs)
  //     return kwargs
  // }

  // static func2negated3 = (f:Function) => FunctionTool.unary2nullskipped(lodash.negate(f));
  // static func2negated3 = lodash.flow(
  //     lodash.negate,
  //     FunctionTool.func2undef_ifany_nullarg,
  // );
  static func2negated3 = <A extends any[]>(f:FuncAB<A>):((...args:A) => boolean) => lodash.flow(f, NativeTool.negate3);
  // static func2negated3 = <A extends any[]=any[]>(f:(...args:A) => boolean):((...args:A) => boolean) => {
  //     return (...args:A) => NativeTool.negate3(f(...args));
  // }

  // static repeat = (func, period) => {
  //     useEffect(() => {
  //         const interval = setInterval(func, period)
  //         return () => clearInterval(interval)
  //     }, []);
  // }

  // static kwargs2partial(func: any, kwargs_partial: Object){
  //     const kwargs2result = (kwargs_main: Object) => {
  //         const kwargs = merge({}, kwargs_partial, kwargs_main)
  //         // console.log({func, kwargs})
  //         return func(kwargs)
  //     };
  //     return kwargs2result;
  // }

  // static funcs2piped = flow;
  // static funcs2piped = <I,O>(functions:((x:any) => any)[]) => (x_in:I) => {
  //     return functions.reduce((x, f) => f(x), x_in) as O;
  // };

  // static f_equal2f_key_prepiped(f_equal, f_key,){
  //     return (x1,x2) => {
  //         const [v1, v2] = [f_key(x1), f_key(x2)];
  //         // console.log({v1,v2});
  //         return f_equal(v1, v2);
  //     }
  // }
  
  /**
   * https://github.com/vercel/swr/issues/873
   */
  static applyFn = <O,A extends any[]>(fn:FuncAO<O,A>, ...args:A):O => fn(...args);

  static fs2f_every = <A extends any[]>(fs: FuncAB<A>[]):FuncAB<A> => {
    return (...args:A) => fs?.every(f => f(...args));
  };
  
  // static func2wrapped(wrapper, f){
  //     return wrapper(f);
  // }

  static func2wrapper_tee = <O,A extends any[]>(fn:FuncAX<A>):Funcwrapper<O,A> => {
    return (f:FuncAO<O,A>):FuncAO<O,A> => {
      return (...args:A):O => {
        fn(...args);
        return f(...args);
      }
    }
  }

  static func2f_tee = <X>(fn:(x:X) => any):FuncXX<X> => {
    return (x:X):X => {
      fn(x);
      return x;
    }
  }

  static errorhandler_func2wrapped = <O,A extends any[]>(
    f_handleerror:(...args:any[]) => any,
    f:FuncAO<O,A>,
  ):FuncAO<O,A> => {
    return (...args:A):O => {
      try{
        return f(...args)
      }
      catch(e){
        return f_handleerror(...args);
      }
    }
  }

  static fax2fbx = <A extends any[],B extends any[],X>(
    f_ax:FuncAO<X,A>,
    encode: (b:B) => A,
  ):FuncAO<X,B> => {
    return (...b:B) => f_ax(...encode(b));
  }
}
