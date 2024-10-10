import React from "react";
import { Pair } from "../../native/native_tool";
import JsonTool from "../../collection/dict/json/json_tool";
import DateTool from "../../date/date_tool";

type Reacthook<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export class WindoweventTool{
  static key_value2event = <X,>(eventkey:string, value:X) => {
    return new CustomEvent(eventkey, { detail: value });
  }
  static event2value = <X,>(event:CustomEvent):X => {
    return event.detail;
  }
  static fireEvent = <X,>(eventkey:string, value:X) => {
    window.dispatchEvent(WindoweventTool.key_value2event(eventkey, value));
  }
}
export default class StorageTool {
  static key2hdoc = <X>(
    storage:Storage,
    storagekey: string,
  ): X => {
    return storagekey == null
      ? undefined
      : JsonTool.jstr2hdoc(storage.getItem(storagekey)) as X;
  }

  // static hdoc2storage = <X>(
  //   storage:Storage,
  //   storagekey: string,
  //   hdoc:Object,
  // ): X => {
  //   if (storagekey == null) { return undefined; }
  //   return JsonTool.jstr2hdoc(storage.getItem(storagekey));
  // }

  static updateItem(storage: Storage, k: string, s: string) {
    const cls = StorageTool;
    const callname = `StorageTool.updateItem @ ${DateTool.time2iso(new Date())}`;

    return s == null
      ? storage.removeItem(k)
      : storage.setItem(k, s);
  }
  static str2storage = StorageTool.updateItem
  static hdoc2storage = (s: Storage, k: string, hdoc: Object) => StorageTool.updateItem(s, k, JsonTool.hdoc2jstr(hdoc));

  // static storage_key2writer = (storage:Storage, key:string):((x:Object) => void) => {
  //   return (x:Object) => StorageTool.updateItem(storage, key, JsonTool.hdoc2jstr(x))
  // }
  

  static changeKey(storage:Storage, [key_from, key_to]:Pair<string>){
    const cls = StorageTool;

    const v = storage.getItem(key_from);
    cls.updateItem(storage, key_to, v);
    storage.removeItem(key_from);
  }

  // getItem:(key:string) => string;
  // setItem:(key:string, value:string,) => void;
  // removeItem:(key:string,) => void;


  
  static fireevent_setitem = <X>(key:string, value:X):boolean => {
    return window.dispatchEvent(WindoweventTool.key_value2event(key, value));
  }
  static fireevent_removeitem = (key: string,) => StorageTool.fireevent_setitem(key, undefined)

  // static setItem2eventfire_attached = (
  //   setItem: (key:string, value:string,) => void,
  // ) => {
  //   const cls = StorageTool;
  //   const callname = `StorageTool.setItem2eventfire_attached @ ${DateTool.time2iso(new Date())}`;

  //   return (key: string, value: string) => {
  //     // console.log({callname, key, value});
  //     setItem(key, value);
  //     window.dispatchEvent(cls.key_value2setitem_event(key, value));
  //   }
  // };

  // static removeItem2eventfire_attached = (
  //   removeItem: (key:string,) => void,
  // ) => {
  //   const cls = StorageTool;

  //   return (key: string) => {
  //     removeItem(key);
  //     window.dispatchEvent(cls.key2removeitem_event(key));
  //   };
  // };

  
}

