import crypto from "crypto";
import { promisify } from "util";

export interface ScryptParams {
  ln: number; // log2(N), N = 2^ln
  r: number;
  p: number;
}

export interface ScryptHashOptions extends ScryptParams {
  algo?: string; // PHC string format identifier (default: "scrypt")
  keylen?: number; // output bytes (default: 64)
  salt_bytes?: number; // salt bytes (default: 16)
}

export interface ScryptParsedHash {
  algo: string;
  params: ScryptParams;
  salt: Buffer;
  hash: Buffer;
}

/**
 * ScryptTool — scrypt 해싱 + PHC string format 직렬화/파싱.
 * Pure library: 입력으로 받은 파라미터만 사용. 프로젝트별 정책은 caller 가 결정.
 *
 * PHC string format:
 *   $<algo>$ln=<n>,r=<n>,p=<n>$<saltBase64>$<hashBase64>
 *   - argon2/scrypt 표준. 파라미터가 해시에 포함되어 향후 변경에도 검증 가능.
 *
 * 보안 특성:
 *   - timing-safe 비교 (crypto.timingSafeEqual)
 *   - per-password unique salt
 *   - async (이벤트 루프 미차단)
 */
export default class ScryptTool {
  private static scrypt_async = promisify(crypto.scrypt) as (
    password: string | Buffer,
    salt: string | Buffer,
    keylen: number,
    options?: crypto.ScryptOptions,
  ) => Promise<Buffer>;

  static is_phc = (value: string, algo: string = "scrypt"): boolean => {
    if (value == null) return false;
    return value.startsWith(`$${algo}$`);
  };

  static phc_parse = (hash: string): ScryptParsedHash => {
    if (hash == null) return undefined;
    const parts = hash.split("$");
    if (parts.length !== 5) return undefined;
    if (!parts[1]) return undefined;

    const param_dict: Record<string, string> = {};
    parts[2].split(",").forEach((kv) => {
      const [k, v] = kv.split("=");
      param_dict[k] = v;
    });

    const ln = parseInt(param_dict.ln);
    const r = parseInt(param_dict.r);
    const p = parseInt(param_dict.p);
    if (!Number.isFinite(ln) || !Number.isFinite(r) || !Number.isFinite(p)) return undefined;

    try {
      return {
        algo: parts[1],
        params: { ln, r, p },
        salt: Buffer.from(parts[3], "base64"),
        hash: Buffer.from(parts[4], "base64"),
      };
    } catch {
      return undefined;
    }
  };

  static phc_serialize = (
    algo: string,
    params: ScryptParams,
    salt: Buffer,
    hash: Buffer,
  ): string => {
    const param_str = `ln=${params.ln},r=${params.r},p=${params.p}`;
    return `$${algo}$${param_str}$${salt.toString("base64")}$${hash.toString("base64")}`;
  };

  /** 평문 → PHC scrypt 해시 문자열. */
  static password2hash = async (password: string, options: ScryptHashOptions): Promise<string> => {
    if (password == null) return undefined;

    const algo = options.algo ?? "scrypt";
    const keylen = options.keylen ?? 64;
    const salt_bytes = options.salt_bytes ?? 16;

    const salt = crypto.randomBytes(salt_bytes);
    const N = 1 << options.ln;
    // Node 의 scrypt 기본 maxmem (32 MiB) 은 큰 N 에 부족. 충분히 늘림.
    const maxmem = 128 * N * options.r * 2;

    const derived = await ScryptTool.scrypt_async(password, salt, keylen, {
      N,
      r: options.r,
      p: options.p,
      maxmem,
    });

    return ScryptTool.phc_serialize(algo, { ln: options.ln, r: options.r, p: options.p }, salt, derived);
  };

  /** PHC 해시 검증. 해시 안에 있는 파라미터로 재계산. timing-safe 비교. */
  static password_hash2is_valid = async (password: string, hash: string): Promise<boolean> => {
    if (password == null || hash == null) return false;

    const parsed = ScryptTool.phc_parse(hash);
    if (parsed == null) return false;

    const N = 1 << parsed.params.ln;
    const maxmem = 128 * N * parsed.params.r * 2;

    try {
      const derived = await ScryptTool.scrypt_async(password, parsed.salt, parsed.hash.length, {
        N,
        r: parsed.params.r,
        p: parsed.params.p,
        maxmem,
      });

      if (derived.length !== parsed.hash.length) return false;
      return crypto.timingSafeEqual(derived, parsed.hash);
    } catch {
      return false;
    }
  };
}
