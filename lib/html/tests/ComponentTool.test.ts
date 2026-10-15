import ComponentTool from "../ComponentTool";

describe("ComponentTool.Scrollinfo.dims2edges", () => {
  const f = ComponentTool.Scrollinfo.dims2edges;

  it("왼쪽 끝: 오른쪽으로만 넘길 수 있다", () => {
    expect(f({ scrollLeft: 0, clientWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: false, is_scrollable_right: true });
  });

  it("가운데: 양쪽 다 넘길 수 있다", () => {
    expect(f({ scrollLeft: 500, clientWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: true, is_scrollable_right: true });
  });

  it("오른쪽 끝: 왼쪽으로만 넘길 수 있다", () => {
    expect(f({ scrollLeft: 2000, clientWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: true, is_scrollable_right: false });
  });

  it("내용이 상자보다 좁으면 어느 쪽도 못 넘긴다", () => {
    expect(f({ scrollLeft: 0, clientWidth: 1000, scrollWidth: 800 })).toEqual({ is_scrollable_left: false, is_scrollable_right: false });
  });

  it("화면 확대로 scrollLeft 가 소수여도 오른쪽 끝을 끝으로 본다 (0.5px 남음)", () => {
    expect(f({ scrollLeft: 1999.5, clientWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: true, is_scrollable_right: false });
  });

  it("왼쪽 끝 근처의 소수 scrollLeft 도 끝으로 본다", () => {
    expect(f({ scrollLeft: 0.5, clientWidth: 1000, scrollWidth: 3000 }).is_scrollable_left).toBe(false);
  });

  it("1px 이상 남으면 넘길 수 있다", () => {
    expect(f({ scrollLeft: 1999, clientWidth: 1000, scrollWidth: 3000 }).is_scrollable_right).toBe(true);
  });
});

describe("ComponentTool.Scrollinfo.container2info", () => {
  it("판정은 dims2edges 와 같고, 이동량은 clientWidth 기준이다 (세로 스크롤바 15px 가 있는 상자)", () => {
    const element = { scrollLeft: 1985, clientWidth: 1000, offsetWidth: 1015, scrollWidth: 3000 } as unknown as HTMLElement;
    const info = ComponentTool.Scrollinfo.container2info(element);
    expect(info.is_scrollable_right).toBe(true); // offsetWidth 기준이면 끝으로 잘못 봤다
    expect(info.rightscrollMax).toBe(15);
    expect(info.leftscrollMax).toBe(1985);
  });
});
