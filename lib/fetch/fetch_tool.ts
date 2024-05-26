export class FetchTool{
  static method_body2option = (method:string, body:any):any => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? {body: JSON.stringify(body)} : {}),
  });

  static body2put_option = (body:any) => FetchTool.method_body2option('PUT', body);
  static body2post_option = (body:any) => FetchTool.method_body2option('POST', body);
  static body2delete_option = (body:any) => FetchTool.method_body2option('DELETE', body);

  static put = (url: string, body: any, options?: RequestInit) => fetch(url, { ...FetchTool.body2put_option(body), ...(options ?? {}) });
  static post = (url: string, body: any, options?: RequestInit) => fetch(url, { ...FetchTool.body2post_option(body), ...(options ?? {}) });
  static delete = (url: string, body: any, options?: RequestInit) => fetch(url, { ...FetchTool.body2delete_option(body), ...(options ?? {}) });

  static res2resok<R extends {ok:boolean}>(res: R): R {
    if (!res.ok) { throw res; }
    return res;
  }
  static res2jdoc_body = async <T,>(res: Response): Promise<T> => {
    return FetchTool.res2resok(res).json().then(jdoc => jdoc?.body);
  }
}
