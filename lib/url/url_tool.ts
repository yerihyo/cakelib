import lodash from 'lodash';
import useSWR, { SWRResponse } from 'swr';
import CacheTool from '../cache/cache_tool';
import ArrayTool from '../collection/array/array_tool';
import CsvTool from '../csv/csv_tool';
import DateTool from '../date/date_tool';
import { Pair } from '../native/native_tool';
import DictTool from '../collection/dict/dict_tool';
import ReactTool from '../react/react_tool';
import { url } from 'inspector';
// const assert = require('assert');

export class UrlsearchparamsTool{
  static codec_identical = () => ({decode: (s:string)=>s, encode: (s:string)=>s});
  static values2imploded = (l: (string|number)[], option?:{delim?:string}) => {
    if(!ArrayTool.bool(l)) return undefined;

    const delim = option?.delim ?? ',';

    const l_invalid = l?.filter(x => (typeof x === 'string' && x?.includes(delim)));
    if(ArrayTool.bool(l_invalid)){
      throw new Error(`List items must not contain a comma. ${l_invalid?.map(x => `'${x}'`)?.join(delim)}`);
    }

    return ArrayTool.sorted(l).join(delim);
  }

  static str2decommad = (s: string):string[] => s?.split(',');
  static values2commad = (l: (string|number)[]) => UrlsearchparamsTool.values2imploded(l, {delim:','});
  
  static params2string = (params:URLSearchParams):string => params?.toString();
  static parse = (x:string) => (new URLSearchParams(x));

  static params2obj = (params: URLSearchParams) => Object.fromEntries(params);
  static params_key2string = (params: URLSearchParams, k:string) => params?.get(k);
  static params_key2decommad = lodash.flow(
    UrlsearchparamsTool.params_key2string,
    UrlsearchparamsTool.str2decommad,
  );
}


export default class UrlTool{
  static parse = (s:string):URL => { return new URL(s); }
  /**
   * reference: https://stackoverflow.com/a/47397016/1902064
   * @param url 
   * @param location 
   */
  // static isUrlFromLocation(url:string, location:Location):boolean {
  //   // var pageLocation = window.location;
  //   var URL_HOST_PATTERN = /(\w+:)?(?:\/\/)([\w.-]+)?(?::(\d+))?\/?/;
  //   var urlMatch = URL_HOST_PATTERN.exec(url) || [];
  //   var urlparts = {
  //       protocol:   urlMatch[1] || '',
  //       host:       urlMatch[2] || '',
  //       port:       urlMatch[3] || ''
  //   };
  
  //   function defaultPort(protocol) {
  //      return {'http:':80, 'https:':443}[protocol];
  //   }
  
  //   function portOf(location) {
  //      return location.port || defaultPort(location.protocol||location.protocol);
  //   }
  
  //   return !!(  (urlparts.protocol  && (urlparts.protocol  == location.protocol)) &&
  //               (urlparts.host     && (urlparts.host      == location.host))     &&
  //               (urlparts.host     && (portOf(urlparts) == portOf(location)))
  //           );
  // }

  /**
   * reference: https://stackoverflow.com/a/72956522
   * @param a 
   * @param b 
   */
  static areSameOrigin(a:string, b:string) {
    const callname = `UrlTool.areSameOrigin @ ${(new Date())?.toISOString()?.split("T")?.[1]}`;

    if(a==null || b == null){ return undefined; }
    console.log({callname, a, b})

    const urlA = new URL(a);
    const urlB = new URL(b);
    console.log({callname, 'urlA.origin':urlA.origin, 'urlB.origin':urlB.origin})
    return urlA.origin === urlB.origin;
  }

  static urlstring2nohash = (urlstring:string):string => {
    if(urlstring == null) return undefined;
    
    const url = new URL(urlstring) //(location.href);
    // console.log(url)
    url.hash="";
    return url?.toString();
    // console.log(url)
  }
  static origin_urlpath2url = (origin:string, urlpath:string):string => {
    return ArrayTool.any([
      origin == null,
      urlpath == null,
    ])
      ? undefined
      : [origin,urlpath]?.filter(Boolean)?.join('');
  }
  static dict2entries = DictTool.entries<string,string>;
  static h2l = DictTool.entries<string,string>;

  // static dict2pairlist = (x:Record<Dictkey,number|string>) => Object.entries(x).map(([k,v]) => [k,v.toString()]);

  static param2string(param: (string | string[] | null)) : (string | null){
    if(!param){ return null; }
    return param.toString();
  }
  static hashlistToQueryString(h_list) {
    const keyValuePairs = [];

    Array.prototype.forEach.call(h_list,
      h => {
        for (const key in h) {
          keyValuePairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(h[key]));
        }
      }
    )
    return keyValuePairs.join('&');
  }

  static qvalue2forcearray = (v:string|string[]):string[] => ArrayTool.is_array(v) ? (v as string[]) : [v as string];

  static url2noparams(url:string):string{
    return url.split('?')[0];
  }

  static dirname = (url:string):string => {
    return url?.split('/')?.slice(0, -1)?.join('/');
  }

  static url2noscheme(url:string){
    // https://stackoverflow.com/a/8206299
    return url.replace(/(^\w+:|^)\/\//, '');
    // https://stackoverflow.com/a/8206279
    // return url.replace(/^https?:\/\//, '');
  }

  static hash2querystring(h) {
    return Object.keys(h).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(h[k])).join('&')
  }

  static kv2urlquery = (k:string, v:string):Record<string,string> => 
    (k == null || v == null) ? undefined : !v ? {} : {[k]:v};
  
  static key_values2param_str(k: string, values: string[]): string {
    return ArrayTool.join("&", values.map(v => `${k}=${v}`));
  }

  static record2kvlist = (h:Object|Record<string,string|number>):Pair<string>[] => h ? Object.entries(h).map(([k,v]) => [k,v?.toString()]) : undefined;

  static listhash2qstring(h) {
    // special treat array

    const kv_list = [];

    for (const key in h) {
      const isArray = Array.isArray(h[key])
      const values = isArray ? h[key] : [h[key]]
      const k = isArray ? `${key}[]` : key

      Array.prototype.forEach.call(values,
        v => kv_list.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)))
        
    }

    // console.log({kv_list})

    return kv_list.join('&');
  }

  static hash2qstring(h:Record<string,number|string|string[]>, options?:{collection?:'CSV'|'MULTI'}) {
    const {collection:collection_in} = (options || {});

    const collection = collection_in ?? 'CSV';

    const key_values2kv_list = function (k, values, collection) {
      if (collection === "CSV") {
        // console.log({"stringify([values])":stringify([values])})
        const v = CsvTool.array2stringify(values)
        return [[k, v]]
      }
      else if (collection === "MULTI") {
        const kv_list = values.map(v => [k, v])
        return kv_list
      } else {
        throw new Error(`Invalid collection : ${collection}`)
      }
    }
    

    const l_out = [];

    for (const k in h) {
      const isArray = Array.isArray(h[k])
      const kv_list = isArray ? key_values2kv_list(k, h[k], collection) : [[k,h[k]]]
      // const k = key  // isArray ? `${key}[]` : key

      Array.prototype.forEach.call(kv_list,
        kv => l_out.push(encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]))
      )  
    }

    // console.log({kv_list})

    return l_out.join('&');
  }

  static params2appended = function(url:string, params:any, options?):string{
    const cls = UrlTool;

    if(url==null){ return undefined; }
    if(!params){ return url; }
    
    const querystring = cls.hash2qstring(params, options)
    return querystring ? `${url}?${querystring}` : url
  }

  /**
   * https://stackoverflow.com/a/5817566/1902064
   */
  static url2basestring(url:URL){
    // const url = new URL(urlstring);
    return `${url.protocol}//${url.host}${url.pathname}`;
  }

  // static urlstring2pathname_querystring = (urlstring:string) => urlstring.split('?', 2) as Pair<string>;

  static urlstring2paramkeys_dropped = (
    urlstring: string,
    paramkeys?: string[],
  ): string => {
    const cls = UrlTool;
    const callname = `UrlTool.urlstring2paramkeys_dropped @ ${DateTool.time2iso(new Date())}`;

    if (urlstring == null) { return undefined; }
    if (!ArrayTool.bool(paramkeys)) { return urlstring; }

    const [baseurl, str_params] = urlstring.split('?', 2);
    const params_url = UrlsearchparamsTool.parse(str_params || '');
    
    const paramkeyset = new Set(paramkeys);

    const params_out = new URLSearchParams(
        [...params_url.entries()].filter(([k, _]) => !paramkeyset.has(k))
    );

    const urlstring_out = params_out.toString() ? `${baseurl}?${params_out.toString()}` : baseurl;

    // console.log({
    //     callname,
    //     urlstring, 
    //     baseurl, 
    //     paramkeys, 
    //     params_url: Object.fromEntries(params_url.entries()), 
    //     str_params, 
    //     params_out: params_out.toString(), 
    //     urlstring_out,
    // });

    return urlstring_out;
  }

  static urlstring2paramkeys_kept = (
    urlstring: string,
    paramkeys?: string[],
  ): string => {
    const cls = UrlTool;
    const callname = `UrlTool.urlstring2paramkeys_kept @ ${DateTool.time2iso(new Date())}`;
  
    if (urlstring == null) { return undefined; }
    if (!ArrayTool.bool(paramkeys)) { return urlstring; }
  
    const [baseurl, str_params] = urlstring.split('?', 2);
    const params_url = UrlsearchparamsTool.parse(str_params || '');
  
    const paramkeyset = new Set(paramkeys);
  
    // Keep only the parameters that are in paramkeyset
    const params_out = new URLSearchParams(
      [...params_url.entries()].filter(([k, _]) => paramkeyset.has(k))
    );
  
    const urlstring_out = params_out.toString() ? `${baseurl}?${params_out.toString()}` : baseurl;

    return urlstring_out;
  }

  static urlstring2params_reduced = (
    // urlstring:string,
    urlstring_in:string,
    // params_in?:Record<string,string|string[]>,

    params_action:Pair<string>[] | ((params_prev:Pair<string>[]) => Pair<string>[]),
    // options?,
  ):string => {
    const cls = UrlTool;
    const callname = `UrlTool.urlstring2params_upserted @ ${DateTool.time2iso(new Date())}`;

    // console.log({callname, params_in});
    
    if(urlstring_in==null){ return undefined; }
    if(!params_action){ return urlstring_in; }

    const [str_nohash, str_hash] = urlstring_in?.split('#', 2) ?? [];
    const [baseurl, str_params_prev] = str_nohash?.split('?', 2) ?? [];
    
    const params_prev:URLSearchParams = UrlsearchparamsTool.parse(str_params_prev || '');
    const pairstr_list = ReactTool.prev2actioned(params_action, Array.from<Pair<string>>(params_prev),);
    
    // const keys_in = new Set(params_in.map(([k,_]) => k));

    const keys_null = pairstr_list?.filter(([k,v]) => v == null)?.map(([k,v]) => k);
    if(ArrayTool.bool(keys_null)){ throw new Error(`Keys cannot be null: ${keys_null?.join(', ')}`); }

    const str_params_out = new URLSearchParams(pairstr_list)?.toString();

    const urlstring_out = [
      [
        baseurl,
        ...(str_params_out ? [str_params_out] : []),
      ].join('?'),
      ...str_hash ? [str_hash] : [],
    ]?.join('#');

    // console.log({callname, urlstring_out, urlstring_in, str_hash, baseurl, str_nohash})

    return urlstring_out;
  }

  static urlstring2params_upserted = (
    // urlstring:string,
    urlstring_prev:string,
    // params_in?:Record<string,string|string[]>,
    params_in:Pair<string>[],
    // options?,
  ):string => {
    const cls = UrlTool;
    const callname = `UrlTool.urlstring2params_upserted @ ${DateTool.time2iso(new Date())}`;

    const params_clean = params_in?.filter(([k,v]) => v != null);
    const keys_clean = params_clean?.map(([k,_]) => k) ?? [];
    return !ArrayTool.bool(params_clean)
      ? urlstring_prev
      : UrlTool.urlstring2params_reduced(
          urlstring_prev,
          (params_prev:Pair<string>[]) => {
            const params_out = [
              ...params_prev?.filter(([k,_]) => !ArrayTool.in(k, keys_clean)),
              ...params_clean ?? [],
            ];
            // console.log({callname, params_out, params_clean, params_prev, })
            return params_out;
          }
        );
  }

  // static urlstring2params_upserted_NOTWORKING_FOR_PATHNAME = (
  //   // urlstring:string,
  //   urlstring_prev:string,
  //   // params_in?:Record<string,string|string[]>,
  //   params_in?:Pair<string>[],
  //   // options?,
  // ):string => {
  //   const cls = UrlTool;
  //   const callname = `UrlTool.urlstring2params_upserted @ ${DateTool.time2iso(new Date())}`;

  //   // console.log({callname, params_in});
    
  //   if(urlstring_prev==null){ return undefined; }
  //   if(!ArrayTool.bool(params_in)){ return urlstring_prev; }

  //   console.log({callname, urlstring_prev})

  //   // const url_prev = new URL(urlstring_prev) //(location.href);
  //   const url_out = params_in?.reduce<URL>(
  //     (url:URL, kv:Pair<string>) => {
  //       const [k,v] = kv;
  //       if(v == null){ url.searchParams?.delete(k); }
  //       else{ url.searchParams?.set(k,v); }
  //       return url;
  //     },
  //     new URL(urlstring_prev),
  //   );
  //   return url_out?.toString();
  // }


  // if value contains "," than error will occur
  // static urlstring2list = (s: string) => {
  //   if (!s) { return undefined; }
  //   const s_list: string[] = s?.split(",");
  //   return s_list;
  // }

  // static str2decommad = (s: string):string[] => s?.split(',');
  // static values2commad = (l: (string|number)[]) => {
  //   if(!ArrayTool.bool(l)) return undefined;

  //   const l_invalid = l?.filter(x => (typeof x === 'string' && x?.includes(',')));
  //   if(ArrayTool.bool(l_invalid)){
  //     throw new Error(`List items must not contain a comma. ${l_invalid?.map(x => `'${x}'`)?.join(', ')}`);
  //   }

  //   return ArrayTool.sorted(l).join(',');
  // }
  // if value contains "," than throw error
  // static list2urlstring = <T>(list: T[]): string | undefined => {
  //   if (!list || list.length === 0) { return undefined; }
    
  //   // Check if any item in the list contains a comma
  //   for (const item of list) {
  //     if (typeof item === 'string' && item.includes(',')) {
  //       throw new Error("List items must not contain a comma.");
  //     }
  //   }
    
  //   return list.join(",");
  // }
  // static list2urlstring = UrlsearchparamsTool.values2commad;


  static getQueryParams(url: string): Record<string, string> {
    const queryStart = url.indexOf("?");
    if (queryStart === -1) {
      return {};
    }

    const queryString = url.slice(queryStart + 1);
    const queryParamsArray = queryString.split("&");
    const queryParams: Record<string, string> = {};
    for (const param of queryParamsArray) {
      const [key, value] = param.split("=");
      if (key) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }

    return queryParams;
  }

  // static params2appended = (
  //   url: string,
  //   params: Record<string, number|string | string[]>,
  //   options?: { collection?: 'CSV' | 'MULTI' },
  // ) => {
  //   const cls = UrlTool;

  //   const [origin, rest] = url.split("?", 2);
  //   const [qstr_prev, hash_] = rest.split("#", 2);

  //   const params_pref = (() => {
  //     if(!qstr_prev){ return undefined; }

  //     DictTool.merge_dicts(
  //       qstr_prev.split('&').map(x => {
  //       const [k,v] = x.split("=",2);
  //       return {[k]:v};
  //     }),

  //   })();
  //   // const hash = hash_ ? `#${hash_}` : '';
  //   // console.log({str_url})
  //   // const url = new URL(str_url);
  //   // const hash = url.hash;
  //   // url.hash = '';

  //   const querystring = cls.hash2qstring(params, options);
  //   const token = origin.includes('?') ? `&` : `&`;

  //   return querystring ? `${origin}${token}${querystring}${hash}` : `${origin}${hash}`
  // }

  static aspath2pathname = (aspath:string):string => aspath?.split('?')?.[0];
}

export class MimetypeTool{
  static dict_mimetype2extension = CacheTool.memo_one(():Record<string,string> => {
    return {
      'image/jpeg':'jpg',
      'image/png':'png',
    }
  })

  static mimetype2extension = (mimetype:string):string => MimetypeTool.dict_mimetype2extension()?.[mimetype];

  static url2mimetype = async (url:string):Promise<string> => {    
    return url == null
    ? undefined
    : fetch(url, { method: 'HEAD' })
    .then(r => r?.headers?.get('content-type'))
  }

  static url2mimetype_swr = (url:string):SWRResponse<string> => {
    const cls = MimetypeTool;

    return useSWR(
      url == null ? undefined : [`MimetypeTool.url2mimetype_swr`, url],
      ([_, url]) => cls.url2mimetype(url),
      {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      },
    );
  }
}

