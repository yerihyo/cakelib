import ComponentTool from "../ComponentTool";

describe("ComponentTool.Scrollinfo.dims2edges", () => {
  const f = ComponentTool.Scrollinfo.dims2edges;

  it("왼쪽 끝: 오른쪽으로만 넘길 수 있다", () => {
    expect(f({ scrollLeft: 0, offsetWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: false, is_scrollable_right: true });
  });

  it("가운데: 양쪽 다 넘길 수 있다", () => {
    expect(f({ scrollLeft: 500, offsetWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: true, is_scrollable_right: true });
  });

  it("오른쪽 끝: 왼쪽으로만 넘길 수 있다", () => {
    expect(f({ scrollLeft: 2000, offsetWidth: 1000, scrollWidth: 3000 })).toEqual({ is_scrollable_left: true, is_scrollable_right: false });
  });

  it("내용이 상자보다 좁으면 어느 쪽도 못 넘긴다", () => {
    expect(f({ scrollLeft: 0, offsetWidth: 1000, scrollWidth: 800 })).toEqual({ is_scrollable_left: false, is_scrollable_right: false });
  });
});
