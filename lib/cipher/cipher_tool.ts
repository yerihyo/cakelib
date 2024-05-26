import ArrayTool from "../collection/array/array_tool";
import DateTool from "../date/date_tool";

export class Cipherspace{
  alphabet:string;
  size:number;
}


export default class CipherTool{
  /**
   * Could have done base conversion instead. :(
   * And replace digit number with character
   * @param from 
   * @param to
   */
  static ciphertext2rehashed(
    cipher_from:{key:string,alphabet:string},
    keyspace_to:Cipherspace,  // q ^ n
  ){
    const callname = `CipherTool.ciphertext2rehashed @ ${DateTool.time2iso(new Date())}`;

    // const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const q = keyspace_to.alphabet.length;
    const to_hashsize = Math.pow(q, keyspace_to.size);

    const dict_char2index = [...cipher_from.alphabet].reduce((h,c,i) => ({...h, [c]:i,}), {});
    
    const value = [...cipher_from.key].reduce((v,c) => (dict_char2index[c] + cipher_from.alphabet.length*v) % to_hashsize, 0);

    const [r,chars] = ArrayTool.range(0, keyspace_to.size).reduce(([v,l], i) => {
      // console.log({callname, v, l, i});
      return [Math.floor(v/q), [keyspace_to.alphabet[v%q], ...l]];
    }, [value, []]);

    // console.log({callname, dict_char2index, chars, value, to_hashsize, 'ArrayTool.range(0, to.digit)':ArrayTool.range(0, to.digit),});
    return chars.join('');
  }

}