import { XpathTool } from '../json_tool'
import IterTool from '../../../../../lib/collection/iter/iter_tool';

test('JpathTool.xpath2jpath', () => {
  const pattern = /[\.\[]/g;
  const s = 'a.b[1]';

  expect([...IterTool.map(
    s.matchAll(pattern),
    m => [m.index, m.index + m[0].length],
  )]).toStrictEqual([[1,2],[3,4]]);

  expect(
    [...s.matchAll(pattern)].map(m => [m.index, m.index + m[0].length])
  ).toStrictEqual([[1,2],[3,4]]);

  expect(XpathTool.xpath2jpath('a.b[1]')).toStrictEqual(['a', 'b', 1]);
  expect(XpathTool.xpath2jpath('.a.b[1]')).toStrictEqual(['a', 'b', 1]);
  expect(XpathTool.xpath2jpath('.a[3].b[1]')).toStrictEqual(['a', 3,'b', 1]);
  expect(XpathTool.xpath2jpath('[3].b[1]')).toStrictEqual([3,'b', 1]);
})

test('XpathTool.xpath2is_prefix', () => {
  expect(XpathTool.is_prefix('', 'a.b[1]')).toStrictEqual(true);
})
