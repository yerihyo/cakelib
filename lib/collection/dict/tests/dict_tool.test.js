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


