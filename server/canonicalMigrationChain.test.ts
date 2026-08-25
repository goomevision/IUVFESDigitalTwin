import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

describe("canonical Drizzle migration chain", () => {
  it("registers the ordered core, session, journal, and research migrations", () => {
    const journal = JSON.parse(read("drizzle/meta/_journal.json")) as {
      entries: Array<{ idx: number; tag: string }>;
    };

    expect(journal.entries).toEqual([
      { idx: 0, version: "5", when: 1785426534237, tag: "0000_youthful_daredevil", breakpoints: true },
      { idx: 1, version: "5", when: expect.any(Number), tag: "0001_purple_ozymandias", breakpoints: true },
      { idx: 2, version: "5", when: expect.any(Number), tag: "0002_known_wolfpack", breakpoints: true },
      { idx: 3, version: "5", when: expect.any(Number), tag: "0003_open_peter_quill", breakpoints: true },
    ]);
  });

  it("keeps runtime persistence tables in canonical schema and generated migrations", () => {
    const schema = read("drizzle/schema.ts");
    const sessionMigration = read("drizzle/0001_purple_ozymandias.sql");
    const journalMigration = read("drizzle/0002_known_wolfpack.sql");
    const researchMigration = read("drizzle/0003_open_peter_quill.sql");

    expect(schema).toContain('mysqlTable("closedLoopSessions"');
    expect(schema).toContain('mysqlTable("scientificEventJournal"');
    expect(sessionMigration).toContain("CREATE TABLE `closedLoopSessions`");
    expect(journalMigration).toContain("CREATE TABLE `scientificEventJournal`");
    expect(researchMigration).toContain("CREATE TABLE `datasetManifests`");
    expect(researchMigration).toContain("CREATE TABLE `provenanceRecords`");
  });

  it("removes obsolete duplicate migration files and retains the scaffold as non-canonical", () => {
    expect(existsSync(join(root, "drizzle/0001_closed_loop_sessions.sql"))).toBe(false);
    expect(existsSync(join(root, "drizzle/0002_scientific_event_journal.sql"))).toBe(false);
    expect(existsSync(join(root, "drizzle/0002_scientific_research.sql"))).toBe(false);
    expect(read("drizzle/scientific-data.sql")).toContain("NON-CANONICAL DEVELOPMENT SCAFFOLD");
  });
});
