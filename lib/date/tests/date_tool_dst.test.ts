// ⚠ 이 파일은 **서머타임이 있는 지역**에서만 의미가 있는 검사다.
//
//   예전엔 맨 위에서 `process.env.TZ = "America/Los_Angeles"` 로 고정하려 했지만 **먹지 않는다** —
//   Node 는 첫 Date 사용 시점에 타임존을 캐시하는데, jest 는 이 파일을 로드하기 훨씬 전에 Date 를 쓴다.
//   그래서 DST 없는 머신(KST·CI의 UTC)에서는 전제부터 깨져 **상시 실패**했다.
//
//   해법: TZ 는 **프로세스 밖에서** 준다.
//     CI  — `.github/workflows/pr-test.yaml` 의 "DST 회귀" 단계가 `TZ=America/Los_Angeles` 로 따로 돌린다
//     로컬 — `TZ=America/Los_Angeles yarn jest cakelib/lib/date`
//   TZ 가 DST 없는 지역이면 조용히 통과하는 대신 **명시적으로 skip** 한다 (통과로 위장하지 않는다).

import DateTool from "../date_tool";

/** 이 실행 환경에 서머타임이 있나 — 1월과 7월의 UTC offset 이 다르면 DST 지역이다. */
const is_dst_zone = (): boolean =>
  new Date(2026, 0, 1).getTimezoneOffset() !== new Date(2026, 6, 1).getTimezoneOffset();

const describe_dst = is_dst_zone() ? describe : describe.skip;

/*
 * 2026-08-22 실사고: 근태 "연차 사용"(1~12월 조회)을 열면 **브라우저가 통째로 멈췄다.**
 *
 * `day82days_added` 가 "로컬 자정 + 24시간" 이었는데, 서머타임 해제일은 25시간짜리 날이라
 * `11/1 00:00 PDT + 24h = 11/1 23:00 PST` 로 **같은 날**이 나왔다. 그 결과
 * `day8span2day8s` 의 `while (cur < d_to)` 가 영원히 끝나지 않았다.
 *
 * 한국은 DST 가 없어 서버·현지에서는 안 보이고 **DST 지역 개발기에서만** 터진다. 그래서 TZ 를 고정해 둔다.
 */
describe_dst("DateTool day8 산술은 24시간이 아니라 **달력** 기준이다 (DST) — DST 지역에서만 실행", () => {
  test("전제 — 이 TZ 는 2026-11-01 이 25시간짜리 날이다", () => {
    const midnight = new Date(2026, 10, 1);
    const plus24h = new Date(midnight.getTime() + 24 * 3600 * 1000);
    expect(plus24h.getDate()).toBe(1); // 24시간 더해도 아직 11/1 — 이것이 사고의 원인이었다
  });

  test("서머타임 해제일에도 날짜가 하루 넘어간다", () => {
    expect(DateTool.day82days_added(20261101, 1)).toBe(20261102);
    expect(DateTool.day82days_added(20261101, -1)).toBe(20261031);
  });

  test("서머타임 시작일에도 하루씩 간다 (2026-03-08)", () => {
    expect(DateTool.day82days_added(20260308, 1)).toBe(20260309);
    expect(DateTool.day82days_added(20260308, -1)).toBe(20260307);
  });

  test("`day8span2day8s` 가 11월을 30일로 끝낸다 — 멈추지 않는다", () => {
    const day8s = DateTool.day8span2day8s([20261101, 20261201]);
    expect(day8s.length).toBe(30);
    expect(day8s[0]).toBe(20261101);
    expect(day8s[29]).toBe(20261130);
  });

  test("한 해 열두 달이 전부 제 길이로 나온다", () => {
    const lengths = Array.from({ length: 12 }, (_, i) =>
      DateTool.day8span2day8s(DateTool.yearmonth2day8span(202601 + i)).length,
    );
    expect(lengths).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  });
});
