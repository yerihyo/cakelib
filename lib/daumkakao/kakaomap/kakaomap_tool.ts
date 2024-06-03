import React from "react";
import { MutableRefObject } from "react";
import { Pair } from "../../native/native_tool";

export default class KakaomapTool{
  static latlon2mapimage_ref = <V extends Node,>(
    latlon:Pair<number>
    // ref:MutableRefObject<Element>
  ):MutableRefObject<V> => {
    // const {store,ref} = props;
    const ref = React.useRef<V>();
    
    React.useEffect(() => {
      kakao.maps.load(() => {
        if(!ref){ return; }
        const latlng = new kakao.maps.LatLng(latlon[0], latlon[1]);
        // var staticMapContainer  = document.getElementById('staticMap'), // 이미지 지도를 표시할 div  
        const staticMapOption = {
          center: latlng, // 이미지 지도의 중심좌표
          level: 3, // 이미지 지도의 확대 레벨
          marker: true,
        };

        // 이미지 지도를 표시할 div와 옵션으로 이미지 지도를 생성합니다
        new kakao.maps.StaticMap(ref.current, staticMapOption);
      });
    }, [latlon == null]);
    return ref;
  }

  static latlon2url(latlon:Pair<number>){
    return `https://map.kakao.com/link/map/나폴레옹과자점,${latlon[0]},${latlon[1]}`;
  }
}