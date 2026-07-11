import { describe, expect, it } from "vitest";
import { isTabActive } from "./navigation";

describe("isTabActive", () => {
  it("홈 탭은 경로가 정확히 '/'일 때만 활성이다", () => {
    expect(isTabActive("/", "/")).toBe(true);
  });

  it("홈 탭은 다른 모든 경로에서 비활성이다", () => {
    expect(isTabActive("/recipes", "/")).toBe(false);
  });

  it("경로가 탭 href와 정확히 일치하면 활성이다", () => {
    expect(isTabActive("/recipes", "/recipes")).toBe(true);
  });

  it("탭 href의 하위 경로(생성 페이지)에서도 활성이 유지된다", () => {
    expect(isTabActive("/recipes/new", "/recipes")).toBe(true);
  });

  it("탭 href의 하위 경로(동적 id 페이지)에서도 활성이 유지된다", () => {
    expect(isTabActive("/recipes/abc-123", "/recipes")).toBe(true);
  });

  it("슬래시 경계 없이 문자열만 겹치는 유사 경로는 활성이 아니다", () => {
    expect(isTabActive("/recipes-archive", "/recipes")).toBe(false);
  });

  it("다른 탭의 경로에서는 비활성이다", () => {
    expect(isTabActive("/recipes", "/ingredients")).toBe(false);
  });

  it("마지막 탭(설정)도 정확히 일치하면 활성이다", () => {
    expect(isTabActive("/settings", "/settings")).toBe(true);
  });
});
