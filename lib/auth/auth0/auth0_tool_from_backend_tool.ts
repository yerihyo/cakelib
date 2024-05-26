import React from 'react';

import DictTool from '../../../lib/collection/dict/dict_tool';
import NativeTool from '../../../lib/native/native_tool';
import UrlTool from '../../../lib/url/url_tool';
import ArrayTool from '../../../lib/collection/array/array_tool';
import HookTool from '../../../lib/react/hook/hook_tool';
import ReactTool from '../../../lib/react/react_tool';
import CacheTool from '../../../lib/cache/cache_tool';

const fetch = require("node-fetch");
const lodash = require('lodash');
const { DateTime } = require("luxon");

export default class BackendTool{
  static Host = class {
    static dict_env2host = CacheTool.memo_one(():Record<string,string> => {
      return {
        // local: 'http://localhost',  // https://github.com/nodejs/undici/issues/1413
        local: 'http://127.0.0.1:57426',
        lan: 'http://192.168.0.45:57426',
        dev: `http://backend-dev.service.local`,
        staging: `http://backend-staging.service.local`,
        prod: `http://backend.service.local`,
      }
    });

    static env2host(env:string){
      const cls = BackendTool.Host;
      return cls.dict_env2host()[env];
    }

    static url_nextjsapi() {
      return "/api/backend";
    }
  }

  static datetime_locale2str(datetime_tz, locale){
    // console.log({datetime_tz});
    if(!datetime_tz){ return "미정"; }

    // const date_now = new Date();
    // const tz = "Asia/Seoul";
    const dt_now_tz = DateTime.fromJSDate(new Date(), datetime_tz.zoneName);
    // const dt_in_tz = DateTime.fromJSDate(date_in, tz);

    const is_same_date = datetime_tz.toISODate() === dt_now_tz.toISODate();
    if(is_same_date){
      return datetime_tz.setLocale(locale).toLocaleString(DateTime.TIME_SIMPLE);
    }
    
    return datetime_tz.setLocale(locale).toLocaleString(DateTime.DATETIME_SHORT);
  }

  static async url_option2body_fetched({url, option}){
    // console.log({'function':'PtahTool.url_option2body_fetched', config})
    // if(!config){ return null; }
    if(!url){ return null; }
    if(!option){ return null; }

    const body = await fetch(url, option)
      .then(result => result.json())
      .then(j => j['body']);

    // console.log({'function':'PtahTool.url_option2body_fetched', config, body})
    // console.log({fetched});
    return body;
  }


  static fetched2data(fetched){
    if(!fetched){ return []}
  }

  static auth0_user_hook2is_login_req(auth0_user_hook){
    if(auth0_user_hook.isLoading){ return false; }
    if(auth0_user_hook.user){ return false; }
    return true;
  }
  
  static is_login_req(isLoadingAuth0User, auth0_user){
    return !isLoadingAuth0User && !auth0_user;
  }

  // static useUser(){
  //   const { user: auth0_user, isLoading: isLoadingAuth0User } = useNextjsUser();
  //   return PtahTool.auth0_user_id2useUser(Auth0Tool.user2user_id(auth0_user));
  // }

  static async fetchUsers(config: {auth0_user_ids?:string[], user_keys?:string[]}){
    const self = BackendTool;
    // console.log({config});
    if(!config){ return undefined; }

    const {auth0_user_ids, user_keys} = config;

    const is_ready = (() => {
      // console.log({auth0_user_ids, user_keys});
      if(!NativeTool.is_null_or_undefined(auth0_user_ids)){ return true; }
      if(!NativeTool.is_null_or_undefined(user_keys)){ return true; }
      return false;
    })();
    if(!is_ready){ return undefined; }

    const endpoint = `${self.Host.url_nextjsapi()}/sekhmet/users`;
    const url = UrlTool.params2appended(
      endpoint,
      DictTool.empty_values2excluded({ auth0_user_ids, user_keys }),
    );

    return fetch(url)
      .then(r => r.ok ? r : (() => {throw r;})())
      .then(r => r.json())
      // .then(j => {console.log({j}); return j;})
      .then(j => lodash.get(j, ['body','users']));
  }

  static async fetchUser(config: {auth0_user_id?:string, user_key?:string}){
    const self = BackendTool;
    if(!config){ return undefined; }

    const {auth0_user_id, user_key} = config;

    const config_out = DictTool.empty_values2excluded({
      auth0_user_ids: auth0_user_id ? [auth0_user_id] : null,
      user_keys: user_key ? [user_key] : null,
    });
    return self.fetchUsers(config_out)
      .then(ArrayTool.l2one);
  }

  static useUsers = (config: {auth0_user_ids?:string[], user_keys?:string[]}) => {
    const self = BackendTool;
    const {auth0_user_ids, user_keys} = config;
    const [data, setData] = React.useState({users:null, isFetching:true}); // result, isFetching

    function config2is_ready(auth0_user_ids, user_keys){
      // console.log({auth0_user_ids, user_keys});
      if(!NativeTool.is_null_or_undefined(auth0_user_ids)){ return true; }
      if(!NativeTool.is_null_or_undefined(user_keys)){ return true; }
      return false;
    }

    // console.log({auth0_user_ids, user_keys});
    const auth0_user_ids_ref = HookTool.ref2updated(React.useRef(null), auth0_user_ids);
    const user_keys_ref = HookTool.ref2updated(React.useRef(null), user_keys);

    React.useEffect(
      () => {
        const [auth0_user_ids, user_keys] = [auth0_user_ids_ref.current, user_keys_ref.current];
        if (!data.isFetching) { return; }  // is done
        if (!config2is_ready(auth0_user_ids, user_keys)) { return; }

        // console.log({data, auth0_user_id});
        // const params = {auth0_user_id:auth0_user.sub};
        const endpoint = `${self.Host.url_nextjsapi()}/sekhmet/users`;
        const url = UrlTool.params2appended(
          endpoint,
          DictTool.empty_values2excluded({ auth0_user_ids, user_keys }),
        );

        // console.log({url});
        self.url_option2body_fetched({url, option: { method: 'GET',}}).then(body => {
          const data_new = {
            users: body?.['users'],
            isFetching: false,
          };

          // if (isEqual(data, data_new)) { return; }
          // console.log({url, body, data_new});
          setData(data_new); // console.log({ 'message': 'useUsers.setData', data, data_new });
        });
      },
      [
        ArrayTool.join(" ", auth0_user_ids),
        ArrayTool.join(" ", user_keys),
        data.isFetching,
      ],
    );

    // console.log({data});

    // React.useEffect(async () =>
    //   self.url_option2body_fetched(config)
    //   .then(f => setUser(self.fetched2value(f, result=>result.user))),
    //   []);
    // console.log({"function":"PtahTool.useUser", auth0_user_id, data});
    return data;
  }

  static useUser(config: {auth0_user_id?:string, user_key?:string}){
    const self = BackendTool;

    const {auth0_user_id, user_key} = config;
    // console.log({auth0_user_id, user_key});

    const { users, isFetching } = self.useUsers(DictTool.empty_values2excluded({
      auth0_user_ids: auth0_user_id ? [auth0_user_id] : null,
      user_keys: user_key ? [user_key] : null,
    }));
    const user = !isFetching ? ArrayTool.l2one(users) : null;
    // console.log({users, isFetching, config});

    return {user, isFetching};
  }
}
