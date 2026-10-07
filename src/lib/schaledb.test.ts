import { describe, expect, it } from "vitest";
import { isReleasedOn, matchesQuery, parseStudents } from "./schaledb";

const raw = {
  "20027": {
    Id: 20027,
    Name: "白子（泳装）",
    DevName: "Shiroko_Swimsuit",
    SquadType: "Support",
    TacticRole: "Supporter",
    BulletType: "Explosion",
    ArmorType: "CompositeArmor",
    IsReleased: [true, true, false],
    SearchTags: ["水白子"],
  },
  "10000": { Id: 10000, Name: "阿露", DevName: "Aru", SquadType: "Main", IsReleased: [true, true, true] },
};

describe("parseStudents", () => {
  const students = parseStudents(raw);

  it("sorts by ID and maps fields", () => {
    expect(students.map((s) => s.id)).toEqual([10000, 20027]);
    expect(students[1]).toMatchObject({ squadType: "Support", armor: "CompositeArmor", tags: ["水白子"] });
  });

  it("tracks per-server release state", () => {
    const shiroko = students[1];
    expect(shiroko && isReleasedOn(shiroko, "global")).toBe(true);
    expect(shiroko && isReleasedOn(shiroko, "cn")).toBe(false);
  });

  it("searches names, dev names, IDs and tags", () => {
    const shiroko = students[1];
    if (!shiroko) throw new Error("missing");
    expect(matchesQuery(shiroko, "泳装")).toBe(true);
    expect(matchesQuery(shiroko, "swimsuit")).toBe(true);
    expect(matchesQuery(shiroko, "20027")).toBe(true);
    expect(matchesQuery(shiroko, "水白")).toBe(true);
    expect(matchesQuery(shiroko, "aru")).toBe(false);
  });
});
