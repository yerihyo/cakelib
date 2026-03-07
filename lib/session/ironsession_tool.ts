import { IronSession} from "iron-session";
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";
import { Dictkey } from "../native/native_tool";

export default class IronsessionTool {
  static session2data_upserted = <X extends Record<K,V>, K extends Dictkey=Dictkey, V=any, >(
    session: IronSession<X>,
    data: X,
  ): IronSession<X> => {
    const cls = IronsessionTool;
    const callname = `IronsessionTool.session2data_upserted @ ${DateTool.time2iso(new Date())}`;

    return DictTool.keys(data).reduce<IronSession<X>>(
      (s, k,) => {
        // console.log({ callname, s, k, data });
        s[k] = DictTool.is_dict(data[k])
          ? DictTool.merge_dicts([s[k], data[k]], DictTool.WritePolicy.dict_overwrite)
          : data[k];
        return s;
      },
      session
    );
  }
}