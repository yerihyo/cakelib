import lodash from "lodash";
import ArrayTool from "../../collection/array/array_tool";
import DictTool from "../../collection/dict/dict_tool";
import DateTool from "../../date/date_tool";
import { Pair } from "../../native/native_tool";

export default class MongodbTool {

  static obj2id_removed = <T>(t:T):Omit<T,'_id'> => DictTool.keys2excluded(t,['_id'],);

  static value2is_unspecified = (v:any):boolean => v === undefined;

  static op2complement = (op:string) => {
    return {
      "$gt":"$lte",
      "$gte":"$lt",

      "$lt":"$gte",
      "$lte":"$gt",

      "$ne":"$eq",
      "$eq":"$ne",
    }[op];
  }

  static op2opposite = (op:string) => {
    return {
      "$gt":"$lt",
      "$gte":"$lte",

      "$lt":"$gt",
      "$lte":"$gte",

      "$ne":"$eq",
      "$eq":"$ne",
    }[op];
  }

  // static op2eqadded = (op:string) => {
  //   return {
  //     "$gt":"$gte",
  //     "$gte":"$gte",

  //     "$lt":"$lte",
  //     "$lte":"$lte",
  //   }[op];
  // }

  static span2qexpr<T>(span: Pair<T>): any {
    const callname = `MongodbTool.span2qexpr @ ${DateTool.time2iso(new Date())}`;
    if(span === undefined){ return undefined; } // all values
    if(span === null){ return null; } // specifically 'null' only

    if(ArrayTool.areAllTriequal(span, [null,null])){ return {$exists:true}; } // any value

    const [s, e] = span;
    const qexpr = {
      ...(s != null ? { '$gte': s } : {}),
      ...(e != null ? { '$lt': e } : {}),
    };

    // console.log({ callname, span, s, e, qexpr})
    return qexpr;
  }

  static key_value2body_setunset<T,>(key:string, value:T){
    return (value != null ? { '$set': { [key]:value, } } : { '$unset': { [key]: 1, } });
  }

  static queries2booled(op:string, queries:Record<string,any>[],){
    return queries == null
      ? undefined
      : queries.length == 1
        ? ArrayTool.l2one(queries)
        : { [op]: queries }
      ;
  }

  static queries2or = lodash.partial(MongodbTool.queries2booled, '$or');
  static queries2and = lodash.partial(MongodbTool.queries2booled, '$and');

  static qexpr2qvalues = <T>(qexpr: (T | { '$in': T[] })): T[] => {
    if (qexpr == null) { return undefined; }
    return DictTool.is_dict(qexpr)
      ? (qexpr as { '$in': T[] })?.['$in']
      : ArrayTool.one2l(qexpr as T);
  }

  static fvpairs_bicmp2query = (
    fvpairs:{field:string,vexpr:any}[],
    bicmp:string,
  ) => {
    return {
      '$or': fvpairs.map((_, i) => {
        return {
          ...DictTool.merge_dicts(
            fvpairs.slice(0,i).map(fvpair => ({[fvpair.field]: fvpair.vexpr,})),
            // ArrayTool.range(i).map(j => (
            //   {[fvpairs[j].field]: fvpairs[j].vexpr,}
            //   )),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          [fvpairs[i].field]: { [bicmp]: fvpairs[i].vexpr },
        };
      }),
    };
  }

  static fbvs2query = (
    fbvs:{field:string, bicmp:string, vexpr:any}[],
    // bicmp:string,
  ) => {
    return {
      '$or': fbvs.map((fbv_i, i) => {
        return {
          ...DictTool.merge_dicts(
            fbvs.slice(0,i).map(fbv => ({[fbv.field]: fbv.vexpr,})),
            // ArrayTool.range(i).map(j => fbvs_list[j].map(fbv => ({[fbv.field]: fbv.vexpr,})))?.flat(),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          [fbv_i.field]: { [fbv_i.bicmp]: fbv_i.vexpr },
        };
      }),
    };
  }

  static fbvs_list2query = (
    fbvs_list:{field:string, bicmp:string, vexpr:any}[][],
    // bicmp:string,
  ) => {
    return {
      '$or': fbvs_list.map((_, i) => {
        return {
          ...DictTool.merge_dicts(
            fbvs_list.slice(0,i).flat().map(fbv => ({[fbv.field]: fbv.vexpr,})),
            // ArrayTool.range(i).map(j => fbvs_list[j].map(fbv => ({[fbv.field]: fbv.vexpr,})))?.flat(),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          ...(fbvs_list[i]?.map(fbv => ({[fbv.field]: { [fbv.bicmp]: fbv.vexpr },})))
        };
      }),
    };
  }

  static ffbvs2query = (
    ffbvs: {field:string,nestedfield?:string, bicmp:string, vexpr:any}[],
  ) => {

    type FFBV = { field: string; nestedfield?: string; bicmp:string; vexpr: any; };

    // const bicmp_eqadded = MongodbTool.op2eqadded(bicmp);
    // const bicmp_complement = MongodbTool.op2complement(bicmp);
    // const bicmp_opposite = MongodbTool.op2opposite(bicmp);

    const ffbv2fullpath = (ffbv:FFBV) => [ffbv.field, ...(ArrayTool.one2l(ffbv.nestedfield) ?? [])].join('.');
    const ffbv2query_bicmp = (ffbv:FFBV) => {
      const bicmp_complement = MongodbTool.op2complement(ffbv.bicmp);
      return ffbv.nestedfield == null
        ? { [ffbv.field]: { [ffbv.bicmp]: ffbv.vexpr, } }
        : {
          [ffbv2fullpath(ffbv)]: { '$exists': true, },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: { [bicmp_complement]: ffv.vexpr } } } },
          [ffbv.field]: { "$not": { "$elemMatch": { "$or": [
            {[ffbv.nestedfield]: { [bicmp_complement]: ffbv.vexpr } },
            {[ffbv.nestedfield]: { '$eq': null  } },
          ] } } },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: {"$or": [{ [bicmp_complement]: ffv.vexpr }, { '$eq': null }]} } } },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: {"$or": [{ [bicmp_complement]: ffv.vexpr }, { '$eq': null }]} } } },
        };
    }
    const ffbv2query_bicmp_eqadded = (ffbv:FFBV) => {
      const bicmp_opposite = MongodbTool.op2opposite(ffbv.bicmp);
      return ffbv.nestedfield == null
        ? { [ffbv.field]: ffbv.vexpr, }
        : {
          [ffbv2fullpath(ffbv)]: { '$exists': true, },
          [ffbv.field]: { "$not": { "$elemMatch": { [ffbv.nestedfield]: { [bicmp_opposite]: ffbv.vexpr } } } },
        };
    }

    return {
      '$and': ffbvs.map((_, i) => {
        return {
          ...DictTool.merge_dicts(
            ArrayTool.range(i).map(j => ffbv2query_bicmp_eqadded(ffbvs[j])),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          ...ffbv2query_bicmp(ffbvs[i]),
        };
      }),
    };
  }

  static ops_logical = () => ['$and','$or','$nor','$not'];
  static query2is_logical = (query:any):boolean => {
    const cls = MongodbTool;
    const keys = Object.keys(query);
    return cls.ops_logical().some(x => lodash.isEqual(ArrayTool.one2l(x), keys));
  }

  static query2prefixed = <I,O=I>(query_in:I, prefix:string,):O => {
    const cls = MongodbTool;
    const callname = `MongodbTool.query2prefixed @ ${DateTool.time2iso(new Date())}`;

    // console.log({callname, query_in, prefix,});
    const rv = (() => {
      if (ArrayTool.is_array(query_in)) {
        return (query_in as any[])?.map(c_in => cls.query2prefixed(c_in, prefix)) as O;
      } else if (DictTool.is_dict(query_in)) {
        const keys = Object.keys(query_in);
        if(!cls.query2is_logical(query_in)){
          return DictTool.merge_dicts(
            keys.map(k_ => ({[`${prefix}.${k_}`]: query_in[k_]})),
            DictTool.WritePolicy.no_duplicate_key,
          ) as O;
          // return keys.reduce((h, k_) => ({...h, [`${prefix}.${k_}`]:query_in[k_]}), {}) as O;
        }

        const op = ArrayTool.l2one(keys);
        return {[op]: cls.query2prefixed(query_in[op], prefix)} as O;
      } else{
        return query_in as unknown as O;
      }
    })();

    // console.log({callname, query_in, prefix, rv});
    return rv;
  }

  static fieldpair2transducer_unwind = <V,>(
    field_from:string, // "fulfills"
    field_to:string, // "fulfill"
  ):((v:V) => V) =>{
    const cls = MongodbTool;
    const callname = `MongodbTool.fieldpair2transducer_unwind @ ${DateTool.time2iso(new Date())}`;

    // recursion necessary because of "$and", "$or" & etc
    const transducer = (v0_in: V): V => {
      if (ArrayTool.is_array(v0_in)) {
        return (v0_in as any[])?.map(transducer) as V;
      } else if (DictTool.is_dict(v0_in)) {

        // sample: {"fulfills":{'$elemMatch': {k3:v3, ...}}, ...} => {"fulfill.k3":v2, ...}
        // console.log({callname, v0_in, 'Object.keys(v0_in)':Object.keys(v0_in),})
        const v0_outs_list:V[][] = Object.keys(v0_in).map((k1):V[] => {
          const v1_in = v0_in?.[k1];
          const v2_in = v1_in?.["$elemMatch"];

          return ArrayTool.all([
            k1 === field_from, // need to generalize later when ${field_from} is suffix of xpath
            DictTool.is_dict(v1_in) && ArrayTool.areAllTriequal(Object.keys(v1_in), ["$elemMatch"]),
          ])
            // ? cls.query2prefixed(transducer(v2_in), field_to)
            ? Object.keys(v2_in).map((k3) => cls.query2prefixed({ [k3]: transducer(v2_in?.[k3]) }, field_to) as V)
            // ? Object.keys(v2_in).map((k3) => ({ [`${field_to}.${k3}`]: transducer(v2_in?.[k3]) } as V))
            : [{ [k1]: transducer(v1_in) } as V];
        });
        return DictTool.merge_dicts(v0_outs_list?.flat(), DictTool.WritePolicy.no_duplicate_key)
      } else {
        return v0_in;
      }
    };
    return transducer;
  };
}

export class Mongosubquery {
  field:string;
  subfield: string;
  expression: any;
}

export class Mongocmpquery {
  comparison: Record<string,any>;
  equality: Record<string,any>;
}

export class MongopagingTool {
  static cmpqueries2query = (
    cqs:Mongocmpquery[],
    // bicmp:string,
  ) => {
    return cqs == null
      ? undefined
      : {
        '$or': cqs.map((cq_i, i) => {
          return {
            ...DictTool.merge_dicts(
              cqs.slice(0,i).map(cq_j => cq_j.equality),
              // ArrayTool.range(i).map(j => fbvs_list[j].map(fbv => ({[fbv.field]: fbv.vexpr,})))?.flat(),
              DictTool.WritePolicy.no_duplicate_key,
            ),
            ...cq_i.comparison,
          };
        }),
      };
  }
}