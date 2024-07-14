
import lodash, { flow, merge } from 'lodash';
import NativeTool from '../native/native_tool';

export type Unaryfunc<I,O> = (i:I) => O;
export type Binaryfunc<O,I1,I2> = (i1:I1, i2:I2) => O;
export type Typeinvariantfunc<X> = (i:X) => X;

// function f<A extends Function>(a:A):A {
//     var newFunc = (...x:any[]) => {
//         console.log('('+x.join(',')+') => ', a.apply(undefined, x));
//         return null;
//     }
//     return <any>newFunc;
// }

export type Funcwrapper<O,A extends any[]> = (f:((...args:A) => O)) => ((...args:A) => O);

export default class FunctionTool{
    static deprecated = <O, A extends any[]>(
        f:(...args:A) => O,
    ) => {
        return (...args:A):O => {
            throw new Error(`Function deprecated : ${f.name}`)
            // return f();    
        }
    }

    static f_onetoone2f_manytomany = <X, A extends any[], R>(
        f_onetoone:(x:X, ...args:A) => R,
    ):((l:X[], ...args:A) => R[]) => {
        return (l:X[], ...args:A):R[] => l?.map(x => f_onetoone(x, ...args));
    }


    // static f_onetoone2f_manytomany_notnull = <X, A extends any[], R>(
    //     f_onetoone:(x:X, ...args:A) => R,
    // ):((l:X[], ...args:A) => R[]) => {
    //     return (l:X[], ...args:A):R[] => l?.map(x => f_onetoone(x, ...args))?.filter(r => r!=null);
    // }

    static f_onetomany2f_manytomany = <X, A extends any[], R>(f_single:(x:X, ...args:A) => R[]):((l:X[], ...args:A) => R[]) => {
        return (l:X[], ...args:A):R[] => l?.map(x => f_single(x, ...args))?.flat();
    }

    /** 
     * WARNING!!!!
     * Typescript cannot automatically propagate original input functions types to wrapped output function types.
     * When used, another manual wrapper necessary for proper type propagation
     **/
    static f_cond2wrapper = FunctionTool.deprecated(<O, A extends any[]>(
        f_cond:(...args:A) => boolean,
    ):Funcwrapper<O,A> => {
        // https://stackoverflow.com/a/28998603
        return (f:((...args:A) => O)) => {
            return (...args:A):O => {
                if(f_cond(...args)){ return f(...args); }
                else{ return undefined; }
            }
        }
    });

    /** 
     * WARNING!!!!
     * Typescript cannot automatically propagate original input functions types to wrapped output function types.
     * When used, another manual wrapper necessary for proper type propagation
     **/
    static f_skip2wrapper = FunctionTool.deprecated(<O, A extends any[]>(
        f_skip:(...args:A) => boolean,
    ):Funcwrapper<O,A> => {
        return FunctionTool.f_cond2wrapper(lodash.flow(f_skip, Boolean));
    })

    // static f_skip2func_conditioned = <O,A extends any[],>(
    //     f_skip: (...args: A) => boolean,
    //     f: (...args:A) => O,
    // ): (...args:A) => O => {
    //     return FunctionTool.f_skip2wrapper<O,A>(f_skip)(f)
    // }
    
    static fcond_func2wrapped = <O,A extends any[],>(
        f_cond: (...args: A) => boolean,
        f: (...args:A) => O,
    ): (...args:A) => O => {
      return (...args: A) => {
        if(!f_cond(...args)){ return undefined; }
        return f(...args);
      }
    }
    static fskip_func2wrapped = <O,A extends any[],>(
        f_skip: (...args: A) => boolean,
        f: (...args:A) => O,
    ): (...args:A) => O => FunctionTool.fcond_func2wrapped(lodash.flow(f_skip, Boolean), f);
    
    // static func_condition2skipped = <
    //     O,
    //     A extends any[],
    //     // F extends (...any:A) => R,
    // >(
    //     f: (...args:A) => O,
    //     f_cond: (...args: A) => boolean,
    // ): (...args:A) => O => {
    //     // https://stackoverflow.com/a/28998603
    //     return (...args:A) => f_cond(...args) ? f(...args) : undefined;
    // }

    // static wrapper_nullargsskip = <O, A extends any[],>() => FunctionTool.f_skip2wrapper<O,A>((...args) => (args?.some(x => x == null)));
    static func2undef_ifany_nullarg = <O, A extends any[],>(
        f: (...args:A) => O,
    ): ((...args:A) => O) => {
        const wrapper_nullargsskip = FunctionTool.f_skip2wrapper<O,A>((...args) => (args?.some(x => x == null)));
        return wrapper_nullargsskip(f)
    }

    static unary_condition2skipped = <I,O>(f:Unaryfunc<I,O>, f_cond:(x?:I) => boolean):Unaryfunc<I,O> => {
        return (x:I) => f_cond(x) ? (x as unknown as O) : f(x);
    }
    static unary2nullskipped = <I = any, O = any>(f: Unaryfunc<I, O>): Unaryfunc<I, O> => FunctionTool.func2undef_ifany_nullarg(f);
    static binary2nullskipped = <Y, X1, X2>(f: Binaryfunc<Y, X1, X2>): Binaryfunc<Y, X1, X2> => FunctionTool.func2undef_ifany_nullarg(f);

    // static func2skipped<F extends CallableFunction> = (
    //     f:CallableFunction,
    //     f_cond:
    // ) 

    static func2preempted = <O1,O2,A extends any[]>(
        f:(...args:A) => O1,
        f_preempt:(...args:A) => O2,
    ):((...args:A) => O2) => {
        return f_preempt;
        // return (...args:A) => f_preempt(...args);
    }

    static is_function(v:any){
        // https://stackoverflow.com/a/6000009
        return typeof v === 'function';
    }
    static yoo_piped = (func, kwargs) => {
        func(kwargs)
        return kwargs
    }

    // static func2negated3 = (f:Function) => FunctionTool.unary2nullskipped(lodash.negate(f));
    // static func2negated3 = lodash.flow(
    //     lodash.negate,
    //     FunctionTool.func2undef_ifany_nullarg,
    // );
    static func2negated3 = <A extends any[]=any[]>(f:(...args:A) => boolean):((...args:A) => boolean) => lodash.flow(f, NativeTool.negate3);
    // static func2negated3 = <A extends any[]=any[]>(f:(...args:A) => boolean):((...args:A) => boolean) => {
    //     return (...args:A) => NativeTool.negate3(f(...args));
    // }

    // static repeat = (func, period) => {
    //     useEffect(() => {
    //         const interval = setInterval(func, period)
    //         return () => clearInterval(interval)
    //     }, []);
    // }

    static kwargs2partial(func: any, kwargs_partial: Object){
        const kwargs2result = (kwargs_main: Object) => {
            const kwargs = merge({}, kwargs_partial, kwargs_main)
            // console.log({func, kwargs})
            return func(kwargs)
        };
        return kwargs2result;
    }

    static funcs2piped = flow;
    // static funcs2piped = <I,O>(functions:((x:any) => any)[]) => (x_in:I) => {
    //     return functions.reduce((x, f) => f(x), x_in) as O;
    // };

    static f_equal2f_key_prepiped(f_equal, f_key,){
        return (x1,x2) => {
            const [v1, v2] = [f_key(x1), f_key(x2)];
            // console.log({v1,v2});
            return f_equal(v1, v2);
        }
    }
    
    /**
     * https://github.com/vercel/swr/issues/873
     */
    static applyFn(fn, ...args){
        return fn(...args);
    }

    static func2wrapped(wrapper, f){
        return wrapper(f);
    }
}
