import DateTool from '../date_tool';

test('DateTool.is_iso8601', () => {
    expect(DateTool.is_iso8601(
        '2022-11-24T07:20:51.907Z',
    )).toStrictEqual(true);
});

describe('DateTool.ms2human', () => {
    test('sub-second → ms', () => {
        expect(DateTool.ms2human(0)).toStrictEqual('0ms');
        expect(DateTool.ms2human(1)).toStrictEqual('1ms');
        expect(DateTool.ms2human(999)).toStrictEqual('999ms');
    });
    test('sub-minute → x.xs (1자리 소수)', () => {
        expect(DateTool.ms2human(1000)).toStrictEqual('1.0s');
        expect(DateTool.ms2human(1500)).toStrictEqual('1.5s');
        expect(DateTool.ms2human(59900)).toStrictEqual('59.9s');
    });
    test('minute 이상 → m/s (초 2자리 zero-pad, 시간 없으면 h 생략)', () => {
        expect(DateTool.ms2human(60000)).toStrictEqual('1m 00s');
        expect(DateTool.ms2human(63000)).toStrictEqual('1m 03s');
        expect(DateTool.ms2human(125000)).toStrictEqual('2m 05s');
    });
    test('hour 이상 → h/m/s (분·초 2자리 zero-pad)', () => {
        expect(DateTool.ms2human(3600000)).toStrictEqual('1h 00m 00s');
        expect(DateTool.ms2human(3661000)).toStrictEqual('1h 01m 01s');
        expect(DateTool.ms2human(3768000)).toStrictEqual('1h 02m 48s'); // 3768s = 1h 2m 48s
    });
    test('null/undefined → 빈 문자열 (fallback 없이 명시)', () => {
        expect(DateTool.ms2human(null)).toStrictEqual('');
        expect(DateTool.ms2human(undefined)).toStrictEqual('');
    });
    test('millisecs2human 은 ms2human 과 동일(별칭)', () => {
        expect(DateTool.millisecs2human).toBe(DateTool.ms2human);
    });
});

describe('DateTool.ms2clock', () => {
    test('시:분:초 (시 zero-pad 없음, 분·초 2자리)', () => {
        expect(DateTool.ms2clock(0)).toStrictEqual('0:00:00');
        expect(DateTool.ms2clock(3000)).toStrictEqual('0:00:03');
        expect(DateTool.ms2clock(63000)).toStrictEqual('0:01:03');
        expect(DateTool.ms2clock(3723000)).toStrictEqual('1:02:03');
    });
    test('하루 넘으면 Nd 접두', () => {
        expect(DateTool.ms2clock(90000000)).toStrictEqual('1d 1:00:00'); // 25시간
    });
    test('음수/누락은 0 처리', () => {
        expect(DateTool.ms2clock(-5)).toStrictEqual('0:00:00');
        expect(DateTool.ms2clock(null)).toStrictEqual('0:00:00');
    });
    test('millisecs2clock 은 ms2clock 과 동일(별칭)', () => {
        expect(DateTool.millisecs2clock).toBe(DateTool.ms2clock);
    });
});

