import MathTool from '../math_tool';

test('MathTool.counts2accums', () => {
    const counts =[1,2,3,4,5,6,7,8,9];
    
    const hyp = MathTool.counts2accums(counts);
    const ref = [1,3,6,10,15,21,28,36,45];

    expect(hyp).toStrictEqual(ref);
});

// -0 정규화. JS 는 IEEE 754 라 0 에 부호가 있다 — -(0), -1*0, Math.round(-0.2) 가 -0 을 만든다.
//   String/JSON 으로는 둘 다 "0" 이라 눈에 안 보이고, Object.is / toStrictEqual / Map key 에서만 갈린다.
test('MathTool.num2zero_normed', () => {
  expect(Object.is(MathTool.num2zero_normed(-0), 0)).toBe(true);
  expect(Object.is(MathTool.num2zero_normed(-(0)), 0)).toBe(true);
  expect(Object.is(MathTool.num2zero_normed(-1 * 0), 0)).toBe(true);

  // 0 이 아닌 값은 그대로 (부호 보존)
  expect(MathTool.num2zero_normed(5)).toStrictEqual(5);
  expect(MathTool.num2zero_normed(-5)).toStrictEqual(-5);
  expect(MathTool.num2zero_normed(0)).toStrictEqual(0);

  // nullable-in nullable-out
  expect(MathTool.num2zero_normed(null)).toBeNull();
  expect(MathTool.num2zero_normed(undefined)).toBeUndefined();
});
