import { SWRResponse } from "swr";
import SwrTool from "../swr_tool";

/*
 * [[SwrTool.swr2codeced]] 의 두 가지 계약.
 *
 * ① **신원 유지** — 원본이 그대로면 `data` 도 같은 객체다. kit 을 캐시 키·의존성으로 쓰는 쪽이
 *    (근태표 줄 캐시 등) 렌더마다 헛돌지 않으려면 이게 지켜져야 한다.
 * ② **mutate 인자 개수 보존** — SWR 은 인자 **개수**로 "재검증" 과 "덮어쓰기" 를 가른다.
 *    인자 없이 부른 것을 `mutate(undefined, undefined)` 로 바꿔 넘기면 캐시가 undefined 로 덮인다.
 */

type Doc = { key: string };
type Kit = { docs: () => Doc[] };

/** kit 만드는 법 — `decode` 신원이 캐시 키의 절반이라 **static 참조**여야 한다 (실제 kit 들과 같은 모양). */
const list2kit = (docs: Doc[]): Kit => (docs == null ? undefined : { docs: () => docs });
const codec = () => ({ decode: list2kit, encode: (kit: Kit) => kit?.docs() });

/** 진짜 SWR 대신 — `mutate` 가 **몇 개의 인자로 불렸는지**를 기록한다. */
const swr2fake = (data: Doc[]) => {
  const calls: any[][] = [];
  const swr = {
    data,
    isLoading: false,
    isValidating: false,
    mutate: (...args: any[]) => {
      calls.push(args);
      return Promise.resolve(data);
    },
  } as unknown as SWRResponse<Doc[]>;
  return { swr, calls };
};

describe("SwrTool.swr2codeced — decode 신원", () => {
  const docs: Doc[] = [{ key: "a" }, { key: "b" }];

  test("원본이 같으면 같은 kit 객체 — 렌더마다 새로 만들지 않는다", () => {
    const kit1 = SwrTool.swr2codeced(swr2fake(docs).swr, codec()).data;
    const kit2 = SwrTool.swr2codeced(swr2fake(docs).swr, codec()).data;
    expect(kit2).toBe(kit1);
  });

  test("원본이 새 배열이면 새 kit — 데이터가 바뀐 것을 놓치지 않는다", () => {
    const kit1 = SwrTool.swr2codeced(swr2fake(docs).swr, codec()).data;
    const kit2 = SwrTool.swr2codeced(swr2fake([...docs]).swr, codec()).data;
    expect(kit2).not.toBe(kit1);
    expect(kit2.docs().length).toBe(2);
  });

  test("같은 배열이라도 codec 이 다르면 따로 기억한다", () => {
    const codec_count = { decode: (l: Doc[]) => l?.length, encode: (_n: number) => docs };
    expect(SwrTool.swr2codeced(swr2fake(docs).swr, codec()).data.docs()).toBe(docs);
    expect(SwrTool.swr2codeced<Doc[], number>(swr2fake(docs).swr, codec_count).data).toBe(2);
  });

  test("data 가 없으면 decode 결과 그대로 (WeakMap 키가 못 되는 값)", () => {
    expect(SwrTool.swr2codeced(swr2fake(undefined).swr, codec()).data).toBeUndefined();
    expect(SwrTool.swr2codeced(swr2fake(null).swr, codec()).data).toBeUndefined();
  });

  test("매번 새로 만드는 decode 를 넘기면 그냥 매번 디코드한다 (예전과 같은 동작)", () => {
    const kit1 = SwrTool.swr2codeced(swr2fake(docs).swr, { decode: (l: Doc[]) => list2kit(l), encode: (k: Kit) => k?.docs() }).data; // prettier-ignore
    const kit2 = SwrTool.swr2codeced(swr2fake(docs).swr, { decode: (l: Doc[]) => list2kit(l), encode: (k: Kit) => k?.docs() }).data; // prettier-ignore
    expect(kit2).not.toBe(kit1);
  });
});

describe("SwrTool.swr2codeced — mutate 인자 개수", () => {
  const docs: Doc[] = [{ key: "a" }];

  test("인자 없이 부르면 **인자 없이** 넘긴다 — 재검증이지 덮어쓰기가 아니다", async () => {
    const { swr, calls } = swr2fake(docs);
    await SwrTool.swr2codeced(swr, codec()).mutate();
    expect(calls).toEqual([[]]); // ← 예전에는 [[undefined, undefined]] 라 캐시가 undefined 로 덮였다
  });

  test("값을 넘기면 encode 해서 넘긴다", async () => {
    const { swr, calls } = swr2fake(docs);
    const docs_new: Doc[] = [{ key: "z" }];
    await SwrTool.swr2codeced(swr, codec()).mutate(list2kit(docs_new), { revalidate: false });
    expect(calls).toEqual([[docs_new, { revalidate: false }]]);
  });

  test("updater 를 넘기면 지금 kit 을 받아 간다", async () => {
    const { swr, calls } = swr2fake(docs);
    await SwrTool.swr2codeced(swr, codec()).mutate((kit) => list2kit([...kit.docs(), { key: "b" }]));
    expect(calls[0][0]).toEqual([{ key: "a" }, { key: "b" }]);
  });
});
