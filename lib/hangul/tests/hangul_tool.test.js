import HangulTool from '../hangul_tool';

// 조사 '로/으로' 규칙: 받침 없음 또는 ㄹ받침 → '로', 그 외 받침 → '으로'.
//
// 판정은 한글 기준이라, 숫자로 끝나는 텍스트(전화번호 등)는 caller 가 digits2text() 로 변환해 넘긴다.
// 표시용("010-****-1530")과 판정용("영일영-****-일오삼영")이 다르므로 함수가 임의로 치환하지 않는다.

describe('HangulTool.digits2text', () => {
  it('숫자를 자릿수별 읽기로 — 수 읽기(천오백삼십) 아님', () => {
    expect(HangulTool.digits2text('1530')).toBe('일오삼영');
    expect(HangulTool.digits2text('5678')).toBe('오육칠팔');
  });

  it('숫자가 아닌 문자는 그대로 통과', () => {
    expect(HangulTool.digits2text('010-****-1530')).toBe('영일영-****-일오삼영');
    expect(HangulTool.digits2text('서울')).toBe('서울');
  });

  it('null 은 undefined', () => {
    expect(HangulTool.digits2text(null)).toBeUndefined();
  });
});

describe('HangulTool.text2ro_suffix — 한글', () => {
  it('ㄹ받침 → 로', () => {
    expect(HangulTool.text2ro_suffix('서울')).toBe('로');
  });
  it('ㄹ 아닌 받침 → 으로', () => {
    expect(HangulTool.text2ro_suffix('부산')).toBe('으로');
  });
  it('받침 없음 → 로', () => {
    expect(HangulTool.text2ro_suffix('제주')).toBe('로');
  });
  it('null 은 undefined', () => {
    expect(HangulTool.text2ro_suffix(null)).toBeUndefined();
  });
});

describe('HangulTool.text2ro_suffix — 숫자는 digits2text 를 거쳐서', () => {
  // 0 영(ㅇ) 3 삼(ㅁ) 6 육(ㄱ) → 으로 / 1 일(ㄹ) 7 칠(ㄹ) 8 팔(ㄹ) → 로 / 2 4 5 9 → 받침없음 → 로
  const cases = [
    ['0', '으로'], // 영
    ['1', '로'],   // 일 (ㄹ받침)
    ['2', '로'],   // 이
    ['3', '으로'], // 삼 (ㅁ받침)
    ['4', '로'],   // 사
    ['5', '로'],   // 오
    ['6', '으로'], // 육 (ㄱ받침)
    ['7', '로'],   // 칠 (ㄹ받침)
    ['8', '로'],   // 팔 (ㄹ받침)
    ['9', '로'],   // 구
  ];

  it.each(cases)('숫자 %s 로 끝나면 "%s"', (digit, josa) => {
    expect(HangulTool.text2ro_suffix(HangulTool.digits2text(digit))).toBe(josa);
  });

  it('마스킹된 전화번호 — 실제 사용 형태 (표시는 숫자 그대로, 판정만 읽기로)', () => {
    const label = (masked) =>
      `${masked}${HangulTool.text2ro_suffix(HangulTool.digits2text(masked))} 발송`;

    expect(label('010-****-1530')).toBe('010-****-1530으로 발송'); // 0=영
    expect(label('010-****-5678')).toBe('010-****-5678로 발송'); // 8=팔(ㄹ)
    expect(label('010-****-1234')).toBe('010-****-1234로 발송'); // 4=사
    expect(label('010-****-1236')).toBe('010-****-1236으로 발송'); // 6=육
  });
});

describe('HangulTool.text2ro_added — 한글 전용 편의 함수', () => {
  it('조사를 붙여 반환', () => {
    expect(HangulTool.text2ro_added('서울')).toBe('서울로');
    expect(HangulTool.text2ro_added('부산')).toBe('부산으로');
  });
  it('null 은 undefined', () => {
    expect(HangulTool.text2ro_added(null)).toBeUndefined();
  });
});
