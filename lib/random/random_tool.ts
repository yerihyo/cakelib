export default class RandomTool {
  static seed2choice = <T>(seed: number, l: T[]):T => {
    // https://stackoverflow.com/a/5915122
    const n = l?.length;
    const index = Math.floor(seed * n);
    return l[index];
  }

  // https://stackoverflow.com/a/53758827
  static seed2shuffled = <T>(array:T[], seed:number) => {                // <-- ADDED ARGUMENT
    var m:number = array.length, t:T, i:number;
  
    const random = (seed_:number) => {
      var x = Math.sin(seed_++) * 10000; 
      return x - Math.floor(x);
    }

    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = Math.floor(random(seed) * m--);        // <-- MODIFIED LINE
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
      ++seed                                     // <-- ADDED LINE
    }
  
    return array;
  }

  static seed2shuffler = <T=any>(seed:number):((l_in:T[]) => T[]) => {                // <-- ADDED ARGUMENT
    const random = (seed_: number) => {
      var x = Math.sin(seed_++) * 10000;
      return x - Math.floor(x);
    }

    return (array: T[]) => {
      var m: number = array.length;
      var s: number = seed;
      // While there remain elements to shuffle…
      while (m) {
        // Pick a remaining element…
        const i: number = Math.floor(random(s) * m--);        // <-- MODIFIED LINE

        // And swap it with the current element.
        const t: T = array[m];
        array[m] = array[i];
        array[i] = t;
        ++s                                     // <-- ADDED LINE
      }

      return array;
    }
  }
  
  

  /**
 * https://stackoverflow.com/a/55480964/1902064
 */
  static seed2f_pseudorandom = (seed: number): () => number => {
    const baseSeeds = [123456789, 362436069, 521288629, 88675123];

    let [x, y, z, w] = baseSeeds

    const f_pseudorandom = ():number => {
      const t = x ^ (x << 11)
        ;[x, y, z] = [y, z, w]
      w = w ^ (w >> 19) ^ (t ^ (t >> 8))
      return w / 0x7fffffff
    }

      ;[x, y, z, w] = baseSeeds.map(i => i + seed)
      ;[x, y, z, w] = [0, 0, 0, 0].map(() => Math.round(f_pseudorandom() * 1e16))

    return f_pseudorandom;
  }
}