// keyspace 인자는 `digit` 이 아니라 **`size`** 다 (cipher_tool.ts:25 `keyspace_to.size`).
//   `digit` 으로 넘기면 size 가 undefined → `Math.pow(q, undefined)` = NaN → 빈 문자열이 나온다.
import CipherTool from '../cipher_tool';

test('CipherTool.ciphertext2rehashed', () => {
    expect(CipherTool.ciphertext2rehashed(
        {key:'A', alphabet:'AB'}, // 0_2 = 0
        {alphabet:'CD', size:1}, // 0_2 = 0
    )).toStrictEqual('C');

    expect(CipherTool.ciphertext2rehashed(
        {key:'B', alphabet:'AB'}, // 1_2 = 1
        {alphabet:'CD', size:1}, // 1_2 = 1
    )).toStrictEqual('D');

    expect(CipherTool.ciphertext2rehashed(
        {key:'B', alphabet:'AB'}, // 1_2 = 1
        {alphabet:'CD', size:2}, // 1_2 = 01_2
    )).toStrictEqual('CD');

    expect(CipherTool.ciphertext2rehashed(
        {key:'BAB', alphabet:'AB'}, // 101_2 = 5
        {alphabet:'CD', size:2}, // 5%4 = 1 = 01_2
    )).toStrictEqual('CD');

    expect(CipherTool.ciphertext2rehashed(
        {key:'BAB', alphabet:'AB'}, // 101_2 = 5
        {alphabet:'CDE', size:2}, // 5 = 12_3
    )).toStrictEqual('DE');

    expect(CipherTool.ciphertext2rehashed(
        {key:'ABAB', alphabet:'AB'}, // 0101_2 = 5
        {alphabet:'CDE', size:2}, // 5 = 12_3
    )).toStrictEqual('DE');

    expect(CipherTool.ciphertext2rehashed(
        {key:'BABA', alphabet:'AB'}, // 1010_2 = 10
        {alphabet:'CDE', size:2}, // 10 % 9 = 1 = 01_3
    )).toStrictEqual('CD');

    expect(CipherTool.ciphertext2rehashed(
        {key:'DCDA', alphabet:'ABCDEF'}, // 3230_6 = 738
        {alphabet:'CDE', size:2}, // 738 % 9 = 0 = 00_3
    )).toStrictEqual('CC');

    expect(CipherTool.ciphertext2rehashed(
        {key:'45958487', alphabet:'0123456789'},
        {alphabet:'01234567', size:4}, // 257242527_9
    )).toStrictEqual('2527');

    expect(CipherTool.ciphertext2rehashed(
        {key:'45958487', alphabet:'0123456789'},
        {alphabet:'012345678', size:5}, // 105427165_9
    )).toStrictEqual('27165');
});

