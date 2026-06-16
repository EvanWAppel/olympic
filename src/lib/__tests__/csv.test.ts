import { describe, expect, it } from "vitest"
import { toCsv } from "../csv"

describe("toCsv", () => {
  it("writes a header row from the column keys", () => {
    const csv = toCsv([{ a: 1, b: 2 }], ["a", "b"])
    expect(csv.split("\n")[0]).toBe("a,b")
  })

  it("serializes rows in column order, not object order", () => {
    const csv = toCsv([{ b: 2, a: 1 }], ["a", "b"])
    expect(csv).toBe("a,b\n1,2")
  })

  it("quotes values containing commas, quotes, or newlines", () => {
    const csv = toCsv(
      [{ note: 'has, comma', q: 'say "hi"', nl: "line1\nline2" }],
      ["note", "q", "nl"],
    )
    expect(csv).toBe('note,q,nl\n"has, comma","say ""hi""","line1\nline2"')
  })

  it("renders null and undefined as empty fields", () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }], ["a", "b", "c"])
    expect(csv).toBe("a,b,c\n,,0")
  })

  it("renders Date values as ISO strings", () => {
    const d = new Date("2026-05-31T18:00:00.000Z")
    const csv = toCsv([{ at: d }], ["at"])
    expect(csv).toBe("at\n2026-05-31T18:00:00.000Z")
  })

  it("emits only a header row when there are no data rows", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b")
  })
})
