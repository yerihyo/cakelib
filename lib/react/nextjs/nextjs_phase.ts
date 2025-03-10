import { PHASE_PRODUCTION_BUILD } from "next/dist/shared/lib/constants";


/**
 * Reference: https://github.com/vercel/next.js/discussions/22036
 */
export class NextjsPhase {
  static phase = () => { return process.env.NEXT_PHASE; }
  static phase2is_prodbuild = (phase) => { return phase === PHASE_PRODUCTION_BUILD; }
}