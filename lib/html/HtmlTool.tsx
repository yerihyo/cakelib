import React, { CSSProperties, MutableRefObject } from 'react'
import CacheTool from '../cache/cache_tool';
// import AssertTool from '../assert/assert_tool';
// import NativeTool from '../native/native_tool';

export default class HtmlTool{
  static interpolate(
    array: React.ReactNode[],
    index2delim: (i: number) => React.ReactNode,
  ): React.ReactNode[] {
    return array.reduce(
      (accu: React.ReactNode[], elem: React.ReactNode, i: number) =>
        (accu === undefined ? [elem] : [...accu, index2delim(i), elem]),
      undefined) as React.ReactNode[];
  }

  static node2keyed(node:React.ReactNode, key:(number|string)){
    return <React.Fragment key={`${key}`}>{node}</React.Fragment>;
  }

  // reference: https://stackoverflow.com/a/66614633
  static blob2download = (blob:Blob, filename:string) => {
    const objectUrl = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  }
  
//     static DivRelheight(props:{
//         ratio:number,
//         children:React.ReactNode,
//         // position:'top'|'bottom',
//     }){
//         const {ratio, children} = props;

//         // const padding = position === 'top' ? 'paddingTop' : 'paddingBottom';
        
//         return (
//             <div style={{
//                 position:'relative',
//                 // [padding]:`${ratio*100}%`,
//                 paddingBottom:`${ratio*100}%`,
//             }}>
//                 <div style={{
//                     position:'absolute',
//                     width: '100%', height:'100%',
//                 }}>
//                     {children}
//                 </div>
//             </div>
//         );
//     }

//     static ratio2percent(ratio:number){ return `${100 * ratio}%` }

//     static style_w100p_h100vh() : CSSProperties{
//         return {
//             position: 'absolute',
//             width: '100%',
//             height: '100vh',
//         };
//     }

//     static fit_child_to_parent(
//         child_size: number,
//         parent_size:number,
//         // ref2size: (ref:MutableRefObject<HTMLDivElement>) => number,
//         adjust_size: (size:number) => any,
//     ){
//         if (child_size <= parent_size) { return; }
//         adjust_size(parent_size/child_size);
//         // set_font_rem(x => x * parent_width / text_width * 0.9);
//     }


//     static ForeignObjectFullAbsolute(props: {
//         children:React.ReactNode,
//         style_foreignObject?:React.CSSProperties,
//         style_div?:React.CSSProperties,
//     }){
//         const self = HtmlTool;

//         const {children, style_foreignObject,style_div} = props;
//         return (
//             <foreignObject x='0' y='0' width='100%' height='100%' style={{ ...style_foreignObject, }}>
//                 <div style={{ position: 'absolute', width: '100%', height: '100%', ...style_div, }}>
//                     {children}
//                 </div>
//             </foreignObject>
//         )
//     }

//     static ForeignObjectFullCenter(props: {
//         children:React.ReactNode,
//     }){
//         const self = HtmlTool;

//         const {children,} = props;
//         return (
//             <foreignObject x='0' y='0' width='100%' height='100%'>
//                 <self.FullCenteringInner>
//                     {children}
//                 </self.FullCenteringInner>
//             </foreignObject>
//         )
//     }

//     static FullCenteringInner(props: {
//         children: React.ReactNode,
//     }) {
//         const { children } = props;
//         return (
//             <div style={{ position: 'absolute',
//             width: '100%', height:'100%',
//             display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
//                 {children}
//             </div>
//         );

//     }

//     // static CssSvgFull(){
//     //     return {
//     //         position: 'absolute', inset: 0,
//     //         width:'100%', height:'100%',
//     //     };
//     // }

//     // static ForeignObjectFull(props: {
//     //     children:React.ReactNode,
//     // }){
//     //     const { children } = props;
//     //     return (
//     //         <foreignObject x="0" y="0" width="100%" height="100%">
//     //             {children}
//     //         </foreignObject>
//     //     )   
//     // }
//     static SvgViewbox(props: {
//         viewbox:{width:number, height:number,},
//         children:React.ReactNode,
//         attrs?:Record<string,any>,
//     }){
//         const self = HtmlTool;
//         const { viewbox, children, attrs } = props;

//         return (
//             <svg {...(attrs||{})}
//                 // preserveAspectRatio="xMinYMid meet"
//                 style={{
//                     position: 'absolute', inset: 0,
//                     width:'100%', height:'100%',
//                     ...((attrs ? attrs.style : undefined) || {})
//                 }}
//                 viewBox={`0 0 ${viewbox.width} ${viewbox.height}`}
//             >
//                 <foreignObject x="0" y="0" width="100%" height="100%">
//                     {children}
//                 </foreignObject>
//             </svg>
//         )
//     }
}

// export class HtmlPositionTool {
//     static position2justifyContent(position: string): string { // ('flex-start' | 'flex-end' | 'center' ) {
//         // https://stackoverflow.com/a/62823024/1902064 Typescript justifyContent

//         // StandardLonghandProperties<ReactText, string & {}>.justifyContent?: Property.JustifyContent
//         AssertTool.assert_in(position, ['left', 'center', 'right']);
//         // const is_center = position === 'center';

//         if (position === 'left') { return 'flex-start'; }
//         if (position === 'center') { return 'center'; }
//         if (position === 'right') { return 'flex-end'; }

//         throw new Error(`position: ${position}`);
//     }
// }

// export class YoutubeFrame{
//     static aspect_ratio(){ return 16 / 9; }

//     static bound_default(){
//         return {w:1920, h:1080};
//     }
//     static viewbox_default(){
//         const self = YoutubeFrame;
//         return self.width2viewbox(self.bound_default().w);
//     }
//     static width2viewbox(width:number):string{
//         const self = YoutubeFrame;
//         const h = width / self.aspect_ratio();
//         return `0 0 ${width} ${h.toFixed(1)}`;
//     }

//     static ForeignObject(props: {
//         children:React.ReactNode,
//     }) {
//         const self = YoutubeFrame;
//         const {children} = props;

//         const b = self.bound_default();

//         return (
//             <foreignObject x="0" y="0" width="100%" height="100%">
//                 <div style={{ width: '100%', aspectRatio: `${b.w} / ${b.h}`, }}>
//                     {children}
//                 </div>
//             </foreignObject>
//         )
//     }

//     static Fullscreen(props: {
//         children: React.ReactNode,
//         // style?: CSSProperties,
//     }) {
//         const self = YoutubeFrame;
//         const { children } = props;

//         return (
//             <svg preserveAspectRatio="xMidYMin meet"
//                 style={{ ...HtmlTool.style_w100p_h100vh(), }}
//                 viewBox={self.viewbox_default()}
//             >
//                 <self.ForeignObject>
//                     {children}
//                 </self.ForeignObject>
//             </svg>
//         );
//     }
// }

