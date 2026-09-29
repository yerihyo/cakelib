// 사용자 입력 → Mongo 질의 «값» 검사 (NoSQL 주입 방어, 2026-09-29).
import MongodbTool, { MongovalueInvalidError } from "../mongodb_tool";

const INJECTIONS: unknown[] = [
  { $ne: "" },
  { $gt: "" },
  { $regex: ".*" },
  { $in: ["a"] },
  ["a"],
  [],
  {},
  null,
  undefined,
  NaN,
  Infinity,
  -Infinity,
];

describe("MongodbTool.value2is_primitive", () => {
  test.each(["", "abc", 0, -1, 1.5, true, false])("통과: %p", (v) => {
    expect(MongodbTool.value2is_primitive(v)).toBe(true);
  });
  test.each(INJECTIONS)("거부: %p", (v) => {
    expect(MongodbTool.value2is_primitive(v)).toBe(false);
  });
});

describe("MongodbTool.value2primitive_orthrow", () => {
  test("primitive 는 그대로 돌려준다", () => {
    expect(MongodbTool.value2primitive_orthrow("k1", "key")).toBe("k1");
    expect(MongodbTool.value2primitive_orthrow(3, "n")).toBe(3);
    expect(MongodbTool.value2primitive_orthrow(false, "b")).toBe(false);
  });
  test.each(INJECTIONS)("거부하고 MongovalueInvalidError 를 던진다: %p", (v) => {
    expect(() => MongodbTool.value2primitive_orthrow(v, "order_key")).toThrow(MongovalueInvalidError);
  });
  test("에러에 필드명만 담고 값은 담지 않는다", () => {
    try {
      MongodbTool.value2primitive_orthrow({ $ne: "secret-ish" }, "code6");
      throw new Error("unreachable");
    } catch (e) {
      expect(MongovalueInvalidError.error2is(e)).toBe(true);
      expect((e as MongovalueInvalidError).field).toBe("code6");
      expect(String((e as Error).message)).not.toContain("secret-ish");
    }
  });
});

describe("MongodbTool.value2string_orthrow", () => {
  test("문자열만 통과", () => {
    expect(MongodbTool.value2string_orthrow("", "k")).toBe("");
    expect(MongodbTool.value2string_orthrow("abc", "k")).toBe("abc");
  });
  test.each([...INJECTIONS, 1, true])("거부: %p", (v) => {
    expect(() => MongodbTool.value2string_orthrow(v, "k")).toThrow(MongovalueInvalidError);
  });
});

describe("MongodbTool.values2primitives_orthrow / values2strings_orthrow", () => {
  test("primitive 배열은 통과 (빈 배열 포함)", () => {
    expect(MongodbTool.values2primitives_orthrow(["a", 1, true], "l")).toEqual(["a", 1, true]);
    expect(MongodbTool.values2primitives_orthrow([], "l")).toEqual([]);
    expect(MongodbTool.values2strings_orthrow(["a", "b"], "l")).toEqual(["a", "b"]);
  });
  test.each([
    "a",
    { $in: ["a"] },
    null,
    undefined,
    [{ $ne: "" }],
    ["a", ["b"]],
    ["a", null],
    [NaN],
  ])("거부: %p", (v) => {
    expect(() => MongodbTool.values2primitives_orthrow(v, "l")).toThrow(MongovalueInvalidError);
    expect(() => MongodbTool.values2strings_orthrow(v, "l")).toThrow(MongovalueInvalidError);
  });
  test("values2strings_orthrow 는 숫자 원소도 거부", () => {
    expect(() => MongodbTool.values2strings_orthrow(["a", 1], "l")).toThrow(MongovalueInvalidError);
  });
});

describe("MongodbTool.value2string_orundef", () => {
  test("문자열이면 그대로, 아니면 undefined", () => {
    expect(MongodbTool.value2string_orundef("x")).toBe("x");
    expect(MongodbTool.value2string_orundef({ $ne: "" })).toBeUndefined();
    expect(MongodbTool.value2string_orundef(["x"])).toBeUndefined();
    expect(MongodbTool.value2string_orundef(1)).toBeUndefined();
  });
});

describe("MongodbTool.values2strings_orundef", () => {
  test("문자열 배열이면 그대로(빈 배열 포함), 아니면 undefined", () => {
    expect(MongodbTool.values2strings_orundef(["a", "b"])).toEqual(["a", "b"]);
    expect(MongodbTool.values2strings_orundef([])).toEqual([]);
    expect(MongodbTool.values2strings_orundef({ $ne: null })).toBeUndefined();
    expect(MongodbTool.values2strings_orundef("a")).toBeUndefined();
    expect(MongodbTool.values2strings_orundef(null)).toBeUndefined();
    expect(MongodbTool.values2strings_orundef(["a", { $ne: "" }])).toBeUndefined();
    expect(MongodbTool.values2strings_orundef(["a", 1])).toBeUndefined();
  });
});
