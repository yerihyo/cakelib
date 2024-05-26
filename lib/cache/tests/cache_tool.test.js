import { isEqual } from 'lodash';
import {nanoid} from 'nanoid';
import React from 'react';

import CacheTool from '../cache_tool';


test('CacheTool.memo', () => {

    // raw form & array form works
    let v = undefined;
    const f0 = CacheTool.memo(
        (x) => { return nanoid(); },
        { args2key: (x) => Math.floor(x / 10), },
    );

    const v0 = f0(10);
    console.log({v0, v});
    expect(v0).toStrictEqual(f0(11));
    expect(v0).toStrictEqual(f0(12));
    expect(v0).toStrictEqual(f0(13));
    expect(v0).toStrictEqual(f0(19));
    expect(v0).not.toStrictEqual(f0(20));

    const f1 = CacheTool.memo(
        (x) => { return nanoid(); },
        { args2key: (x) => Math.floor(x / 10) },
    );

    const v1 = f1(10);
    expect(v1).toStrictEqual(f1(11));
    expect(v1).toStrictEqual(f1(12));
    expect(v1).toStrictEqual(f1(13));
    expect(v1).toStrictEqual(f1(19));
    expect(v1).not.toStrictEqual(f1(20));

    // only array form works
    const f2 = CacheTool.memo(
        (x,y) => { return nanoid(); },
        { args2key: (x, y) => [Math.floor(x / 10), Math.floor(y / 10),] },
    );

    const v2 = f2(10, 10);
    expect(v2).toStrictEqual(f2(11, 10));
    expect(v2).toStrictEqual(f2(10, 12));
    expect(v2).toStrictEqual(f2(13, 19));

    expect(v2).not.toStrictEqual(f2(20, 19));
    expect(v2).not.toStrictEqual(f2(19, 20));
    expect(v2).not.toStrictEqual(f2(30, 20));

    const f3 = CacheTool.memo(
        () => { return nanoid(); },
        {args2key: () => (nanoid())},
    );

    const v3 = f3(10);
    expect(v3).not.toStrictEqual(f3(10));
    expect(v3).not.toStrictEqual(f3(11));
    expect(v3).not.toStrictEqual(f3(12));
    expect(v3).not.toStrictEqual(f3(13));
    expect(v3).not.toStrictEqual(f3(19));
    expect(v3).not.toStrictEqual(f3(20));

    const f4 = CacheTool.memo(
        (v) => { return nanoid(); },
        {
            args2key: (v) => Math.floor(v / 10),
            limit: 1,
        },
    );

    const v4 = f4(10);
    expect(v4).toStrictEqual(f4(11));
    expect(v4).not.toStrictEqual(f4(21));
    expect(v4).not.toStrictEqual(f4(11));   
    
    const f5 = CacheTool.memo(
        (v) => { return nanoid(); },
        {
            args2key: (v) => Math.floor(v / 10),
            limit: 2,
        },
    );

    const v5 = f5(10);
    expect(v5).toStrictEqual(f5(11));
    expect(v5).not.toStrictEqual(f5(21));
    expect(v5).toStrictEqual(f5(11));   
});

test('CacheTool.memo_one', () => {
    const f1 = CacheTool.memo_one(
        (x) => { return nanoid(); },
        ([x1],[x2]) => {
            // console.log({x1, x2});
            return Math.floor(x1 / 10) === Math.floor(x2 / 10);
        },
    );

    // const v1 = f1(10);
    expect(f1(10)).toStrictEqual(f1(11));
    expect(f1(10)).toStrictEqual(f1(12));
    expect(f1(10)).toStrictEqual(f1(13));
    expect(f1(10)).toStrictEqual(f1(19));
    expect(f1(10)).not.toStrictEqual(f1(20));
    expect(f1(20)).not.toStrictEqual(f1(19));
});

test('CacheTool.f_key2f_isEqual', () => {
    const args2key = ([x]) => {
        const k = Math.floor(x/10);
        // console.log({x,k});
        return k;
    }

    const f2 = CacheTool.memo_one(
        (x) => { return nanoid(); },
        CacheTool.f_key2f_isEqual(args2key),
    );
    // const v2 = f2(10);
    expect(f2(10)).toStrictEqual(f2(11));
    expect(f2(10)).toStrictEqual(f2(12));
    expect(f2(10)).toStrictEqual(f2(13));
    expect(f2(10)).toStrictEqual(f2(19));
    expect(f2(10)).not.toStrictEqual(f2(20));
    expect(f2(20)).not.toStrictEqual(f2(19));
});


// test('React.memo', () => {
//     const key = ([x]) => {
//         const k = Math.floor(x/10);
//         // console.log({x,k});
//         return k;
//     }

//     const f1 = React.memo(
//         (p) => { return (<div>{nanoid()}</div>); },
//         (p1,p2) => {
//             return isEqual(Math.floor(p1.x/10), Math.floor(p2.x/10));
//         },
//     );
    
//     // const v2 = f2(10);
//     expect(<f1 {...{x:10}} />).toStrictEqual(<f1 {...{x:10}} />);
//     expect(<f1 {...{x:10}} />).toStrictEqual(<f1 {...{x:11}} />);
//     expect(<f1 {...{x:10}} />).not.toStrictEqual(<f1 {...{x:21}} />);
// });
