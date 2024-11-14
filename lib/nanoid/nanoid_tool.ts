import {customRandom, nanoid, urlAlphabet,} from 'nanoid';
import { Cipherspace } from '../cipher/cipher_tool';
import ArrayTool from '../collection/array/array_tool';
import DateTool from '../date/date_tool';

export default class NanoidTool{
  
  static cipherspace_default():Cipherspace{
    return {
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
      size: 21, // https://github.com/ai/nanoid
    }
  }

  static alnum_human = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  static alpha_human = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ';

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