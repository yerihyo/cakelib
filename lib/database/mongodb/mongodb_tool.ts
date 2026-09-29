import lodash from "lodash";
import CmpTool from "../../cmp/CmpTool";
import ArrayTool from "../../collection/array/array_tool";
import DictTool from "../../collection/dict/dict_tool";
import JsonTool from "../../collection/dict/json/json_tool";
import TreeTool, { Treetraverse } from "../../tree/tree_tool";
import DateTool from "../../date/date_tool";
import { Pair } from "../../native/native_tool";

// 사용자 입력(req.body/req.query/route param/header)에서 온 값을 Mongo 질의의 «값» 자리에 넣기 전에 검사한다.
//   `{code6: {$ne: ""}}` 처럼 객체가 들어가면 연산자로 해석돼 조건이 무력화된다(NoSQL 주입).
//   이 예외는 «입력이 틀렸다» 는 뜻이다 — 라우트는 원래의 invalid-input/not-found 응답으로 바꾸고 내용은 새지 않게 한다.
export class MongovalueInvalidError extends Error {
  readonly field: string;
  constructor(field: string) {
    super(`Invalid mongo query value: ${field}`);
    // TS 가 ES5 로 내리면 Error 상속의 prototype 이 끊겨 instanceof 가 false 가 된다 — 복구한다.
    Object.setPrototypeOf(this, MongovalueInvalidError.prototype);
    this.name = "MongovalueInvalidError";
    this.field = field;
  }
  static error2is = (e: unknown): e is MongovalueInvalidError => e instanceof MongovalueInvalidError;
}

export type Mongoprimitive = string | number | boolean;

export default class MongodbTool {

  static query_idnull = () => ({'_id':null});
  static obj2id_removed = <T>(t:T):Omit<T,'_id'> => DictTool.keys2excluded(t,['_id'],);

  static eq = CmpTool.f_key2f_eq(JsonTool.encode);
  static query2is_idnull = (query:any):boolean => MongodbTool.eq(query,MongodbTool.query_idnull())

  static value2is_undef = (v:any):boolean => v === undefined;

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

    if(ArrayTool.listpair2eq_every_trinative(span, [null,null])){ return {$exists:true}; } // any value

    const [s, e] = span;
    const qexpr = {
      ...(s != null ? { '$gte': s } : {}),
      ...(e != null ? { '$lt': e } : {}),
    };

    // console.log({ callname, span, s, e, qexpr})
    return qexpr;
  }

  /**
   * doc 의 span 필드(예: day8span = [start, end] inclusive)가 주어진 query span [s, e) 와 겹치는 docs 를 찾는 query dict.
   * 사용 예: `MongodbTool.span2qdict_overlapping("day8span", [20260401, 20260501])`
   *   → { "day8span.0": { $lt: 20260501 }, "day8span.1": { $gte: 20260401 } }
   * field 가 빈 문자열이면 prefix 없이 `{ "0": ..., "1": ... }` 반환 ($elemMatch 내부에서 사용).
   */
  static span2qdict_overlapping<T>(field: string, span: Pair<T>): Record<string, any> {
    const [s, e] = span ?? [];
    const prefix = field ? `${field}.` : "";
    return {
      ...(e != null ? { [`${prefix}0`]: { '$lt': e } } : {}),
      ...(s != null ? { [`${prefix}1`]: { '$gte': s } } : {}),
    };
  }

  /**
   * doc 의 spans 필드 (예: day8spans = Pair<number>[]) 중 어떤 span 이라도 query span [s, e) 와 겹치는 docs 를 찾는 query dict.
   * 사용 예: `MongodbTool.spans2qdict_overlapping("day8spans", [20260401, 20260501])`
   *   → { "day8spans": { $elemMatch: { "0": { $lt: 20260501 }, "1": { $gte: 20260401 } } } }
   */
  static spans2qdict_overlapping<T>(field: string, span: Pair<T>): Record<string, any> {
    return { [field]: { '$elemMatch': MongodbTool.span2qdict_overlapping("", span) } };
  }

  static key_value2body_setunset<T,>(key:string, value:T){
    return (value != null ? { '$set': { [key]:value, } } : { '$unset': { [key]: 1, } });
  }

  static queries2booled = <T>(op:string, queries:T[],):(T|Record<string,T[]>) => {
    const cls = MongodbTool;
    return queries == null
      ? undefined
      : queries.length == 0
        ? cls.query_idnull()
        : queries.length == 1
          ? ArrayTool.l2one(queries)
          : { [op]: queries }
  }

  static queries2or = lodash.partial(MongodbTool.queries2booled, '$or') as <T>(queries:T[]) => (T|{$or:T[]});
  static queries2and = lodash.partial(MongodbTool.queries2booled, '$and') as <T>(queries:T[]) => (T|{$and:T[]});

  static vs2qexpr_in = lodash.partial(MongodbTool.queries2booled, '$in');
  static query_in2norm = <X>(query:{$in:X[]}):(X|{$in:X[]}) => {
    const callname = `MongodbTool.query_in2norm @ ${DateTool.time2iso(new Date())}`;

    const values_in = query?.$in;
    // if(!ArrayTool.is_array(values_in)) throw new Error(`values_in: ${values_in}`);
    // if((values_in as unknown) == 'nIizUPQSY7ShRHcXPJlZZ'){
    //   console.log({callname, 'values_in?.length':values_in?.length, values_in, query})
    //   throw new Error(`values_in: ${values_in}, query:${query}`);
    // }

    const values_norm = ArrayTool.sorted(ArrayTool.uniq(values_in)) as X[];
    // if(!ArrayTool.is_array(values_norm)) throw new Error(`values_norm: ${values_norm}`);
    // if((values_norm as unknown) == 'nIizUPQSY7ShRHcXPJlZZ') throw new Error(`values_norm: ${values_norm}`)

    // 원소 1개면 `{$in:[x]}` 를 `x` 로 푼다 — 단 x 가 **primitive 일 때만** (2026-09-29).
    //   원소가 객체면 풀지 않는다: `{$in:[{$ne:null}]}` 를 풀면 `{$ne:null}` 연산자가 되어 조건이 «전부» 로 넓어진다.
    //   null 도 풀지 않는다 (`{$in:[null]}` 과 `null` 은 같은 뜻이라 풀 이유가 없다).
    const query_out: X | {$in: X[]} = query == null
      ? undefined
      : (values_norm?.length == 1 && MongodbTool.value2is_primitive(values_norm[0]))
        ? ArrayTool.l2one(values_norm)
        : {$in: values_norm};

    // console.log({callname, query_out})
    return query_out;
  }
  // static vs2qexpr_in = <T>(values:T[]):(T|{$in:T[]}) => {
  //   return values == null
  //     ? undefined
  //     : values?.length == 1
  //       ? values?.[0]
  //       : {$in: values};
  // }
  
  /**
   * **권한 게이트용** — 질의 식에서 «이 필드가 어떤 값들로 한정되는가» 를 읽는다. 가드가 fail-closed 가 되도록 엄격하다 (2026-09-29).
   *
   * 게이트가 클라가 만든 질의(jstr_mongoparam · update task 의 filter)의 값을 읽어 권한을 판정하는데,
   * 예전 판독기는 `{$ne: null}` 같은 연산자 객체·null 원소·`{$in:[{$ne:null}]}` 을 값인 것처럼 흘려보냈다.
   * 게이트는 «이 값들만 나온다» 고 믿고 통과시키는데 질의는 그보다 넓게 매칭될 수 있다.
   *
   * 인정하는 모양 (이것만 «값이 이 목록으로 한정된다» 는 뜻이다):
   *   - 비어 있지 않은 문자열           `"k1"`             → `["k1"]`
   *   - `{$in: [문자열...]}` 한 키뿐   `{$in:["k1","k2"]}` → `["k1","k2"]`   (`{$in:[]}` → `[]` — 아무것도 안 맞는다)
   *   - `{$eq: 문자열}` 한 키뿐        `{$eq:"k1"}`        → `["k1"]`
   * 그 밖(연산자 객체·`$in` 에 다른 연산자 동반·null/빈 문자열/객체 원소·배열·숫자·null)은 {@link QEXPR_UNPARSEABLE}.
   *
   * 반환값 3 가지를 **구분해서** 다룬다 (nullable 규칙):
   *   - `undefined`          — 필드가 **없다**. 게이트는 원래 규칙대로(«Brand not specified» 등) 판단한다
   *   - `string[]`           — 값이 이 목록으로 한정된다
   *   - `QEXPR_UNPARSEABLE`  — 필드는 **있는데** 해석할 수 없다. 이 값을 근거로 허락하면 안 된다(거부)
   * 던지는 판이 필요하면 {@link qexpr2strings_orthrow}.
   */
  static readonly QEXPR_UNPARSEABLE: unique symbol = Symbol("MongodbTool.QEXPR_UNPARSEABLE");

  static qexpr2is_unparseable = (x: unknown): x is typeof MongodbTool.QEXPR_UNPARSEABLE =>
    x === MongodbTool.QEXPR_UNPARSEABLE;

  static qexpr2strings_strict = (qexpr: unknown): string[] | undefined | typeof MongodbTool.QEXPR_UNPARSEABLE => {
    const UNPARSEABLE: typeof MongodbTool.QEXPR_UNPARSEABLE = MongodbTool.QEXPR_UNPARSEABLE;
    const is_key = (x: unknown): x is string => typeof x === "string" && x.length > 0;

    if (qexpr === undefined) return undefined; // 필드 없음
    if (is_key(qexpr)) return [qexpr];
    if (qexpr == null || typeof qexpr !== "object" || Array.isArray(qexpr)) return UNPARSEABLE;

    const ops = Object.keys(qexpr);
    if (ops.length !== 1) return UNPARSEABLE;
    const [op] = ops;
    const operand = (qexpr as Record<string, unknown>)[op];

    if (op === "$eq") return is_key(operand) ? [operand] : UNPARSEABLE;
    if (op === "$in") {
      if (!Array.isArray(operand)) return UNPARSEABLE;
      return operand.every(is_key) ? (operand as string[]) : UNPARSEABLE;
    }
    return UNPARSEABLE;
  }

  /** {@link qexpr2strings_strict} 의 던지는 판 — 해석할 수 없으면 {@link MongovalueInvalidError}. 필드가 없으면 `undefined`. */
  static qexpr2strings_orthrow = (qexpr: unknown, name: string): string[] | undefined => {
    const values = MongodbTool.qexpr2strings_strict(qexpr);
    if (MongodbTool.qexpr2is_unparseable(values)) throw new MongovalueInvalidError(name);
    return values;
  }

  /**
   * (예전 이름) 질의 식 → 값 목록. **호출처가 전부 권한 게이트**라 {@link qexpr2strings_orthrow} 와 같은 엄격한 계약으로 바꿨다 (2026-09-29).
   * 해석할 수 없는 모양이면 던진다 — 이 함수를 쓰는 게이트는 따로 손대지 않아도 fail-closed 가 된다.
   * 필드가 없으면(`undefined`) 예전처럼 `undefined`. `null` 은 «있는데 해석 불가» 로 본다(`{f:null}` 은 필드 없는 문서와 매칭된다).
   * 연산자를 정당하게 쓰는 질의에서 «이 경로로는 판정 못 함 → 다른 경로로» 가 필요하면 {@link qexpr2strings_strict} 를 직접 쓴다.
   */
  static qexpr_in2values = <T>(qexpr: (T | { '$in': T[] })): T[] => {
    return MongodbTool.qexpr2strings_orthrow(qexpr, 'qexpr') as unknown as T[];
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

  
  static doc_jpath2proj1 = <O=any, I=O>(doc: I, jpath: string[]): O => {
    return TreeTool.doc_path2transduced<O, I>(
      doc,
      jpath,
      TreeTool.f_traverse2f_transduce_inclusive(Treetraverse.policy_mongoprojlike())
    )
  }

  static doc_jpath2proj0 = <O=any, I=O>(doc: I, jpath: string[]): O => {
    return TreeTool.doc_path2transduced<O, I>(
      doc,
      jpath,
      TreeTool.f_traverse2f_transduce_exclusive(Treetraverse.policy_mongoprojlike()),
    )
  }

  static doc_projection2filtered = <I, O=I>(doc: I, projection: Record<string, number>): O => {
    if (doc == null) return doc as any;

    const entries = Object.entries(projection);

    const jpaths_inc = entries.filter(([, v]) => Boolean(v)).map(([xpath]) => xpath.split('.')); // truthy → inclusion
    const doc_incdone = ArrayTool.bool(jpaths_inc)
      ? jpaths_inc.reduce((h, jpath) => lodash.merge(h, MongodbTool.doc_jpath2proj1(doc, jpath)), {})
      : doc as any;

    const jpaths_exc = entries.filter(([, v]) => !Boolean(v)).map(([xpath]) => xpath.split('.')); // falsy → exclusion
    const doc_excdone = (ArrayTool.bool(jpaths_exc)
      ? jpaths_exc.reduce((h, jpath) => MongodbTool.doc_jpath2proj0(h, jpath), doc_incdone)
      : doc_incdone) as O;

    return doc_excdone;
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

    if (ArrayTool.is_array(query_in)) {
      return (query_in as any[])?.map(c_in => cls.query2prefixed(c_in, prefix)) as O;
    }

    if (DictTool.is_dict(query_in)) {
      const keys = Object.keys(query_in);
      if(!cls.query2is_logical(query_in)){
        return DictTool.merge_dicts(
          keys.map(k_ => ({[`${prefix}.${k_}`]: query_in[k_]})),
          DictTool.WritePolicy.no_duplicate_key,
        ) as O;
        // return keys.reduce((h, k_) => ({...h, [`${prefix}.${k_}`]:query_in[k_]}), {}) as O;
      }

      else{
        const op = ArrayTool.l2one(keys);
        return {[op]: cls.query2prefixed(query_in[op], prefix)} as O;
      }
    }

    return query_in as unknown as O;
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
            DictTool.is_dict(v1_in) && ArrayTool.listpair2eq_every_trinative(Object.keys(v1_in), ["$elemMatch"]),
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

  // --- 사용자 입력 값 → 질의 값 (NoSQL 주입 방어, 2026-09-29) ---
  //   string / 유한 number / boolean 만 통과. object·array·null·undefined·NaN·Infinity 는 거부.
  //   null/undefined 도 거부한다: `{key: undefined}` 는 드라이버가 null 로 보내 «필드 없는 문서» 와 매칭된다.
  //   값이 선택적이면 caller 가 null 을 먼저 따로 처리하고(nullable 규칙) 있을 때만 이것을 부른다.
  //   참고: Next 의 req.query 는 string | string[] 만 만든다(`?a[b]=c` 는 키 "a[b]" 로 남는다) — 객체는 JSON body 로 들어온다.
  static value2is_primitive = (value: unknown): value is Mongoprimitive => {
    if (typeof value === "string" || typeof value === "boolean") return true;
    return typeof value === "number" && Number.isFinite(value);
  }

  static value2primitive_orthrow = (value: unknown, name: string): Mongoprimitive => {
    if (!MongodbTool.value2is_primitive(value)) throw new MongovalueInvalidError(name);
    return value;
  }

  // key·token·code 처럼 문자열이어야 하는 자리 — 숫자·boolean 도 거부한다.
  static value2string_orthrow = (value: unknown, name: string): string => {
    if (typeof value !== "string") throw new MongovalueInvalidError(name);
    return value;
  }

  // 목록 필드({$in: [...]} 등)용 — 배열이어야 하고 모든 원소가 primitive 여야 한다. 빈 배열은 그대로 돌려준다.
  static values2primitives_orthrow = (values: unknown, name: string): Mongoprimitive[] => {
    if (!Array.isArray(values)) throw new MongovalueInvalidError(name);
    if (!values.every(MongodbTool.value2is_primitive)) throw new MongovalueInvalidError(name);
    return values;
  }

  static values2strings_orthrow = (values: unknown, name: string): string[] => {
    if (!Array.isArray(values)) throw new MongovalueInvalidError(name);
    if (!values.every((v) => typeof v === "string")) throw new MongovalueInvalidError(name);
    return values;
  }

  // 던지지 않는 판 — 형식이 틀리면 undefined (이미 «undefined = 무효» 계약인 곳용, 예: Orderauth.data2validated).
  static value2string_orundef = (value: unknown): string | undefined => {
    return typeof value === "string" ? value : undefined;
  }

  static values2strings_orundef = (values: unknown): string[] | undefined => {
    if (!Array.isArray(values)) return undefined;
    return values.every((v) => typeof v === "string") ? values : undefined;
  }
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
