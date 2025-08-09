
import lodash from 'lodash';
import { EqualTool } from '../../cmp/CmpTool';
import NativeTool, { Dictkey } from '../../native/native_tool';
import ArrayTool from '../array/array_tool';
// import assert from "assert";

const time2iso = (d:Date) => d?.toISOString()?.split("T")?.[1];
// const assert = require('assert');
export default class DictTool{
    static keys = <K=Dictkey>(obj:any): K[] => (obj != null ? (Object.keys(obj) as K[]) : undefined);
    static values = <X,H=any>(obj:H):X[] => (obj != null ? Object.values(obj) : undefined);

    static in = (k:Dictkey, obj:any):boolean => (k in (obj ?? {}));
    static has_key = (h:any, k:Dictkey) => DictTool.in(k,h);


    static kv2h_or_undef = (k:Dictkey, v:any):Object => v== null ? undefined : {[k]:v};

    static entries = <K extends Dictkey=Dictkey,V=any>(obj:Record<K,V>):[K, V][] => {
        return obj == null ? undefined : Object.entries(obj) as [K, V][];
    }

    static size(obj){
        return obj ? Object.keys(obj).length : undefined;
    }
    static is_empty = function(obj){
        return Object.keys(obj).length === 0;
    }

    static dict2key_mutated<V,K1 extends Dictkey=Dictkey,K2 extends Dictkey=Dictkey>(
        h:Record<K1,V>,
        mutate_key:(k1:K1) => K2,
    ):Record<K2,V>{
        return (Object.entries(h) as [K1,V][])
            .map(([k1, v]) => [mutate_key(k1), v])
            .reduce((h, [k2, v]) => ({ ...h, [k2 as K2]: v }), {}) as Record<K2,V>;
    }
    // static key_value2addreplaced<H,V>(obj: H, key: string, value: V): H {
    //     return {
    //         ...DictTool.keys2excluded(obj, [key]),
    //         ...(value != null ? { [key]: value } : {}),
    //     };
    // }

    static entries2dict<V, K extends Dictkey=Dictkey>(entries: [K, V][]): Record<K,V> {
        return entries?.reduce((h, [k, v]) => {
            if(k in h){
                throw new Error(`Duplicate key: (k:${k?.toString()})`);
            }

            h[k] = v;
            return h;
        }, {} as Record<K,V>);
    }
    static pairlist2dict = DictTool.entries2dict;

    static merge_dicts_noduplicatekey<T>(dicts: Record<Dictkey, T>[]): Record<Dictkey, T> {
        return DictTool.merge_dicts(dicts, DictTool.WritePolicy.no_duplicate_key,)
    }

    static update_if_changed(
        dict_in: Object,
        dict_update: Object,
        options?: { is_equal?: (x1: any, x2: any) => boolean, },
    ): Object {
        const cls = DictTool;

        const is_equal = options?.is_equal ?? EqualTool.isStrictlyEqual;

        const keys_different = Object.keys(dict_update).filter(k => !is_equal(dict_update[k], dict_in[k]));
        if(!ArrayTool.bool(keys_different)){ return dict_in; }

        const dict_updating = DictTool.merge_dicts(
            keys_different.map(k => ({k:dict_update[k]})),
            DictTool.WritePolicy.no_duplicate_key,
        );
        return {
            ...dict_in,
            ...dict_updating,
        }
    }

    // static dropkey_if_exists<X extends Object=Object>(dict_in:X, key:string): X{
    //     if(!(key in dict_in)){ return dict_in as X; }

    //     return DictTool.entries2dict(Object.entries(dict_in).filter(([k,v]) => k!==key));
    // }

    static contains(
        h1: any,
        h2: any,
        options?: {
            isEqual?: (x1: any, x2: any) => boolean,
        }): boolean {

        const isEqual = options?.isEqual ?? EqualTool.isStrictlyEqual;
        return Object.entries(h2).every(([k, v]) => isEqual(h1?.[k], v));
    }

    // static clone2self<T>(t1: T, t2: T): T {
    //     Object.keys(t1).filter(k => !(k in t2)).forEach(k => delete t1[k]);
    //     Object.keys(t1).forEach(k => t1[k] = t2[k]);
    //     return t1;
    // }

    static toggleKey<K extends Dictkey>(h:Record<K,boolean>, k:K) : Record<K,boolean>{
        if(k in h){ delete h[k]; }
        else{ h[k] = true; }
        return h;
    }

    static arraydict2reversed = <K extends Dictkey, V extends Dictkey>(arraydict:Record<K,V[]>) : Record<V,K> => {
        const records:Record<V,K>[] = DictTool.entries(arraydict).map(([k, l]) => l.map(s => ({[s]:k}) as Record<V,K>)).flat();
        return DictTool.merge_dicts<Record<V,K>>(records, DictTool.WritePolicy.no_duplicate_key);
    }

    static dict2values_mapped<K extends Dictkey, V1, V2,>(
        dict_in: Record<K,V1>,
        kv2mapped: (k: K, item: V1) => V2,
    ): Record<K,V2> {
        if(dict_in == null){ return undefined; }
        
        if(!kv2mapped){
            return dict_in as unknown as Record<K,V2>;
        }
        const entries: [K, V1][] = Object.entries(dict_in) as [K, V1][];
        const dict_out = entries.reduce((h, [k, v]) => ({ ...h, [k]: kv2mapped(k, v), }), {}) as Record<K,V2>;
        return dict_out;
    }
    static apply2values = DictTool.dict2values_mapped;
    // static values2mapped = DictTool.dict2values_mapped;

    static transduce(
        obj:any,
        transducer: (k:string,v:any) => [string, any],
    ){
        const reducer = (h: any, [k, v]: [string, any]) => {
            const [k2, v2] = transducer(k, v);
            return { ...h, [k2]: v2 };
        };
        return Object.entries(obj).reduce(reducer, {});
    }

    

    static bool(h){
        if(!h){ return false }
        if(DictTool.is_empty(h)){ return false }
        return true
    }

    // static reversed(h) {
    //     return Object.keys(h).reverse().reduce((hh,k) => { hh[k] = h[k]; return hh; }, {});
    // }

    // static partial2has_change(dict_prev, dict_partial){
    //     for (const [k,v_partial] of Object.entries(dict_partial)){
    //         if(! this.has_key(dict_prev, k)){
    //             return true
    //         }
            
    //         const v_prev = dict_prev[k]
    //         if(v_prev !== v_partial){
    //             return true
    //         }
    //     }
    //     return false
    // }

    static dict2pruned<X,V>(obj:X, kv2is_valid:(k:string, v:V) => boolean):X{
        const cls = DictTool;
        const callname = `DictTool.invalid_values2excluded @ ${time2iso(new Date())}`;
        
        // console.log({callname, obj})
        if(obj == null){ return undefined; }

        if(Array.isArray(obj)){ return obj; }

        const keys = Object.keys(obj);
        if(ArrayTool.is_empty(keys)){ return obj; }
        
        const is_object = (v:any) => typeof v === "object";
        
        // https://stackoverflow.com/a/38340730
        return keys
            .filter(k => kv2is_valid(k, obj[k])) // Remove undef. and null.
            .reduce(
                (newObj, k) => {
                    const is_dict = DictTool.is_dict(obj[k]);
                    // console.log({callname, is_dict, k, obj, 'obj[k]':obj[k],})
                    return is_dict
                        ? { ...newObj, [k]: cls.dict2pruned(obj[k], kv2is_valid) } // Recurse.
                        : { ...newObj, [k]: obj[k] };
                }, // Copy value.
                {} as X,
            );
    }

    static invalid_values2excluded = <X=any>(obj:X, value2is_valid:(x:any) => boolean):X => DictTool.dict2pruned(obj, (k,v) => value2is_valid(v));

    static empty_values2excluded(obj){
        const self = DictTool;
        // const value2is_valid = (v) => !!v;
        const value2is_valid = v => !NativeTool.is_null_or_undefined(v);
        return self.invalid_values2excluded(obj, value2is_valid)
    }
    static undef_if_false(obj_in){
        return DictTool.bool(obj_in) ? obj_in : undefined;
    }
    static undef_values2excluded = function(obj_in){
        const value2is_valid = (v) => (v !== undefined);
        const obj_out = this.invalid_values2excluded(obj_in, value2is_valid);
        return obj_out
    }
    static null_values2excluded = <X=any>(x:X):X => DictTool.invalid_values2excluded(x, v => v !== null);

    static ll2dict = function(ll, vwrite=null) {
        NativeTool.assert(vwrite === null)  // assuming overwrite
        
        let h = {}
        ll.forEach(kv => h[kv[0]] = kv[1])
        return h
    }

    // static array2map = function(items, key, vwrite=null) {
    //     return ArrayTool.array2dict(items, key, vwrite=vwrite)
    // }

    static get<V, K extends Dictkey>(
        h: Record<K, V>,
        k: K,
        v_default?: V,
    ): V {
        // const callname = `DictTool.get @ ${time2iso(new Date())}`;
        if (!h) { return v_default!; }

        // console.log({callname, h:stringify(h),})
        return (k in h)?h[k]:(v_default!)
    }

    static dict2filtered = <H>(
        h_in: H,
        filter: (k:Dictkey, v?: any) => boolean,
    ): H => {
        if (!h_in) { return undefined; }

        return Object.entries(h_in)
            .filter(([k, v]) => filter(k, v))
            .reduce((h, [k, v]) => ({ ...h, [k]: v }), {}) as H;
    }
    static keys2filtered = <H>(h_in: H, keys: Dictkey[]): H => DictTool.dict2filtered(h_in, k => keys.includes(k));
    static keys2excluded = <H>(h_in: H, keys: Dictkey[]): H => DictTool.dict2filtered(h_in, k => !keys.includes(k));

    static dict2valuetypeonly = <H>(h_in:H) => DictTool.dict2filtered(h_in, (k,v) => !NativeTool.x2is_function(v));

    static is_dict = function(v){ 
        // https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary
        return v && v.constructor == Object 
    }

    static WritePolicy = class {
        static overwrite(h1, h2, k){
            NativeTool.assert(k in h2)
            h1[k] = h2[k]
            return h1
        }

        // static overwrite_notnull(h1, h2, k){
        //     NativeTool.assert(k in h2)
        //     if(h2[k]!=null){ h1[k] = h2[k]; }
        //     return h1
        // }

        // static overwrite_notnonzerofalse(h1, h2, k){
        //     NativeTool.assert(k in h2)
        //     if(h2[k]===0 || !!h2[k]){ h1[k] = h2[k]; }
        //     return h1
        // }

        static skip_if_exists(h1, h2, k){
            NativeTool.assert(k in h2)
            if(! (k in h1)){
                h1[k] = h2[k]
            }
            return h1
        }
        static skip_if_identical(h1, h2, k){
            NativeTool.assert(k in h2)
            const v2 = h2[k]
            if(!(k in h1)){ h1[k] = h2[k] }
            else{
                const v1 = h1[k]
                if(v1 != v2){
                    throw new Error(`Value not identical: ${v1} != ${v2}`)
                }
            }
            return h1
        }
        static no_duplicate_key(h1, h2, k){
            NativeTool.assert(k in h2)
            if(k in h1){
                throw new Error(`Duplicate key: '${k}'`)
            }
            h1[k] = h2[k]
            return h1
        }
        static add(h1, h2, k){
            NativeTool.assert(k in h2)
            const v1 = (k in h1) ? h1[k] : 0
            const v = v1 + h2[k]
            h1[k] = v
            return h1
        }
        static sum(h1,h2,k){
            return DictTool.WritePolicy.add(h1,h2,k);
        }

        static max(h1, h2, k){
            NativeTool.assert(k in h2)
            if(!(k in h1)){ return h2[k]; }

            const v1 = h1[k];
            const v_out = Math.max(v1, h2[k]);
            // console.log({v1, 'h2[k]':h2[k], v_out, });
            h1[k] = v_out;
            return h1;
        }
        
        static extend(h1, h2, k){
            const v1 = (k in h1) ? h1[k] : [];
            h1[k] = [...v1, ...h2[k]];
            return h1;
        }

        static union<T>(h1:Record<string,T[]>, h2:Record<string,T[]>, k:string){
            const v1 = (k in h1) ? h1[k] : [];
            h1[k] = lodash.union(v1, h2[k]);
            return h1;
        }

        static policy2dict_policy = (policy_in) => {
            const policy_out = (h1, h2, k) => {
                NativeTool.assert(k in h2)
                
                if(!(k in h1)){
                    return policy_in(h1, h2, k)
                }
                const v1 = h1[k]
                const v2 = h2[k]
                if ((DictTool.is_dict(v1) && DictTool.is_dict(v2))) {
                    const v_out = DictTool.merge_dicts([v1, v2], policy_out)
                    h1[k] = v_out
                    return h1;
                }
                else{
                    return policy_in(h1, h2, k)
                }
            }
            return policy_out
        }

        // merge_deep: https://stackoverflow.com/a/34749873/1902064
        static dict_overwrite = (h1,h2,k) => DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.overwrite)(h1,h2,k);
        static dict_skip_if_exists = (h1,h2,k) => DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.skip_if_exists)(h1,h2,k);
        static dict_no_duplicate_key = (h1,h2,k) => DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.no_duplicate_key)(h1,h2,k);
        // static dict_overwrite_notnull = (h1,h2,k) => DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.overwrite_notnull)(h1,h2,k);
        // static dict_overwrite_notnonzerofalse = (h1,h2,k) => DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.overwrite_notnonzerofalse)(h1,h2,k);
        
    }

    static merge2dict<T>( //) K extends Dictkey=Dictkey,>(
        h1: T,
        h2: T,
        write_policy: (h1: T, h2: T, k: string) => T,
    ): T {
        // if(write_policy === null){
        //     write_policy = this.WritePolicy.no_duplicate_key
        // }

        for (var k in h2) {
            h1 = write_policy(h1, h2, k);
        }
        return h1;
    }
    static merge_dicts<T>( //), V=any, K extends Dictkey=Dictkey, >(
        dicts: T[],
        write_policy: (h1: T, h2: T, k: string) => T,
    ):T{
        const cls = DictTool;
        if (dicts == null) { return undefined; }
        if (!dicts) { return {} as T; }
        if (dicts.length == 0) { return {} as T; }
        if (dicts.length == 1){ return dicts[0] }

        // console.log({'dicts.length':dicts.length})
        NativeTool.assert(dicts.length > 1)
        let h_out = Object.assign({}, dicts[0]) as T;
        dicts.slice(1,).forEach((h) => { cls.merge2dict(h_out, h, write_policy) })
        return h_out
    }

    static path_v2dict = (path:string[], v:any) => ArrayTool.reversed(path)?.reduce((h, edge) => ({[edge]:h}), v);
}

export class CounterTool {
    static counter2summed<K extends Dictkey>(
        counters: Record<K, number>[],
    ) : Record<K, number> {
        const counter:Record<K, number> = DictTool.merge_dicts(counters, DictTool.WritePolicy.add,);
        return counter;
    }
}
