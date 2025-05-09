import { IncomingMessage } from 'http';
import lodash from 'lodash';
import { GetStaticPathsResult, NextApiRequest } from 'next';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { NextURL } from 'next/dist/server/web/next-url';
import Link from 'next/link';
import { NextRouter, Router } from 'next/router';
import { decode, encode, ParsedUrlQuery } from 'querystring';
import DateTool from '../../date/date_tool';
import StringTool from '../../string/string_tool';
import { UrlsearchparamsTool } from '../../url/url_tool';
import DictTool from '../../collection/dict/dict_tool';

export type SsrReq = IncomingMessage & { cookies: NextApiRequestCookies};

/**
 * if page doesn't reload when using Link,
 * put key={} into div so that
 * Next.js knows it's a different component
 */
export default class NextjsTool{
  static staticpaths_emptyfallback = <
    Params extends ParsedUrlQuery = ParsedUrlQuery
  >():GetStaticPathsResult<Params> => ({paths: [], fallback:true,});

  static Linka = (props:{
    children:React.ReactNode,
    href:string,
    [k: string]: any,  // https://stackoverflow.com/a/50288327/1902064
  }) => {
    const {children, href, ...rest} = props;

    return (
      (<Link href={href} passHref {...rest}>

        {children}

      </Link>)
    );
  }

  static req2ip(
    // request:NextRequest,
    req: NextApiRequest,
    // res: NextApiResponse<any>,
  ) {
    // const res = NextResponse.next();
    // let ip = request.ip ?? request.headers.get('x-real-ip')
    // const forwardedFor = request.headers.get('x-forwarded-for')
    // if (!ip && forwardedFor) {
    //   ip = forwardedFor.split(',').at(0) ?? 'Unknown'
    // }

    const forwarded = req.headers["x-forwarded-for"] as string;
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    return ip;
  }

  static router2replaceState = (
    router: NextRouter,
    // url: string,
    url: string,
    // options?: {
    //   shallow?: boolean;
    //   locale?: string | false;
    //   scroll?: boolean;
    //   unstable_skipClientCache?: boolean;
    // },
  ):Promise<boolean> => {
    const cls = NextjsTool;
    const callname = `NextjsTool.router2replaceState @ ${DateTool.time2iso(new Date())}`;
    // console.log({callname, 'location.href':location.href, url, as, options});

    // router.replace(location.href, url, options);
    // router.replace(as, );
    return router.replace(url, undefined, {shallow:true})
    // router.replace(url, as, options);
    // history.replaceState({}, '', as);
  }

  /**
   * https://github.com/vercel/next.js/issues/2694#issuecomment-732990201
   * @param onLeave 
   */
  static onLeave2attached(
    // router:NextRouter,
    onLeave:() => void,
    option?:{
      ms_wait?:number,
    }
  ) {
    const ms_wait = option?.ms_wait ?? 3000;

    window.onbeforeunload = onLeave;
    Router.events.on('routeChangeStart', onLeave);
    setTimeout(onLeave, ms_wait);
  }

  static query_key2string(query: ParsedUrlQuery, k:string) : string{
    // if (!query) { return undefined; }

    const s:string = (k in query) ? (query[k] as string) : undefined;
    return s;
  }

  static queryvalue2strings(v: (string|string[])):string[]{
    if(!v){ return undefined ;}
    
    if(Array.isArray(v)){ return v as string[]; }
    if(StringTool.is_string(v)){ return [(v as string)]; }
    throw new Error(`v: ${v}`);
  }

  static query_key2strings(query: ParsedUrlQuery, k:string) : string[]{
    // if (!query) { return undefined; }

    if(! (k in query)){ return undefined; }
    const v : (string|string[]) = query[k];

    return NextjsTool.queryvalue2strings(v);
  }

  static query_key2decommad = (query: ParsedUrlQuery, k:string) : string[] => 
    UrlsearchparamsTool.str2decommad(query?.[k] as string);

  static query_key2int(query: ParsedUrlQuery, k:string) : number{
    const s = NextjsTool.query_key2string(query, k);
    return s ? parseInt(s) : undefined;
  }

  // static context2host(context:any):string{
  //     return context?.req?.headers?.host;
  // }

  static ComponentLinkLegacy = (props: {
    href:string,
    children:React.ReactNode,
    [k: string]: any,
    // ...others:any,
  }):JSX.Element => {
    const {href, children, ...rest} = props;

    const is_href_real = !!href && href !== '#';

    return is_href_real
      ? <Link href={href} {...rest} legacyBehavior>{children}</Link>
      : <>{children}</>;
  };

  static ComponentLink = (props: {
    href?:string,
    children:React.ReactNode,
    [k: string]: any,
    // ...others:any,
  }):JSX.Element => {
    const {href, children, ...rest} = props;

    const is_href_real = !!href && href !== '#';

    return is_href_real
      ? <Link href={href} {...rest}>{children}</Link>
      : <div {...DictTool.keys2excluded(rest, ['passHref'])}>{children}</div>;
  };

  // static headers2host(headers: any): string {
  //   return headers?.host;
  // }

  // static documentcontext2query = (ctx:DocumentContext):ParsedUrlQuery => 
  //   parse(UrlTool.urlstring2querystring(ctx.asPath));

  static nexturl2pathname_updated = (nexturl_in:NextURL, pathname:string,):NextURL => {
    const nexturl_out = nexturl_in?.clone();
    nexturl_out.pathname = pathname;
    return nexturl_out;
  }

  // static headers2is_headers = (headers:Headers|IncomingMessage['headers']): headers is Headers => { return headers instanceof Headers; }

  // https://github.com/vercel/next.js/discussions/38596#discussioncomment-3138275
  // static req_key2header = (req:Request|IncomingMessage, key:string) => {
  //   const cls = NextjsTool;
  //   const callname = `NextjsTool.req_key2header @ ${DateTool.time2iso(new Date())}`;

  //   console.log({callname, req, key})
  //   if(req instanceof Request) return req?.headers?.get(key);
  //   if(req instanceof IncomingMessage) return req?.rawHeaders?.[key];
  //   return undefined;
  // }
  static headers2host = (headers:Headers):string => headers?.get('host'); // dev.backend.napoleonbakery.co.kr:57426
  static req2host = (req:Request|IncomingMessage):string => {
    const cls = NextjsTool;
    const callname = `NextjsTool.req2host @ ${DateTool.time2iso(new Date())}`;
        
    // NextRequest
    if(req instanceof Request) return cls.headers2host(req?.headers); // 'host works too
    
    // NextApiRequest
    if(req instanceof IncomingMessage) return req?.headers?.['host'];
    return undefined;
  }

  // export const hasMappedHeaders = (headers: Headers | IncomingMessage['headers']): headers is Headers => {
  //     return headers instanceof Headers;
  // };

  // // in another file...
  // export async function getIdentityToken(req: Request | IncomingMessage): Promise<JwtPayload> {
  //     const jwt = hasMappedHeaders(req.headers)
  //         ? req.headers.get('x-forwarded-jwt')
  //         : req.headers['x-forwarded-jwt'];

  //     return jwtDecode(String(jwt ?? '').replace('Bearer ', ''));
  // }
}

export class ParsedUrlQueryTool{
  static query2string = encode;
  static string2query = decode;

  static searchparams2parsedquery = lodash.flow((params:URLSearchParams) => params?.toString(), ParsedUrlQueryTool.string2query);
  static parsedquery2searchparams = lodash.flow(ParsedUrlQueryTool.query2string, UrlsearchparamsTool.parse);
}