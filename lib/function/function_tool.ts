
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


export default class FunctionTool{

    static f_onetoone2f_manytomany_notnull = <X, A extends any[], R>(
        f_onetoone:(x:X, ...args:A) => R,
    ):((l:X[], ...args:A) => R[]) => {
        return (l:X[], ...args:A):R[] => l?.map(x => f_onetoone(x, ...args))?.filter(r => r!=null);
    }

    static f_onetomany2f_manytomany = <X, A extends any[], R>(f_single:(x:X, ...args:A) => R[]):((l:X[], ...args:A) => R[]) => {
        return (l:X[], ...args:A):R[] => l?.map(x => f_single(x, ...args))?.flat();
    }

    static func_condition2skipped = <A extends any[]=any[],F extends Function=Function>(f: F, f_cond: (...any: A) => boolean): F => {
        // https://stackoverflow.com/a/28998603
        return <any>((...args:A) => {
            if(f_cond(...args)){ return undefined; }
            return f(...args)
        });
    }

    static func2nullargsskipped = <
        A extends any[] = any[],
        F extends Function = Function
    >(f: F): F => FunctionTool.func_condition2skipped(f, (...any: A) => any?.some(x => x == null))

    static unary_condition2skipped = <I,O>(f:Unaryfunc<I,O>, f_cond:(x?:I) => boolean):Unaryfunc<I,O> => {
        return (x:I) => f_cond(x) ? (x as unknown as O) : f(x);
    }
    static unary2nullskipped = <I = any, O = any>(f: Unaryfunc<I, O>): Unaryfunc<I, O> => FunctionTool.func2nullargsskipped(f);
    static binary2nullskipped = <Y, X1, X2>(f: Binaryfunc<Y, X1, X2>): Binaryfunc<Y, X1, X2> => FunctionTool.func2nullargsskipped(f);

    // static func2skipped<F extends CallableFunction> = (
    //     f:CallableFunction,
    //     f_cond:
    // ) 
    static deprecated(
        f:CallableFunction
    ){
        return (...args:any[]) => {
            throw new Error(`Function deprecated : ${f.name}`)
            // return f();    
        }
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
    //     FunctionTool.func2nullargsskipped,
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
