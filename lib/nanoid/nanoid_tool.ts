import { customAlphabet, customRandom, urlAlphabet } from 'nanoid';
import { Cipherspace } from '../cipher/cipher_tool';

export default class NanoidTool{
  
  static cipherspace_default():Cipherspace{
    return {
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
      size: 21, // https://github.com/ai/nanoid
    }
  }

  static alnum_human = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  static alpha_human = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  static alphabet_size2code = (alphabet:string, size:number,) => customAlphabet(alphabet)(size);
  static rng2generator = (
    rng:() => number,
    options?:{
      alphabet?: string,
      size?: number,
    }
  ): (() => string) => {
    return customRandom(
      options?.alphabet ?? urlAlphabet,
      options?.size ?? NanoidTool.cipherspace_default().size,
      size => (new Uint8Array(size)).map(() => 256 * rng()),
    );
  }
}