import IterTool from '../iter_tool'

test('IterTool.takewhile', () => {
    const hyp1 = [...IterTool.takewhile(x => x < 10, [...Array(20).keys()])]
    expect(hyp1).toStrictEqual([0,1,2,3,4,5,6,7,8,9]);

    const hyp2 = [...IterTool.takewhile(x => x % 2 == 0, [...Array(20).keys()])]
    expect(hyp2).toStrictEqual([0]);
});


test('IterTool.index_first_false', () => {
    expect(IterTool.index_first_false([1,2,0,3])).toStrictEqual(2);
});


