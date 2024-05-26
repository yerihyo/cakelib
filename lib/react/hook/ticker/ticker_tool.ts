import React, { MutableRefObject } from 'react';
import { nanoid } from 'nanoid';

import DateTool from '../../../date/date_tool';
import SetTool from '../../../collection/set/set_tool';

const assert = require('assert');
// const lodash = require('lodash');

export class Ticker {
  key: string;
  pivot: Date;
  init_at: Date;
  secs_passed: number;
  updatePivot: (pivot: Date) => void;
  terminate: () => void;
  // pause: (key:string) => void;
  add_blocker: (key: string) => boolean;
  resolve_blocker: (key: string) => void;
  // status: {key?:string, status: string};

  get_blockers?: () => Set<string>;
  // blockers_resolved?: Set<string>;
}

export default class TickerTool {

  static delim() {
    return ' ';
  }

  static ticker2downsampled = (ticker: Ticker, ms_period: number,): Ticker => {
    const ticker_prev_ref = React.useRef(ticker);
    const ticker_prev = ticker_prev_ref.current;

    const secs2index_downed = secs => Math.floor(secs * 1000 / ms_period);
    const index_downed_prev = secs2index_downed(ticker_prev.secs_passed);
    const index_downed_this = secs2index_downed(ticker.secs_passed);
    if (index_downed_prev < index_downed_this) { ticker_prev_ref.current = ticker; }
    return ticker_prev_ref.current;
  }

  static useTicker = (param: {
    key?: string,
    ms_period: number,
    // status?: {
    //   key?: string,
    //   status: string,
    // },
    blockers?: string[],
  }): Ticker => {

    const self = TickerTool;
    const callname = `TickerTool.useTicker @ ${DateTool.time2iso(new Date())}`;
    const isLogEnabled = false;

    const { key: key_in, ms_period, blockers: blockers_in } = param;
    const key = key_in ? key_in : nanoid();
    const init_at = React.useRef(new Date()).current;
    const pivotRef = React.useRef(init_at); // React.useRef(new Date());
    const [event, setEvent] = React.useState<string>();

    // const pivotRef = HookTool.ref2updated(React.useRef(null), pivot);

    // const blockers_active_ref = React.useRef<Set<string>>(new Set<string>(ArrayTool.bool(blockers_in) ? blockers_in : []));
    const blockers_active_ref = React.useRef<Set<string>>(new Set<string>());
    const blockers_resolved_ref = React.useRef<Set<string>>(new Set<string>());
    // console.log({callname, 'blockers_active':blockers_active_ref.current});

    const blocker_permanent = null;

    const add_blocker = (name: string): boolean => {
      // const { callstr } = DateTool.dt2callstr_data(init_at);
      // const callname = `TickerTool.useTicker.add_blocker ${callstr}`;

      const blockers_active = blockers_active_ref.current;
      const blockers_resolved = blockers_resolved_ref.current;

      // if(!name){ throw new Error(); }
      // console.log({
      //   callname,
      //   source:'add_blocker',
      //   name,
      //   blockers_active,
      //   blockers_resolved,
      // });

      assert(name !== blocker_permanent);

      if (SetTool.in(name, blockers_resolved)) { return false; }
      blockers_active.add(name);
      return true;
    }

    const resolve_blocker = (name: string): void => {
      // const { callstr } = DateTool.dt2callstr_data(init_at);
      // const callname = `TickerTool.useTicker.resolve_blocker ${callstr}`;

      const blockers_active = blockers_active_ref.current;
      const blockers_resolved = blockers_resolved_ref.current;

      // console.log({
      //   callname,
      //   source:'resolve_blocker',
      //   name,
      //   blockers_active,
      //   blockers_resolved,
      // });

      assert(name !== blocker_permanent);

      // if(!SetTool.in(name, blockers_active)){ return; }
      blockers_active.delete(name);
      blockers_resolved.add(name);
    }

    const are_blockers_cleared = () => SetTool.isEmpty(blockers_active_ref.current);

    const updatePivot = (pivot_in: Date): boolean => {
      // const { callstr } = DateTool.dt2callstr_data(init_at);
      // const callname = `TickerTool.useTicker.updatePivot ${callstr}`;

      const ms_wait = Math.max(DateTool.subtract2millisecs(pivot_in, new Date()), 0);

      const blockers_cleared = are_blockers_cleared();
      isLogEnabled && console.log({
        callname,
        source:'updatePivot',
        pivot_in: DateTool.time2iso(pivot_in),
        'blockers_active_ref.current': blockers_active_ref.current,
        'blockers_resolved_ref.current': blockers_resolved_ref.current,
        ms_wait,
        blockers_cleared,
      });

      if (!blockers_cleared) { return false; }

      setTimeout(() => {
        // const { callstr } = DateTool.dt2callstr_data(init_at);
        // const callname = `TickerTool.useTicker.updatePivot.setTimeout ${callstr}`;

        const blockers_cleared = are_blockers_cleared();
        isLogEnabled && console.log({
          callname,
          source:'updatePivot.setTimeout',
          blockers_cleared,
        });

        if (!blockers_cleared) { return; }

        pivotRef.current = new Date();
        setEvent(nanoid());
      }, ms_wait);

      return true;
    }

    React.useEffect(() => {
      // const { callstr } = DateTool.dt2callstr_data(init_at);
      // const callname = `TickerTool.useTicker.useEffect ${callstr}`;

      const dt_wakeup = DateTool.ms2added(pivotRef.current, ms_period);
      const ms_sleep = Math.max(0, DateTool.subtract2millisecs(dt_wakeup, new Date(),));

      const pivot_prev = pivotRef.current;
      // const status_prev = status_ref.current;

      isLogEnabled && console.log({
        callname,
        source:'useEffect',
        dt_wakeup: DateTool.time2iso(dt_wakeup),
        ms_sleep,
        // status_prev,
      });

      setTimeout(() => {
        // const { callstr } = DateTool.dt2callstr_data(init_at);
        // const callname = `TickerTool.useTicker.useEffect.setTimeout ${callstr}`;

        const has_collision = (pivot_prev !== pivotRef.current);
        isLogEnabled && console.log({
          callname, has_collision,
          source:'useEffect.setTimeout',
          pivot_prev: DateTool.time2iso(pivot_prev),
          pivot: DateTool.time2iso(pivotRef.current),
        });

        if (has_collision) { return; }

        updatePivot(new Date());
      }, ms_sleep);
    }, [event]);

    const ticker: Ticker = {
      key,
      init_at,
      secs_passed: DateTool.subtract2secs(pivotRef.current, init_at),
      pivot: pivotRef.current,
      // pivot2status,
      // addAlarms,
      updatePivot,
      terminate: () => { blockers_active_ref.current.add(blocker_permanent); },
      add_blocker,
      resolve_blocker,

      get_blockers: () => blockers_active_ref.current,
      // blockers_resolved:blockers_resolved_ref.current,
      // pause: (key) => {
      //   const {callstr} = DateTool.dt2callstr_data(init_at);
      //   const callname = `TickerTool.useTicker.pause ${callstr}`;
      //   console.log({callname,key});

      //   setPaused(key, true);
      // },
      // status: status_ref.current,
    };

    return ticker;
  }

  static useTimemachinedTicker(
    param: {
      ms_period: number,
      // status?: {key?:string, status:string},
    },
    ms_timemachine: number,
  ): Ticker {
    /**
     * 0 : real timeline
     * 1 : timemachined timeline
     */
    const self = TickerTool;

    const { ms_period, } = param;

    const dt2shifted = (dt) => DateTool.millisecs2added(dt, ms_timemachine || 0);  // 0 => 1
    const dt2unshifted = (dt) => DateTool.millisecs2added(dt, -(ms_timemachine || 0));  // 1 => 0

    // const pivot2status0 = pivot2status1 ? ((dt0: Date) => pivot2status1(dt2shifted(dt0))) : undefined;

    const ticker0 = self.useTicker({
      ms_period,
      // status: status1,
    });

    const ticker1 = {
      key: ticker0.key,
      init_at: dt2shifted(ticker0.init_at),
      secs_passed: ticker0.secs_passed,
      pivot: dt2shifted(ticker0.pivot),
      // addAlarms: (alarms1:{date:Date, action:() => void}[]) => {
      //   const alarms0 = alarms1.map(a1 => ({date: dt2unshifted(a1.date), action:a1.action}));
      //   ticker0.addAlarms(alarms0);
      // },
      updatePivot: (dt1: Date) => ticker0.updatePivot(dt2unshifted(dt1)),
      terminate: ticker0.terminate,
      add_blocker: ticker0.add_blocker,
      resolve_blocker: ticker0.resolve_blocker,
    }

    return ticker1;
  }

  // static ticker2halting(ticker_in:Ticker, halt_at:Date) : Ticker{
  //   // const dt2shifted = (dt) => DateTool.millisecs2added(dt, ms_timemachine);
  //   // const dt2unshifted = (dt) => DateTool.millisecs2added(dt, -ms_timemachine);

  //   return {
  //     pivot: ticker_in.pivot,
  //     setEnabled: ticker_in.setEnabled,
  //     activatePivot: (pivot) => {
  //       if(halt_at && halt_at < pivot){
  //         ticker_in.setEnabled(false);
  //         return;
  //       }
  //       return ticker_in.activatePivot(pivot);
  //     },
  //   }
  // }
}