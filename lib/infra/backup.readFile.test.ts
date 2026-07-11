import { describe, expect, it } from "vitest";
import { readBackupFileAsJson } from "./backup";

function fileOf(content: string): File {
  return new File([content], "backup.json", { type: "application/json" });
}

describe("readBackupFileAsJson", () => {
  it("정상 JSON 파일이면 파싱된 객체를 반환한다", async () => {
    const result = await readBackupFileAsJson(fileOf(JSON.stringify({ a: 1 })));

    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("JSON 문법이 깨진 파일이면 예외 없이 InvalidJson Result를 반환한다", async () => {
    const result = await readBackupFileAsJson(fileOf("{ not valid json"));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidJson");
  });
});
