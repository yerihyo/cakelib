import DateTool from '../../../date/date_tool';
import { Lastparam, StateAction } from '../../../native/native_tool';
import NumberTool from '../../../number/number_tool';
import ReactTool from '../../../react/react_tool';
import StringTool from '../../../string/string_tool';
import ArrayTool from '../../array/array_tool';
import DictTool from '../dict_tool';
import { Jpath, Jstep } from './json_tool';

export type Leafducer<PO,PI> = (p_in: PI, jedge: Jstep) => PO
export type Grafter<RO,RI> = (root_in: RI, jpath: Jstep[],) => RO

export default class GraftingTool {
  static node_jedge_traversality2is_broadcast = (
    node:any,
    jedge: Jstep,
    traversality: Lastparam<typeof GraftingTool.leafducer2grafter>['traversality']
  ) => {
    return ArrayTool.all([
      ArrayTool.is_array(node),
      !NumberTool.is_number(jedge),
      traversality === 'BROADCAST',
    ]);
  }

  static parent_jedge2has_child = (parent: any, jedge: Jstep):boolean => {
    if(parent == null) { return undefined; }

    if(ArrayTool.is_array(parent)){
      if(!NumberTool.is_number(jedge)){ throw new Error(`jedge:${jedge}, parent:${parent}`); }

      return jedge < parent.length;
    }

    if(DictTool.is_dict(parent)){
      return DictTool.has_key(parent, jedge);
    }
    throw new Error(`Invalid parent type: parent:${parent}, jedge:${jedge}`);
  }

  // static parent_jedge2child = (parent: any, jedge: Jstep):boolean => {
  //   if(parent == null) { return undefined; }

  //   if(ArrayTool.is_array(parent)){
  //     if(!NumberTool.is_number(jedge)){ throw new Error(`jedge:${jedge}, parent:${parent}`); }

  //     return parent?.[jedge];
  //   }

  //   if(DictTool.is_dict(parent)){
  //     return parent?.[jedge];
  //   }
  //   throw new Error(`Invalid parent type: parent:${parent}, jedge:${jedge}`);
  // }

  static leafducer2grafter = <LPO, LPI=LPO>(
    leafducer: Leafducer<LPO,LPI>, // need to deal with mutativity internally somewhat
    option?:{
      mutativity?: 'VOPLIKE' | 'OOPLIKE',
      traversality?: 'BROADCAST' | 'PINPOINT'
      node2is_worthy?: (c: any) => boolean
    },
  ) => {
    const cls = GraftingTool;

    const mutativity = option?.mutativity ?? 'VOPLIKE';
    const traversality = option?.traversality ?? 'BROADCAST';
    const node2is_worthy = option?.node2is_worthy ?? cls.node2is_worthy_default;

    const grafter = <RI,RO>(root_in: RI, jpath_in: Jstep[],):RO => {
      if (jpath_in.length === 0) { throw new Error(`jpath_in.length:${jpath_in.length}`); }
      if (jpath_in.length === 1) { return leafducer(root_in as unknown as LPI, jpath_in[0]) as unknown as RO; }

      const is_broadcast = cls.node_jedge_traversality2is_broadcast(root_in, jpath_in[0], traversality);
      if(is_broadcast){
        const root_out = (root_in as any[])?.map(item_in => grafter(item_in, jpath_in))?.filter(node2is_worthy);
        return cls.parentpair2merged_broadcast(root_out, root_in as any[], {mutativity}) as RO;
      }

      const [jedge, ...jpath_out] = jpath_in;
      if(!cls.parent_jedge2has_child(root_in, jedge)){
        return root_in as unknown as RO;
      }

      const child_in = root_in[jedge]

      const child_out = grafter(child_in, jpath_out);
      if(child_in === child_out) return root_in as unknown as RO;

      return cls.child_parent2merged_pinpoint({value:child_out, worthy: node2is_worthy(child_out)}, root_in, jedge, {mutativity});
    }
    return grafter;
  }

  static node2is_worthy_default = (node:any) => {
    if(ArrayTool.is_array(node)){ return ArrayTool.bool(node); }
    if(DictTool.is_dict(node)){ return DictTool.bool(node); }
    throw new Error(`Invalid type: ${typeof node}`);
  }

  static parentpair2merged_broadcast = <O,I=O>(
    p_out:O[],
    p_in:I[],
    option?: {
      mutativity?: Lastparam<typeof GraftingTool.leafducer2grafter>['mutativity']
    }
  ) => {
    const mutativity = option?.mutativity ?? 'VOPLIKE';
    if(ArrayTool.areAllTriequal(p_in as any[], p_out as any[])) return p_in as unknown as O[];

    return mutativity === 'VOPLIKE'
      ? p_out as unknown as O[]
      : ArrayTool.overwrite_inplace(p_out, p_in as any[]) as unknown as O[]
  }

  static child_parent2merged_pinpoint = <PO,CO,PI=PO>(
    childinfo_out:{worthy:boolean, value?: CO},
    p_in:PI,
    jedge: Jstep,
    option?: {
      mutativity?: 'VOPLIKE' | 'OOPLIKE',
    }
  ):PO => {
    const mutativity = option?.mutativity ?? 'VOPLIKE';

    const {worthy:is_child_worthy, value:c_out} = childinfo_out;

    const c_in = p_in?.[jedge];
    if(c_out as unknown === c_in as unknown) return p_in as unknown as PO;

    if (ArrayTool.is_array(p_in)) {
      if (!NumberTool.is_number(jedge)) { throw new Error(`jedge:${jedge} must be number for array`); }

      return mutativity === 'VOPLIKE'
        ? ArrayTool.splice(p_in as any[], jedge as number, 1, ...is_child_worthy ? [c_out] : []) as PO
        : ArrayTool.splice2self(p_in as any[], jedge as number, 1, ...is_child_worthy ? [c_out] : []) as PO
    }

    if (DictTool.is_dict(p_in)) {
      if (!StringTool.is_string(jedge)) { throw new Error(`jedge:${jedge} must be string for object`); }
      const key = jedge as string;

      return mutativity === 'VOPLIKE'
        ? DictTool.splice(p_in, jedge as string, {...is_child_worthy ? {value:c_out} : {}}) as PO
        : DictTool.splice2self(p_in, jedge as string, {...is_child_worthy ? {value:c_out} : {}}) as PO
    }

    throw new Error(`Invalid type: ${typeof p_in}`);
  }

  /**
   * Simple action를 leafducer (수정된 부모 객체를 반환)로 변환합니다.
   * @param action 새 값(CO)을 입력받거나 리프 값(CI)을 받아 새 값(CO)을 반환합니다.
   * @returns leafducer: 부모 객체(PI)와 엣지(jedge)를 받아 수정된 부모 객체(PO)를 반환합니다.
   */
  static action2leafducer = <CO, CI=CO>(
    action: StateAction<CO,CI>,
    option?: {
      mutativity?: Lastparam<typeof GraftingTool.leafducer2grafter>['mutativity'],
      traversality?: Lastparam<typeof GraftingTool.leafducer2grafter>['traversality'],
      node2is_worthy?: Lastparam<typeof GraftingTool.leafducer2grafter>['node2is_worthy'],
      reduced2is_worthy?: Lastparam<typeof GraftingTool.leafducer2grafter>['node2is_worthy'],
    }
  ) => {
    const cls = GraftingTool;
    const callname = `GraftingTool.action2leafducer @ ${DateTool.time2iso(new Date())}`;

    const mutativity = option?.mutativity ?? 'VOPLIKE';
    const traversality = option?.traversality ?? 'BROADCAST'; 
    const reduced2is_worthy = option?.reduced2is_worthy ?? (() => true);
    const node2is_worthy = option?.node2is_worthy ?? cls.node2is_worthy_default;

    const leafducer = <PO,PI>(p_in: PI, jedge: Jstep): PO => {
      // BROADCAST
      const is_broadcast = cls.node_jedge_traversality2is_broadcast(p_in, jedge, traversality);
      // console.log({callname, is_broadcast, p_in, jedge})
      if(is_broadcast){
        const p_out = (p_in as any[])?.map(pi_in => leafducer(pi_in, jedge))?.filter(node2is_worthy);
        return cls.parentpair2merged_broadcast(p_out,p_in as any[],{mutativity}) as PO;
      }
      else{
        const c_in: CI = p_in[jedge] as unknown as CI;
        const c_out: CO = ReactTool.prev2reduced(action, c_in);
        return cls.child_parent2merged_pinpoint({value: c_out, worthy:reduced2is_worthy(c_out)}, p_in, jedge, {mutativity})
      }
    };
    return leafducer;
  }

  static leafducer_delete = <PO,PI>(
    option?:{mutativity?: Lastparam<typeof GraftingTool.leafducer2grafter>['mutativity']},
  ):Leafducer<PO,PI> => {
    const cls = GraftingTool;
    const mutativity = option?.mutativity ?? 'VOPLIKE';

    return (p_in: PI, jedge: Jstep): PO => {
      return cls.child_parent2merged_pinpoint({worthy:false}, p_in, jedge, {mutativity})
    };
  }

  static action2grafter = <CO,CI=CO>(
    action: StateAction<CO,CI>,
    option?:Lastparam<typeof GraftingTool.action2leafducer>,
  ) => {
    const cls = GraftingTool;
    const leafreducer = cls.action2leafducer<CO,CI>(action, option);
    const grafter = cls.leafducer2grafter(leafreducer, option);
    return grafter;
  }

  static tree2grafted = <RO,RI>(
    tree:RI,
    jpath:Jpath,
    leafducer:Leafducer<RO,RI>,
    option?:Lastparam<typeof GraftingTool.action2leafducer>,
  ):RO => {
    const cls = GraftingTool;
    const grafter = cls.leafducer2grafter(leafducer, option);
    return grafter(tree, jpath);
  }
}