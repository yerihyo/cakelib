import UrlTool from "../url_tool";

describe("UrlTool.text2segments_url", () => {
  test("글 사이의 링크를 조각으로", () => {
    expect(UrlTool.text2segments_url("확인하세요.\nhttps://a.com/x?y=1 부탁드립니다")).toEqual([
      { text: "확인하세요.\n" },
      { text: "https://a.com/x?y=1", url: "https://a.com/x?y=1" },
      { text: " 부탁드립니다" },
    ]);
  });
  test("문장 끝 구두점은 링크에서 뺀다", () => {
    expect(UrlTool.text2segments_url("주소: http://localhost:3000/a/b.")).toEqual([
      { text: "주소: " },
      { text: "http://localhost:3000/a/b", url: "http://localhost:3000/a/b" },
      { text: "." },
    ]);
  });
  test("http(s) 가 아닌 스킴은 링크가 아니다 (XSS)", () => {
    expect(UrlTool.text2segments_url("javascript:alert(1) data:text/html,x")).toEqual([
      { text: "javascript:alert(1) data:text/html,x" },
    ]);
  });
  test("태그·따옴표에서 주소가 끊긴다 — 속성 주입이 링크에 섞이지 않게", () => {
    expect(UrlTool.text2segments_url('https://a.com/"onmouseover=x <b>')).toEqual([
      { text: "https://a.com/", url: "https://a.com/" },
      { text: '"onmouseover=x <b>' },
    ]);
  });
  test("링크 없음·빈 글·null", () => {
    expect(UrlTool.text2segments_url("안녕")).toEqual([{ text: "안녕" }]);
    expect(UrlTool.text2segments_url("")).toEqual([]);
    expect(UrlTool.text2segments_url(undefined)).toBeUndefined();
  });
});
