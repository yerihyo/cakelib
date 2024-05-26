import MathTool from '../math_tool';

test('MathTool.counts2accums', () => {
    const counts =[1,2,3,4,5,6,7,8,9];
    
    const hyp = MathTool.counts2accums(counts);
    const ref = [1,3,6,10,15,21,28,36,45];

    expect(hyp).toStrictEqual(ref);
});
