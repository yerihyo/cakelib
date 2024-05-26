// export class Graph{
//   dict_e2vs: Record<string, [string,string]>;

import DictTool from "../collection/dict/dict_tool";
import SetTool from "../collection/set/set_tool";
import { Comparator } from "../cmp/CmpTool";
import { Pair } from "../native/native_tool";
// const lodash = require('lodash');

//   constructor(){
//     this.dict_e2vs = {};
//   }

//   add_edge(e:[string,string]){
//     this.dict_e2vs[e]
//   }
//   nodes(){
//     return undefined;
//   }

// }

export default class GraphTool{
  /**
   * adjtree => adjlist
   * deptree => deplist
   * @param xlist 
   */
  static xtree2xlist(xtree: Record<string,string[]>): Pair<string>[]{
    return Object.entries(xtree).map(([k,vs]) => vs.map(v => ([k,v] as [string,string]))).flat()
  }

  /**
   * adjlist => deplist & vice verse
   * @param xlist 
   */
  static xlist2flipped(xlist:Pair<string>[]): Pair<string>[]{
    return xlist.map(([s,e]) => ([e,s]));
  }

  /**
   * adjlist => adjtree
   * deplist => deptree
   * @param xlist Adjacency list. Dependency list will create dependency tree
   */
  static xlist2xtree(adjlist: Pair<string>[]): Record<string,Set<string>>{
    return adjlist.reduce(
      (h, [x1, x2]) => {
        h[x1] = h[x1] || new Set();
        h[x1].add(x2);
        return h;
      },
      {} as Record<string,Set<string>>
    );
  }
  // static edges2topolist(edges:Pair<string>[]): string[]{
  //   return toposort(edges);
  // }

  static node2offsprings(adjtree:Record<string,string[]>, s:string,):Set<string>{
    const unvisited: string[] = [s];
    const visited: Set<string> = new Set<string>();

    while(unvisited.length>0){
      const node = unvisited.shift();
      visited.add(node);
      unvisited.push(...(adjtree?.[node] || []).filter(x => !visited.has(x)));
    }
    return visited;
  }

  static nodes2nodes_unpreceded(nodes:string[], dict_node2ancestors:Record<string,Iterable<string>>):string[]{
    const node2is_preceded = (node:string):boolean => [...(dict_node2ancestors[node]||[])].some(n => nodes.includes(n));
    return nodes.filter(node => !node2is_preceded(node));
  }

  static adjtree2conntree(adjtree:Record<string,Iterable<string>>,):Record<string,Set<string>>{
    const dict_out: Record<string, Set<string>> = DictTool.merge_dicts(
      Object.keys(adjtree).map(k => ({ [k]: new Set(adjtree[k]) })),
      DictTool.WritePolicy.no_duplicate_key,
    );

    const n = Object.keys(adjtree).length;
    // const keys = Object.keys(adjtree);
    for(let i=0; i<n; i++){
      for(const s of Object.keys(adjtree)){
        [...dict_out[s]].forEach(e => ([...(adjtree[e]||[])]).forEach(x => dict_out[s].add(x)));
      }
    }
    return dict_out;
  }

  static comparator_topology(adjtree:Record<string,string[]>):Comparator<string>{
    const cls = GraphTool;

    return (node1:string, node2:string): number => {
      if (node1 === node2) { return 0; }
      if (cls.node2offsprings(adjtree, node1,).has(node2)) { return -1; }
      if (cls.node2offsprings(adjtree, node2,).has(node1)) { return 1; }
      return undefined;
    }
  }

  static nodes2ancestors(nodes: string[], dict_node2ancestors: Record<string, Iterable<string>>): Set<string> {
    return SetTool.cup(...nodes.map(x => DictTool.get(dict_node2ancestors, x)))
  }

}