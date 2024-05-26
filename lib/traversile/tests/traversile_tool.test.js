import DateTool from '../../date/date_tool';
import TraversileTool from '../traversile_tool';

test('TraversileTool.func2traversile', () => {
  const f_node = (x) => {
    // console.log({x, 'DateTool.is_iso8601(x)':DateTool.is_iso8601(x),});

    if (DateTool.is_iso8601(x)) {
        return new Date(Date.parse(x));
    }

    return x;
  }
  const f = TraversileTool.func2traversile(f_node);

  expect(
    f([{ filing: { created_at: "2022-08-25T16:13:44.823000+00:00" } }])
  ).toEqual(
    [{ filing: { created_at: new Date("2022-08-25T16:13:44.823000+00:00") } }]
  );

});

