export default class PromiseTool{
  static callables2promise_serialized = <T>(callables: (() => Promise<T>)[]): Promise<T[]> => {
    // 초기값: 빈 배열을 resolve하는 프로미스
    // reduce를 사용하여 프로미스 체인을 만듭니다.
    return callables.reduce(
      async (chain, callable) => {
        // 1. 이전 체인(chain)이 완료되기를 기다립니다 (await).
        return chain.then(async (ts:T[]) => {
          // 2. 현재 프로미스 함수를 실행합니다.
          const t_ = await callable();
          
          // 3. 현재 결과를 이전 결과 배열에 추가하여 다음 체인에 전달합니다.
          ts.push(t_);
          return ts;
        });
      },
      Promise.resolve<T[]>([])
    );
  }
}