import { nanoid } from 'nanoid';

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

// `memo_one` 은 예전엔 커스텀 isEqual 을 2번째 인자로 받았고 `CacheTool.f_key2f_isEqual` 도 있었다.
//   둘 다 소스에서 **주석 처리**됐고(cache_tool.ts:25, memo_one 시그니처) 리포 전체에 사용처가 0건이다.
//   그 두 테스트를 지우고, 지금 실제 계약을 고정한다:
//     «직전 호출 **하나만** 기억하고, 인자를 하나씩 `===` 로 비교한다 (인자가 곧 의존성)»
test('CacheTool.memo_one — 직전 호출 하나만 기억한다', () => {
    let calls = 0;
    const f = CacheTool.memo_one((x) => { calls += 1; return nanoid(); });

    const v10 = f(10);
    expect(calls).toStrictEqual(1);

    // 같은 인자 → 재계산 없음
    expect(f(10)).toStrictEqual(v10);
    expect(calls).toStrictEqual(1);

    // 인자가 바뀌면 재계산
    const v20 = f(20);
    expect(v20).not.toStrictEqual(v10);
    expect(calls).toStrictEqual(2);

    // **하나만** 기억하므로 되돌아오면 다시 계산한다 (여러 개를 캐시하지 않는다)
    expect(f(10)).not.toStrictEqual(v10);
    expect(calls).toStrictEqual(3);
});
