import { IncomingMessage } from 'http';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import Link from 'next/link';
import { NextRouter, Router } from 'next/router';
import { parse, ParsedUrlQuery } from 'querystring';
import StringTool from '../../string/string_tool';
import lodash from 'lodash';
import { Url } from 'next/dist/shared/lib/router/router';
import DateTool from '../../date/date_tool';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import UrlTool from '../../url/url_tool';
import { DocumentContext } from 'next/document';

export type SsrReq = IncomingMessage & { cookies: NextApiRequestCookies};

/**
 * Reference: https://github.com/vercel/next.js/discussions/22036
 */
export class NextjsPhase{
  static phase(){
    return process.env.NEXT_PHASE;
  }

  static phase2is_prodbuild(phase:string){
    return phase === PHASE_PRODUCTION_BUILD;
  }
}

/**
 * if page doesn't reload when using Link,
 * put key={} into div so that
 * Next.js knows it's a different component
 */
export default class NextjsTool{
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

  static get(query: ParsedUrlQuery, k: string): any {
    return NextjsTool.query_key2value(query,k);
  }
  static query_key2value(query: ParsedUrlQuery, k:string) : any{
    // if (!query) { return undefined; }

    return (k in query) ? query[k] : undefined;
  }

  static query_key2string(query: ParsedUrlQuery, k:string) : string{
    // if (!query) { return undefined; }

    const s:string = (k in query) ? (query[k] as string) : undefined;
    return s;
  }
  static query_key2str = NextjsTool.query_key2string;

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
    UrlTool.commad2strings(query?.[k] as string);

  static query_key2int(query: ParsedUrlQuery, k:string) : number{
    const s = NextjsTool.query_key2str(query, k);
    return s ? parseInt(s) : undefined;
  }

  static context2host(context:any):string{
      return context?.req?.headers?.host;
  }

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
      : <>{children}</>;
  };

  // static headers2host(headers: any): string {
  //   return headers?.host;
  // }

  // static documentcontext2query = (ctx:DocumentContext):ParsedUrlQuery => 
  //   parse(UrlTool.urlstring2querystring(ctx.asPath));
}

export class RouterTool{

}