const lodash = require('lodash');

test('equals', () => {
    expect([]).toStrictEqual([]);
    expect([] === []).toBe(false);
    expect(lodash.isEqual([],[])).toBe(true);

    expect({}).toStrictEqual({});
    expect({} === {}).toBe(false);
    expect(lodash.isEqual({},{})).toBe(true);

    expect([]).not.toStrictEqual({});
    expect([] === {}).toBe(false);
    expect(lodash.isEqual([],{})).toBe(false);

    expect({}).not.toStrictEqual([]);
    expect({} === []).toBe(false);
    expect(lodash.isEqual({},[])).toBe(false);
});
