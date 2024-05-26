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

  static alphabet_human(){
    return 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  }

  static rng2generator(
    rng:() => number,
    options?:{
      alphabet?: string,
      size?: number,
    }
  ): (() => string){
    const cls = NanoidTool;

    const alphabet = options?.alphabet ?? urlAlphabet;
    const size = options?.size ?? cls.cipherspace_default().size;

    const generator = customRandom(
      alphabet,
      size,
      size => (new Uint8Array(size)).map(() => 256 * rng()),
    );
    return generator;
  }
}