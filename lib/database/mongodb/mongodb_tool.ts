import lodash from "lodash";
import ArrayTool from "../../collection/array/array_tool";
import DictTool from "../../collection/dict/dict_tool";
import DateTool from "../../date/date_tool";
import { Pair } from "../../native/native_tool";
import { BicmpTool } from "../../cmp/CmpTool";

export default class MongodbTool {
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

  static span2qexpr<T>(span: Pair<T>): { "$gte"?: T, "$lt"?: T } {
    const callname = `MongodbTool.span2qexpr @ ${DateTool.time2iso(new Date())}`;

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
      : ArrayTool.v2l_or_undef(qexpr as T);
  }

  static bicmp_fvpairs2query = (
    bicmp:string,
    fvpairs:{field:string,vexpr:any}[],
  ) => {
    return {
      '$or': fvpairs.map((_, i) => {
        return {
          ...DictTool.merge_dicts(
            ArrayTool.range(i).map(j => (
              {[fvpairs[j].field]: fvpairs[j].vexpr,}
              )),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          [fvpairs[i].field]: { [bicmp]: fvpairs[i].vexpr },
        };
      }),
    };
  }

  static fvpairs2query_lt = lodash.partial(MongodbTool.bicmp_fvpairs2query, '$lt');
  static fvpairs2query_gt = lodash.partial(MongodbTool.bicmp_fvpairs2query, '$gt');

  static bicmp_ffvs2query = (
    bicmp:string,
    ffvs:{field:string,nestedfield?:string, vexpr:any}[],
  ) => {
    type FFV = { field: string; nestedfield?: string; vexpr: any; };

    // const bicmp_eqadded = MongodbTool.op2eqadded(bicmp);
    const bicmp_complement = MongodbTool.op2complement(bicmp);
    const bicmp_opposite = MongodbTool.op2opposite(bicmp);

    const ffv2fullpath = (ffv:FFV) => [ffv.field, ...(ArrayTool.v2l_or_undef(ffv.nestedfield) ?? [])].join('.');
    const ffv2query_bicmp = (ffv:FFV) => {
      return ffv.nestedfield == null
        ? { [ffv.field]: { [bicmp]: ffv.vexpr, } }
        : {
          [ffv2fullpath(ffv)]: { '$exists': true, },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: { [bicmp_complement]: ffv.vexpr } } } },
          [ffv.field]: { "$not": { "$elemMatch": { "$or": [
            {[ffv.nestedfield]: { [bicmp_complement]: ffv.vexpr } },
            {[ffv.nestedfield]: { '$eq': null  } },
          ] } } },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: {"$or": [{ [bicmp_complement]: ffv.vexpr }, { '$eq': null }]} } } },
          // [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: {"$or": [{ [bicmp_complement]: ffv.vexpr }, { '$eq': null }]} } } },
        };
    }
    const ffv2query_bicmp_eqadded = (ffv:FFV) => {
      return ffv.nestedfield == null
        ? { [ffv.field]: ffv.vexpr, }
        : {
          [ffv2fullpath(ffv)]: { '$exists': true, },
          [ffv.field]: { "$not": { "$elemMatch": { [ffv.nestedfield]: { [bicmp_opposite]: ffv.vexpr } } } },
        };
    }

    return {
      '$or': ffvs.map((_, i) => {
        return {
          ...DictTool.merge_dicts(
            ArrayTool.range(i).map(j => ffv2query_bicmp_eqadded(ffvs[j])),
            DictTool.WritePolicy.no_duplicate_key,
          ),
          ...ffv2query_bicmp(ffvs[i]),
        };
      }),
    };

    // return {
    //   '$or': [
    //     {
    //       'fulfills.fulfill_rts': { "$exists": true },
    //       'fulfills': { "$not": { "$elemMatch": { "fulfill_rts": { "$lte": fulfillrts_min } } } },
    //     },
    //     {
    //       '$and': [
    //         { 'fulfills': { "$not": { "$elemMatch": { "fulfill_rts": { "$lt": fulfillrts_min } } } } },
    //         { 'fulfills.fulfill_rts': { "$exists": true, } },

    //         { '_id': { '$gt': { "$oid": order_last?.['_id'] } } },
    //       ]
    //     }
    //   ]
    // }

    // return {
    //   'fulfills': { "$elemMatch": { "fulfill_rts": { "$gte": fulfillrts_min } } },
    //   '$or': [
    //     { 'fulfills': {"$not": { "$elemMatch": { "fulfill_rts": { "$lte": fulfillrts_min } } } } },
    //     {
    //       '$and': [
    //         { 'fulfills': { "$not": { "$elemMatch": { "fulfill_rts": { "$lt": fulfillrts_min } } } } },
    //         { 'fulfills': { "$elemMatch": { "fulfill_rts": fulfillrts_min } } },
    //         { '_id': { '$gt': { "$oid": order_last?.['_id'] } } },
    //       ]
    //     }
    //   ]
    // }
  }
  static ffvs2query_lt = lodash.partial(MongodbTool.bicmp_ffvs2query, '$lt');
  static ffvs2query_gt = lodash.partial(MongodbTool.bicmp_ffvs2query, '$gt');



}
