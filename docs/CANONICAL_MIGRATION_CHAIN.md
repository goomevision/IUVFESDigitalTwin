# Canonical Drizzle Migration Chain

The canonical MySQL/Drizzle migration chain is generated from `drizzle/schema.ts` and its tracked Drizzle metadata. It is **source governance only**: none of these migrations has been applied to production as part of this change.

| Order | Migration | Purpose |
|---:|---|---|
| 0000 | `0000_youthful_daredevil.sql` | Core application tables. |
| 0001 | `0001_purple_ozymandias.sql` | Persistent ClosedLoop session recovery. |
| 0002 | `0002_known_wolfpack.sql` | Runtime scientific-event journal. |
| 0003 | `0003_open_peter_quill.sql` | Research, evidence, and provenance tables with foreign-key dependencies. |

`scientific-data.sql` is a **non-canonical development scaffold**. It uses a different naming and type convention and must not be applied with the canonical MySQL/Drizzle sequence.

The execution order is `0000 → 0001 → 0002 → 0003`. A production migration still requires an approved database-change plan, verified backup and rollback capability, deployment of the complete backend, and a separate release decision. P10 remains blocked until those preconditions are satisfied.
