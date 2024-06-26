import { IronSession, IronSessionData } from "iron-session";
import DictTool from "../collection/dict/dict_tool";
import DateTool from "../date/date_tool";

export default class IronsessionTool {
  static session2data_upserted = (session: IronSession, data: IronSessionData): IronSession => {
    const cls = IronsessionTool;
    const callname = `IronsessionTool.session2data_upserted @ ${DateTool.time2iso(new Date())}`;

    DictTool.keys(data).reduce(
      (s, k,) => {
        // console.log({ callname, s, k, data });
        s[k] = DictTool.is_dict(data[k])
          ? DictTool.merge_dicts([s[k], data[k]], DictTool.WritePolicy.dict_overwrite)
          : data[k];
        return s;
      },
      session
    )
    return session;
  }

}