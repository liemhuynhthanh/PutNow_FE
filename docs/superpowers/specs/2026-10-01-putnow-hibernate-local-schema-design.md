# PutNow Hibernate-Managed Local Schema Design

**Date:** 2026-10-01  
**Status:** Approved, implemented, and verified locally  
**Scope:** Local/development schema management in `Booking_System`, plus the shared Docker environment

## 1. Decision

PutNow will remove Flyway and make the Spring Boot entity model the source of truth for a fresh local/development PostgreSQL schema.

The existing local PostgreSQL volume will be deleted once after the implementation is complete. Hibernate will then create a clean schema and continue managing compatible incremental changes with `ddl-auto=update`.

This decision applies only to local/development. Production must never use Hibernate to mutate the schema automatically.

## 2. Goals

- Remove the Flyway runtime dependencies, migration SQL, seed SQL, and Flyway-specific configuration and tests.
- Let a new local PostgreSQL database start directly from the JPA/Hibernate model.
- Preserve the important integrity rules currently expressed in Flyway SQL by moving them into Java mappings and application normalization.
- Seed only the required `ADMIN` and `USER` roles in the development profile.
- Keep production fail-safe with schema validation instead of automatic mutation.
- Keep all changes uncommitted so both repositories can be reviewed separately.

## 3. Non-Goals

- Preserving the current contents of the local `putnow-postgres-data` volume.
- Providing production schema deployment automation in this change.
- Reproducing PostgreSQL partial or expression indexes byte-for-byte.
- Adding demo users, concerts, vouchers, or bookings.

## 4. Configuration by Environment

Configuration will be split so schema mutation is explicitly limited to development:

| Environment | Hibernate setting | Behavior |
| --- | --- | --- |
| Common/default safety baseline | `ddl-auto=validate` | Fails if an externally provisioned schema does not match the entities. |
| `dev` profile | `ddl-auto=update` | Creates a new local schema and applies Hibernate-supported compatible changes. |
| Automated unit tests using H2 | `ddl-auto=create-drop` | Creates an isolated schema per test context. |
| PostgreSQL Testcontainers integration tests | `ddl-auto=create-drop` | Verifies that the complete entity model can create and use a clean PostgreSQL schema. |
| `prod` profile | `ddl-auto=validate` | Never creates, alters, or drops production objects. |

The application may continue to default to the `dev` profile for local startup. Docker Compose will also start the backend with the `dev` profile explicitly so its behavior is visible rather than accidental.

Without Flyway, a future production deployment must provision its schema through a separately approved production process before the backend starts. Until then, production startup intentionally fails validation when the schema is absent or incompatible.

## 5. Entity Model as Schema Source

Each persistent model will explicitly describe its database contract rather than relying on Hibernate defaults:

- stable table and column names;
- required versus nullable columns;
- lengths and numeric precision/scale;
- ordinary unique constraints;
- foreign-key relationships and delete behavior where Hibernate mappings support them;
- indexes used by current repository queries;
- optimistic-lock version columns;
- database check constraints through Hibernate annotations for status, amount, quantity, discount, and usage invariants.

The existing `Instant` fields remain the time representation and map to PostgreSQL timestamp-with-time-zone columns. VND values remain integral `numeric(19,0)` values with no fractional scale.

### Relationship hardening

`Token.userId` and `PasswordResetToken.userId` are currently scalar IDs, so Hibernate cannot create foreign keys for them. They will become required lazy `User` relationships. Refresh-token rotation links will become self-referencing `Token` relationships where practical, preserving the current service behavior through explicit ID accessors or updated service code.

This is an internal breaking refactor, not an API contract change. It prevents orphan token records in a schema created only from entities.

## 6. Normalized Uniqueness

Standard JPA annotations cannot create portable indexes such as `UNIQUE(lower(trim(email)))`. The application will instead store canonical values and use ordinary unique constraints:

- email: trimmed and lowercased;
- username/name used for sign-in: trimmed and normalized consistently with current lookup behavior;
- role name: trimmed and uppercased;
- voucher code: trimmed and uppercased;
- ticket-type name: trimmed, with uniqueness scoped to its concert using the stored canonical form.

Normalization must happen before persistence in the relevant application service or domain method. Repository lookup methods must apply the same rules. Database unique constraints then protect the normalized stored values from races.

This approach replaces the former functional indexes without keeping SQL migration scripts.

## 7. Index Strategy

Indexes that can be represented by JPA `@Index` will be declared on entity tables, including current query paths for:

- concert status and start time;
- booking owner, concert, status, and expiry;
- booking idempotency per user;
- ticket types by concert;
- active refresh tokens by user and family;
- password-reset token lookup and expiry;
- voucher code and enabled/expiry lookup.

PostgreSQL partial indexes such as an index limited to pending expired bookings cannot be generated portably by JPA. For local/development they will be replaced with equivalent ordinary composite indexes. Query behavior remains correct; the trade-off is potentially larger indexes and less efficient scans at production-scale data volumes.

## 8. Development Bootstrap Data

A development-only initializer will run after Hibernate has prepared the schema:

- it is active only under the `dev` profile;
- it upserts `ADMIN` and `USER` roles idempotently;
- it never logs or creates passwords;
- it does not create demo business data;
- repeated restarts do not create duplicate rows.

The SQL repeatable seed file will be removed along with the migration directories.

## 9. Test Changes

Flyway-specific test wiring and `FlywayMigrationIntegrationTest` will be removed. A PostgreSQL Testcontainers schema integration test will replace it and will:

1. start an empty PostgreSQL container;
2. let Hibernate create the schema with `create-drop`;
3. verify the expected tables, primary keys, unique constraints, foreign keys, check constraints, and important indexes through PostgreSQL metadata;
4. persist a minimal connected entity graph;
5. assert that representative invalid or duplicate data is rejected by the database.

Existing service, security, concurrency, and frontend tests remain required. H2 tests continue to use `create-drop`, but PostgreSQL Testcontainers is the authoritative schema verification because H2 does not implement all PostgreSQL behavior.

## 10. One-Time Local Reset

After code and tests are ready, the local stack will be stopped and only the exact named database volume will be removed:

```powershell
docker compose down
docker volume inspect putnow-postgres-data
docker volume rm putnow-postgres-data
docker compose up --build --detach
```

The inspect step verifies the resolved target before deletion. This permanently removes the existing local PostgreSQL data. Images, source files, frontend dependencies, and unrelated Docker volumes are not deleted.

On the rebuilt stack:

1. PostgreSQL creates an empty `putnow` database.
2. Spring Boot starts with the `dev` profile.
3. Hibernate creates the entity-defined schema.
4. The development initializer adds `ADMIN` and `USER` roles.
5. Later restarts use `ddl-auto=update` and preserve local data.

## 11. Documentation Changes

The following references will be updated to remove Flyway instructions and describe the new local-only contract:

- backend README and environment examples;
- shared `DOCKER.md`, `compose.yaml`, and root `.env.example` where applicable;
- database runbook, replacing migration commands with entity-schema and reset guidance;
- earlier architecture documents that currently claim Flyway owns the schema, with an explicit supersession note rather than silently rewriting historical decisions.

## 12. Failure Handling

- Entity/schema mismatch in production: startup fails because `ddl-auto=validate` is used.
- Unsupported complex rename or deletion in development: Hibernate may leave old objects behind; the documented remedy is an explicit local volume reset after review, never an automatic drop.
- Missing required relationship: database foreign-key or not-null constraints reject the write.
- Duplicate normalized identity value: the unique constraint rejects the write and the application maps it to the existing conflict/error response.
- Bootstrap initializer failure: backend startup fails visibly instead of running with missing roles.

## 13. Verification and Acceptance

The change is accepted only when:

1. No Flyway dependency, runtime configuration, migration resource, or Flyway test remains.
2. Backend unit tests and PostgreSQL Testcontainers tests pass.
3. A clean PostgreSQL database is fully created from entities.
4. Required constraints, foreign keys, and ordinary indexes are verified against PostgreSQL metadata.
5. The development roles exist exactly once after multiple backend restarts.
6. `docker compose config --quiet` succeeds.
7. All four Docker services become healthy on the agreed ports.
8. Restarting the stack without deleting the volume preserves newly created local data.
9. Frontend lint, typecheck, unit tests, build, and applicable Playwright tests remain green.
10. Git diffs contain no credentials, commits, or unrelated destructive changes.

## 14. Known Trade-Off

`ddl-auto=update` is convenient for local development but is not a reliable migration engine. It may add columns or tables, but it does not safely model every rename, type conversion, column removal, partial index, or data backfill. The clean reset establishes a correct new baseline; future complex local schema changes may require another explicitly approved reset. Production schema evolution remains a separate decision and must not inherit this local strategy.
