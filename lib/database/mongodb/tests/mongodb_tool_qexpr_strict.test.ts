// 권한 게이트용 질의 식 판독 — 엄격한 계약 (2026-09-29).
//   게이트가 클라가 만든 질의의 값을 읽어 허락 여부를 정한다. 연산자 객체·null 원소·원소 1개 `$in` 풀기로
//   «이 값들만 나온다» 는 판단이 속지 않도록, 해석 가능한 모양만 값으로 인정하고 나머지는 UNPARSEABLE(거부) 로 돌린다.
import MongodbTool, { MongovalueInvalidError } from "../mongodb_tool";

const UNPARSEABLE = MongodbTool.QEXPR_UNPARSEABLE;

// 게이트를 속이던 모양 — 하나라도 값으로 읽히면 안 된다
const SHAPES_UNPARSEABLE: [string, unknown][] = [
  ["$ne 연산자", { $ne: null }],
  ["$regex", { $regex: ".*" }],
  ["$exists", { $exists: true }],
  ["$gt", { $gt: "" }],
  ["$nin", { $nin: ["a"] }],
  ["$in 원소가 연산자 (원소 1개)", { $in: [{ $ne: null }] }],
  ["$in 원소에 연산자 섞임", { $in: ["a", { $ne: null }] }],
  ["$in 원소에 null", { $in: ["a", null] }],
  ["$in 원소가 null 하나", { $in: [null] }],
  ["$in 원소에 빈 문자열", { $in: ["a", ""] }],
  ["$in 원소에 숫자", { $in: ["a", 1] }],
  ["$in 원소에 배열", { $in: [["a"]] }],
  ["$in 이 배열 아님", { $in: "a" }],
  ["$in 에 다른 연산자 동반", { $in: ["a"], $nin: ["b"] }],
  ["$eq 가 연산자", { $eq: { $ne: null } }],
  ["$eq 가 null", { $eq: null }],
  ["빈 객체", {}],
  ["배열 값 (정확 일치 배열)", ["a"]],
  ["null (필드 없는 문서와 매칭)", null],
  ["빈 문자열", ""],
  ["숫자", 1],
  ["boolean", true],
  ["$or 같은 논리 연산자", { $or: [{ a: 1 }] }],
];

describe("MongodbTool.qexpr2strings_strict", () => {
  test("필드가 없으면(undefined) undefined — «판정 불가» 와 구분한다", () => {
    expect(MongodbTool.qexpr2strings_strict(undefined)).toBeUndefined();
  });

  test("문자열 하나 → [값]", () => {
    expect(MongodbTool.qexpr2strings_strict("k1")).toEqual(["k1"]);
  });

  test("{$in: [문자열...]} → 목록 (실제 Csapi 가 만드는 모양)", () => {
    expect(MongodbTool.qexpr2strings_strict({ $in: ["k1", "k2"] })).toEqual(["k1", "k2"]);
    // query_in2norm 이 만드는 모양 그대로 — 1개면 풀린 문자열, 여러 개면 $in
    expect(MongodbTool.qexpr2strings_strict(MongodbTool.query_in2norm({ $in: ["k1"] }))).toEqual(["k1"]);
    const out = MongodbTool.qexpr2strings_strict(MongodbTool.query_in2norm({ $in: ["k2", "k1"] })) as string[];
    expect([...out].sort()).toEqual(["k1", "k2"]);
  });

  test("{$in: []} → [] (아무것도 안 맞는다 — 판정은 게이트 몫)", () => {
    expect(MongodbTool.qexpr2strings_strict({ $in: [] })).toEqual([]);
  });

  test("{$eq: 문자열} → [값]", () => {
    expect(MongodbTool.qexpr2strings_strict({ $eq: "k1" })).toEqual(["k1"]);
  });

  test.each(SHAPES_UNPARSEABLE)("해석 불가 → UNPARSEABLE: %s", (_label, qexpr) => {
    const out = MongodbTool.qexpr2strings_strict(qexpr);
    expect(out).toBe(UNPARSEABLE);
    expect(MongodbTool.qexpr2is_unparseable(out)).toBe(true);
  });

  test("qexpr2is_unparseable 는 목록·undefined 를 해석 불가로 보지 않는다", () => {
    expect(MongodbTool.qexpr2is_unparseable(["a"])).toBe(false);
    expect(MongodbTool.qexpr2is_unparseable([])).toBe(false);
    expect(MongodbTool.qexpr2is_unparseable(undefined)).toBe(false);
  });
});

describe("MongodbTool.qexpr2strings_orthrow / qexpr_in2values (던지는 판)", () => {
  test("정상 모양은 qexpr2strings_strict 와 같다", () => {
    expect(MongodbTool.qexpr2strings_orthrow("k1", "key")).toEqual(["k1"]);
    expect(MongodbTool.qexpr2strings_orthrow({ $in: ["k1", "k2"] }, "key")).toEqual(["k1", "k2"]);
    expect(MongodbTool.qexpr_in2values<string>({ $in: ["k1"] })).toEqual(["k1"]);
    expect(MongodbTool.qexpr_in2values<string>("k1")).toEqual(["k1"]);
  });

  test("필드가 없으면 undefined (던지지 않는다 — 게이트가 원래 규칙대로 판단)", () => {
    expect(MongodbTool.qexpr2strings_orthrow(undefined, "key")).toBeUndefined();
    expect(MongodbTool.qexpr_in2values<string>(undefined)).toBeUndefined();
  });

  test.each(SHAPES_UNPARSEABLE)("해석 불가면 MongovalueInvalidError: %s", (_label, qexpr) => {
    expect(() => MongodbTool.qexpr2strings_orthrow(qexpr, "brand_key")).toThrow(MongovalueInvalidError);
    expect(() => MongodbTool.qexpr_in2values<string>(qexpr as any)).toThrow(MongovalueInvalidError);
  });

  test("에러에는 필드명만 — 값은 담지 않는다", () => {
    try {
      MongodbTool.qexpr2strings_orthrow({ $regex: "secret-ish" }, "brand_key");
      throw new Error("unreachable");
    } catch (e) {
      expect(MongovalueInvalidError.error2is(e)).toBe(true);
      expect((e as MongovalueInvalidError).field).toBe("brand_key");
      expect(String((e as Error).message)).not.toContain("secret-ish");
    }
  });
});

describe("MongodbTool.query_in2norm — 원소 1개 풀기는 primitive 일 때만", () => {
  test("문자열 하나는 종전처럼 푼다 (질의 빌더 호환)", () => {
    expect(MongodbTool.query_in2norm({ $in: ["k1"] })).toBe("k1");
    expect(MongodbTool.query_in2norm({ $in: ["k1", "k1"] })).toBe("k1");
    expect(MongodbTool.query_in2norm({ $in: [3] })).toBe(3);
  });

  test("여러 개면 중복 제거한 $in", () => {
    const out = MongodbTool.query_in2norm({ $in: ["b", "a", "b"] }) as { $in: string[] };
    expect([...out.$in].sort()).toEqual(["a", "b"]);
  });

  test("원소가 연산자 객체면 풀지 않는다 — `{$ne:null}` 이 연산자로 살아나면 «전부» 가 된다", () => {
    const out = MongodbTool.query_in2norm({ $in: [{ $ne: null }] as any[] });
    expect(out).toEqual({ $in: [{ $ne: null }] });
  });

  test("원소가 null 하나여도 풀지 않는다", () => {
    expect(MongodbTool.query_in2norm({ $in: [null] })).toEqual({ $in: [null] });
  });

  test("query 가 없으면 undefined", () => {
    expect(MongodbTool.query_in2norm(undefined)).toBeUndefined();
  });
});
