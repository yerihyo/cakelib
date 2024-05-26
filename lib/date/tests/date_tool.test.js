import DateTool from '../date_tool';

test('DateTool.is_iso8601', () => {
    expect(DateTool.is_iso8601(
        '2022-11-24T07:20:51.907Z',
    )).toStrictEqual(true);
});

