import { IncomingHttpHeaders } from "http";

export default class HttpheaderTool{
  // https://stackoverflow.com/a/74624652
  // https://github.com/jakeburden/next-absolute-url/blob/master/index.ts
  static headerz2info = (
    headerz: IncomingHttpHeaders,
    // req?: IncomingMessage,
    option?:{
      localhostAddress:string,
    }
  ) => {
    const cls = HttpheaderTool;

    const localhostAddress = option?.localhostAddress ?? 'localhost:3000';

    const host_simple = (headerz ? headerz.host : window.location.host) || localhostAddress;
    const host = (() => {
      const x_forwarded_host = headerz?.['x-forwarded-proto'];
      return !(typeof x_forwarded_host === 'string')
        ? host_simple
        : x_forwarded_host?.split(',')?.[0]
    })();

    const protocol = (() => {
      const protocol_simple = HttpheaderTool.hostname2isLocalNetwork(host_simple) ? 'http:' : 'https:'
  
      const x_forwarded_proto = headerz?.['x-forwarded-proto'];
      return !(typeof x_forwarded_proto === 'string')
        ? protocol_simple
        : `${x_forwarded_proto?.split(',')?.[0]}:`
        ;
    })();

    const origin = `${protocol}//${host}`;

    return {protocol, host, origin};
  }
  
  static hostname2isLocalNetwork = (hostname:string) => {
    return (
      hostname.startsWith('localhost') ||
      hostname.startsWith('127.0.0.1') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.0.') ||
      hostname.endsWith('.local')
    )
  }

  static headers2host = (headers:Headers):string => headers?.get("Host");
}