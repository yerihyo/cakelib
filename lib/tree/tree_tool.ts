import ArrayTool from "../collection/array/array_tool";
import DictTool from "../collection/dict/dict_tool";
import { Jstep } from "../collection/dict/json/json_tool";
import NumberTool from "../number/number_tool";
import StringTool from "../string/string_tool";

/** 전체 transduction 정책. doc과 남은 jpath를 받아 Treetransduce.Action 반환. */
export type TreetransducePolicy = (doc: any, jpath: Jstep[]) => Treetransduce.Action;

/** 트리 transduction 상수 및 Step 타입 */
export class Treetransduce {
  static RETURN = 'RETURN' as const;
  static MAP = 'MAP' as const;
  static DOWN = 'DOWN' as const;
}

export namespace Treetransduce {
  /**
   * Action: 각 노드에서 policy가 반환하는 결정.
   *   - RETURN: 재귀 중단, value 반환
   *   - MAP: 배열의 각 원소에 동일 jpath로 재귀 (head 소비 안 함)
   *   - DOWN: 자식으로 내려감 (head 소비), f_up으로 부모 재구성
   */
  export type Action =
    | { type: typeof Treetransduce.RETURN, value: any }
    | { type: typeof Treetransduce.MAP }
    | { type: typeof Treetransduce.DOWN, f_up: (parent: any, jstep: Jstep, child: any) => any }
}

/** 저수준 순회 결정 함수. MAP/INDEX/undefined(중단) 중 하나 반환. */
export type TreetraversePolicy = (doc: any, jstep: Jstep) => Treetraverse.Action;

/** 트리 순회 상수 및 정책 팩토리 */
export class Treetraverse {
  static MAP = 'MAP' as const;
  static INDEX = 'INDEX' as const;

  /** jpath 방식: 항상 INDEX. 배열 매핑 없음. */
  static policy_jpathlike = (): TreetraversePolicy => () => Treetraverse.INDEX

  /** mongo projection 방식: 배열+문자열→MAP, 배열+숫자→중단, 나머지→INDEX */
  static policy_mongoprojlike = (): TreetraversePolicy => (doc, jstep) =>
    ArrayTool.is_array(doc) && StringTool.is_string(jstep) ? Treetraverse.MAP
    : ArrayTool.is_array(doc) && NumberTool.is_number(jstep) ? undefined
    : Treetraverse.INDEX

  /** mongo filter 방식: 배열+문자열→MAP, 나머지→INDEX */
  static policy_mongofilterlike = (): TreetraversePolicy => (doc, jstep) =>
    ArrayTool.is_array(doc) && StringTool.is_string(jstep) ? Treetraverse.MAP
    : Treetraverse.INDEX
}

export namespace Treetraverse {
  export type Action = typeof Treetraverse.MAP | typeof Treetraverse.INDEX;
}

export default class TreeTool {

  // ── 핵심 함수 ──

  /** policy에 따라 doc을 jpath 경로로 transduce */
  static doc_path2transduced = <O=any, I=O>(doc: I, jpath: Jstep[], policy: TreetransducePolicy): O => {
    const step = policy(doc, jpath);
    if (step.type === Treetransduce.RETURN) return step.value as O;
    if (step.type === Treetransduce.MAP) return (doc as any[]).map((el: any) => TreeTool.doc_path2transduced(el, jpath, policy)) as unknown as O;
    // DOWN
    const [head, ...tail] = jpath;
    return step.f_up(doc, head, TreeTool.doc_path2transduced(doc[head], tail, policy)) as O;
  }

  // ── 리프터: 순회 정책 → 전체 TreetransducePolicy ──

  /** pick: 매칭된 경로만 유지 */
  static f_traverse2f_transduce_inclusive = (f_traverse: TreetraversePolicy): TreetransducePolicy => {
    return (doc, jpath) => {
      if (!ArrayTool.bool(jpath)) return { type: Treetransduce.RETURN, value: doc };
      if (doc == null) return { type: Treetransduce.RETURN, value: undefined };
      const action = f_traverse(doc, jpath[0]);
      if (action === Treetraverse.MAP) return { type: Treetransduce.MAP };
      if (action === Treetraverse.INDEX) {
        if (DictTool.is_dict(doc) && doc[jpath[0]] === undefined) return { type: Treetransduce.RETURN, value: undefined };
        return { type: Treetransduce.DOWN, f_up: (_d, k, c) => ({ [k]: c }) };
      }
      return { type: Treetransduce.RETURN, value: undefined };
    }
  }

  /** exclude: 매칭된 경로만 제거, 나머지 유지 */
  static f_traverse2f_transduce_exclusive = (f_traverse: TreetraversePolicy): TreetransducePolicy => {
    return (doc, jpath) => {
      if (!ArrayTool.bool(jpath)) return { type: Treetransduce.RETURN, value: undefined };
      if (doc == null) return { type: Treetransduce.RETURN, value: undefined };
      const action = f_traverse(doc, jpath[0]);
      if (action === Treetraverse.MAP) return { type: Treetransduce.MAP };
      if (action === Treetraverse.INDEX) {
        if (DictTool.is_dict(doc) && doc[jpath[0]] === undefined) return { type: Treetransduce.RETURN, value: doc };
        return { type: Treetransduce.DOWN, f_up: (d, k, c) => ({ ...d, [k]: c }) };
      }
      return { type: Treetransduce.RETURN, value: doc };
    }
  }
}
