import MathTool from '../../../number/math/math_tool'
import DictTool from '../dict_tool'

test('DictTool.merge_dicts', () => {
    const h_list = [{a:1,b:2}, {a:2}]
    const hyp = DictTool.merge_dicts(h_list, DictTool.WritePolicy.overwrite)

    const ref = {a:2, b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:1,b:2}, {a:2}]
    const hyp = DictTool.merge_dicts(h_list, DictTool.WritePolicy.skip_if_exists)

    const ref = {a:1, b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:1,b:2}, {a:2}]
    expect(() => {
        DictTool.merge_dicts(h_list, DictTool.WritePolicy.no_duplicate_key)
    }).toThrow("Duplicate key: 'a'")
})

test('DictTool.merge_dicts.max', () => {
    const h_list = [{a:1,b:2}, {a:2}]
    expect(
        DictTool.merge_dicts(h_list, DictTool.WritePolicy.max)
    ).toStrictEqual({a:2,b:2})
})

test('DictTool.merge_dicts', () => {
    const policy = DictTool.WritePolicy.policy2dict_policy(DictTool.WritePolicy.overwrite)
    const h_list = [{a:{aa:1},b:2}, {a:{ab:2}}]
    const hyp = DictTool.merge_dicts(h_list, policy)

    const ref = {a:{aa:1, ab:2},b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:{aa:1, ab:3},b:2}, {a:{ab:2}}]
    const hyp = DictTool.merge_dicts(h_list, DictTool.WritePolicy.dict_overwrite)

    const ref = {a:{aa:1, ab:2},b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:{aa:1, ab:3},b:2}, {a:{ab:2}}]
    const hyp = DictTool.merge_dicts(h_list, DictTool.WritePolicy.dict_skip_if_exists)

    const ref = {a:{aa:1, ab:3},b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:{aa:1},b:2}, {a:{ab:2}}]
    const hyp = DictTool.merge_dicts(h_list, DictTool.WritePolicy.dict_no_duplicate_key)

    const ref = {a:{aa:1, ab:2},b:2}
    expect(hyp).toStrictEqual(ref)
})

test('DictTool.merge_dicts', () => {
    const h_list = [{a:{aa:1},b:2}, {a:{aa:2}}]
    expect(() => {
        DictTool.merge_dicts(h_list, DictTool.WritePolicy.dict_no_duplicate_key)
    }).toThrow("Duplicate key: 'aa'")
})

test('DictTool.dict2values_mapped', () => {
    const h = {a:[1,2], b:[4,5]};
    expect(DictTool.dict2values_mapped(h, (k,items) => MathTool.sum(items))).toStrictEqual({a:3, b:9});
})



describe("WritePolicy.no_duplicate_key — 충돌 원인 식별", () => {
  const merge = (dicts) => DictTool.merge_dicts(dicts, DictTool.WritePolicy.no_duplicate_key);

  test("충돌한 두 값의 key 를 에러에 담는다 — 키만으로는 무슨 키인지 알 수 없다", () => {
    expect(() => merge([{ ev1: { key: 'payA' } }, { ev1: { key: 'payB' } }]))
      .toThrow("Duplicate key: 'ev1' ({key:payA} vs {key:payB})");
  });

  test("key 가 없는 객체는 앞부분만 잘라 담는다", () => {
    expect(() => merge([{ a: { x: 1 } }, { a: { x: 2 } }])).toThrow(/\{"x":1\} vs \{"x":2\}/);
  });

  test("원시값도 그대로 보여준다", () => {
    expect(() => merge([{ a: 1 }, { a: 2 }])).toThrow("Duplicate key: 'a' (1 vs 2)");
  });

  test("직렬화 불가한 값이 와도 에러 만들다 다시 던지지 않는다 — 원인이 뒤바뀌면 안 된다", () => {
    const cyclic = {}; cyclic.self = cyclic;
    expect(() => merge([{ a: cyclic }, { a: cyclic }])).toThrow(/Duplicate key: 'a'/);
  });

  test("충돌이 없으면 그대로 합친다", () => {
    expect(merge([{ a: 1 }, { b: 2 }])).toEqual({ a: 1, b: 2 });
  });
});
