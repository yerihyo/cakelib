// pages/api/address/islands/index.ts

import { promises as fs } from 'fs';
import { NextApiRequest, NextApiResponse } from "next";
// import fs from 'fs'
import getConfig from 'next/config';
import path from 'path';
import CacheTool from "../../../cache/cache_tool";
import ArrayTool from "../../../collection/array/array_tool";
import DictTool from "../../../collection/dict/dict_tool";
import GroupbyTool from "../../../groupby/groupby_tool";
const { serverRuntimeConfig } = getConfig()



class Addressinfo {
  zipcode: string;
  prefix: string;

  static infos_island = CacheTool.memo_one((): Promise<Addressinfo[]> => {
    
    // http://domeggook.com/main/popup/item/popup_itemDeliFeeZone.php
    const filepath = path.join(serverRuntimeConfig.PROJECT_ROOT, './pages/api/address/islands/prefix.list');

    // https://vercel.com/guides/loading-static-file-nextjs-api-route
    const addressinfo_island = fs.readFile(filepath, {encoding:'utf8'})
      .then(s => s.split("\n").map(
        line => {
          const [zipcode, prefix] = line.split('\t', 2);
          // console.log({ zipcode, prefix });
          return { zipcode, prefix }
        })
      );
    return addressinfo_island;
  });

  static infos2dict_zipcode2prefixes = (infos:Addressinfo[]) => DictTool.dict2values_mapped(
    GroupbyTool.dict_groupby_1step(infos,x => x?.zipcode,),
    (k,l) => ArrayTool.uniq(l?.map(info => info?.prefix?.trim())),
  );
}


export default async (req:NextApiRequest, res:NextApiResponse) => {
  if (req.method !== "GET") { return res.status(404).send(""); }

  const dict_zipcode2infos = await Addressinfo.infos_island().then(infos => Addressinfo.infos2dict_zipcode2prefixes(infos))
  return res.status(200).json(dict_zipcode2infos);
};
