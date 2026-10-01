# PutNow Hibernate-Managed Local Schema Implementation Plan

**Date:** 2026-10-01  
**Design:** `../specs/2026-10-01-putnow-hibernate-local-schema-design.md`  
**Status:** Implemented and verified locally  
**Repositories:** `Booking_System`, `frontend`, and their shared local Docker parent

## Objective

Remove Flyway from PutNow, make the JPA/Hibernate model capable of creating a complete clean PostgreSQL schema for local development, retain important database integrity guarantees in code mappings, seed required roles without SQL, and reset only the approved local PostgreSQL volume once.

All work remains uncommitted and unpushed for user review.

## Safety Rules

- Do not delete the database volume until code-level schema tests pass.
- Before deletion, resolve and inspect the exact Docker volume `putnow-postgres-data`.
- Do not use `docker compose down --volumes`, broad Docker prune commands, recursive deletion, or wildcard volume deletion.
- Never use `ddl-auto=update`, `create`, or `create-drop` in the production profile.
- Preserve unrelated changes in both dirty working trees.
- Do not print `.env` secrets or include them in diffs.

## Task 1: Lock the Schema Contract with Failing PostgreSQL Tests

**Rename/replace:**

- `Booking_System/src/test/java/com/huynhliem/support/FlywayMigrationIntegrationTest.java`
- with `Booking_System/src/test/java/com/huynhliem/support/HibernateSchemaIntegrationTest.java`

**Modify:**

- `Booking_System/src/test/java/com/huynhliem/support/PostgresIntegrationTest.java`

**Steps:**

1. Change the Testcontainers base properties from Flyway plus `validate` to Hibernate `create-drop`, disable SQL initialization, and activate a test-safe profile.
2. Replace the migration-history assertions with PostgreSQL metadata assertions for:
   - all application tables;
   - timestamp-with-time-zone fields;
   - unique username, email, role, voucher, ticket-type-per-concert, token-hash, and booking-idempotency constraints;
   - user/token and core booking foreign keys;
   - quantity, price, discount, usage, and status check constraints;
   - the ordinary indexes used by current repositories.
3. Add an integration test that persists a minimal role, user, concert, ticket type, booking, refresh token, and password-reset token graph.
4. Add representative constraint tests for duplicate normalized identity data and invalid quantities/amounts.
5. Run the new integration test and confirm it fails against the current incomplete entity mappings before implementing them.

**Focused check:**

```powershell
mvn.cmd -q -Dtest=HibernateSchemaIntegrationTest test
```

## Task 2: Make Entity Mappings Define the Complete Schema

**Modify:**

- `Booking_System/src/main/java/com/huynhliem/model/User.java`
- `Booking_System/src/main/java/com/huynhliem/model/Role.java`
- `Booking_System/src/main/java/com/huynhliem/model/Concert.java`
- `Booking_System/src/main/java/com/huynhliem/model/TicketType.java`
- `Booking_System/src/main/java/com/huynhliem/model/Booking.java`
- `Booking_System/src/main/java/com/huynhliem/model/BookingItem.java`
- `Booking_System/src/main/java/com/huynhliem/model/Voucher.java`
- `Booking_System/src/main/java/com/huynhliem/model/Token.java`
- `Booking_System/src/main/java/com/huynhliem/model/PasswordResetToken.java`

**Steps:**

1. Make required user identity, password, role, timestamps, and relationship columns non-null; give text columns explicit bounded lengths where appropriate.
2. Add named unique constraints for canonical username, canonical email, role name, voucher code, ticket type within a concert, token hashes, and booking idempotency within a user.
3. Add named JPA indexes matching current lookup and worker query paths.
4. Use `numeric(19,0)` consistently for VND monetary fields.
5. Add Hibernate `@Check` constraints for:
   - allowed enum values;
   - non-negative prices and discounts;
   - positive booking-item quantity;
   - non-negative ticket quantities and `remaining_quantity <= total_quantity`;
   - non-negative voucher limits and `used_count <= max_uses`;
   - booking discount not exceeding total amount.
6. Keep optimistic locking on ticket types, vouchers, and bookings.
7. Replace token scalar `userId` mappings with required lazy `User` relationships.
8. Replace refresh-token `rotatedFromId` and `replacedById` scalar links with nullable lazy self-relations, using explicit foreign-key names and no destructive cascading between tokens.
9. Update convenience accessors only where required to avoid leaking persistence objects into API DTOs.
10. Re-run `HibernateSchemaIntegrationTest` and iterate until PostgreSQL creates and enforces the expected schema.

## Task 3: Canonicalize Values Before Persistence

**Modify:**

- `Booking_System/src/main/java/com/huynhliem/service/impl/UserServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/UserDetailService.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/AuthenticationServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/RoleServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/VoucherServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/ConcertServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/BookingServiceImpl.java`
- relevant repositories under `Booking_System/src/main/java/com/huynhliem/repository`

**Create if a shared utility avoids inconsistent rules:**

- `Booking_System/src/main/java/com/huynhliem/shared/persistence/CanonicalValues.java`

**Tests to modify/create:**

- service unit tests for user registration/login, voucher creation/use, and concert ticket creation;
- repository integration assertions inside `HibernateSchemaIntegrationTest`.

**Steps:**

1. Write or update unit tests proving that email is trimmed/lowercased; role and voucher code are trimmed/upcased; username and ticket-type names follow one documented canonical rule.
2. Centralize canonicalization in a small dependency-free utility if more than one service needs the same transformation.
3. Apply canonicalization before duplicate lookup and before persistence.
4. Change repository lookups to query stored canonical values directly where possible, while keeping case-insensitive free-text search behavior.
5. Ensure login, password recovery, authorization, voucher lookup, and booking paths canonicalize their inputs consistently.
6. Catch database uniqueness races through the existing conflict/error mapping rather than relying only on pre-save existence checks.
7. Run focused service and schema tests.

## Task 4: Refactor Token Services to Entity Relationships

**Modify:**

- `Booking_System/src/main/java/com/huynhliem/repository/TokenRepository.java`
- `Booking_System/src/main/java/com/huynhliem/repository/PasswordResetTokenRepository.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/AuthenticationServiceImpl.java`
- `Booking_System/src/main/java/com/huynhliem/service/impl/TokenServiceImpl.java`
- `Booking_System/src/test/java/com/huynhliem/service/impl/AuthenticationServiceImplTest.java`
- other token tests affected by the internal model change

**Steps:**

1. Update derived repository methods and JPQL from `userId` scalar properties to relationship IDs such as `user.id`.
2. Build refresh and password-reset tokens with the loaded `User` entity.
3. Resolve refresh users from `storedToken.getUser()` instead of issuing a second unprotected scalar-ID lookup.
4. Link rotated and replacement refresh tokens through entity references inside the existing transaction.
5. Preserve token family revocation, row locking, reuse detection, expiration, logout idempotency, and password-reset single-use behavior.
6. Update mocks and assertions without changing HTTP response contracts.
7. Run authentication, token, and security regression tests.

## Task 5: Add Development Role Bootstrap

**Create:**

- `Booking_System/src/main/java/com/huynhliem/config/DevelopmentDataInitializer.java`
- `Booking_System/src/test/java/com/huynhliem/config/DevelopmentDataInitializerTest.java`

**Modify:**

- `Booking_System/src/main/java/com/huynhliem/repository/RoleRepository.java` if an idempotent lookup helper is needed

**Steps:**

1. Write a test proving two invocations result in exactly one `ADMIN` and one `USER` role.
2. Implement an `ApplicationRunner` or `CommandLineRunner` restricted by `@Profile("dev")`.
3. Canonicalize role names and insert only missing rows.
4. Keep the initialization transactional and fail startup visibly on persistence failure.
5. Verify that no password, user, concert, voucher, or booking is seeded.

## Task 6: Remove Flyway and Split Schema Configuration by Profile

**Modify:**

- `Booking_System/pom.xml`
- `Booking_System/src/main/resources/application.yaml`
- `Booking_System/src/test/resources/application.yaml`
- `compose.yaml`
- `.env.example` if it still exposes migration variables

**Create:**

- `Booking_System/src/main/resources/application-dev.yaml`
- `Booking_System/src/main/resources/application-prod.yaml`

**Delete:**

- `Booking_System/src/main/resources/db/migration/V1__baseline.sql`
- `Booking_System/src/main/resources/db/migration/V2__add_token_security.sql`
- `Booking_System/src/main/resources/db/migration/V3__harden_booking_idempotency.sql`
- `Booking_System/src/main/resources/db/migration/V4__add_constraints_and_indexes.sql`
- `Booking_System/src/main/resources/db/migration/V5__migrate_existing_timestamps_and_statuses.sql`
- `Booking_System/src/main/resources/db/dev/R__seed_development_data.sql`

**Steps:**

1. Remove `spring-boot-starter-flyway` and `flyway-database-postgresql` dependencies.
2. Remove all `spring.flyway` settings and migration-location environment variables.
3. Keep the common configuration at `ddl-auto=validate`.
4. Set only the `dev` profile to `ddl-auto=update`.
5. Set the explicit `prod` profile to `ddl-auto=validate` as defense in depth.
6. Keep H2 and PostgreSQL integration test contexts on `create-drop`.
7. Set `SPRING_PROFILES_ACTIVE=dev` explicitly in local Compose.
8. Delete the empty migration directories after their tracked files are removed.
9. Scan the effective dependency tree and runtime configuration to confirm no Flyway classes or settings remain.

**Checks:**

```powershell
mvn.cmd -q dependency:tree
rg -n "flyway|DEV_MIGRATION|FLYWAY_" Booking_System compose.yaml .env.example DOCKER.md
```

## Task 7: Run Backend Gates Before Deleting Data

**Commands:**

```powershell
mvn.cmd test
mvn.cmd package -DskipTests
git diff --check
```

**Steps:**

1. Require zero backend test failures and errors.
2. Confirm the PostgreSQL Testcontainers schema test ran rather than being skipped when Docker is available.
3. Inspect the generated PostgreSQL metadata assertions for all required constraints and relationships.
4. Confirm packaging succeeds without Flyway on the classpath.
5. Review the backend diff for accidental API changes, credentials, or unrelated file rewrites.
6. Stop and fix any failure before proceeding to the destructive volume reset.

## Task 8: Update Documentation and Historical Decisions

**Modify:**

- `Booking_System/README.md`
- `Booking_System/docs/database-migrations.md` (rename or rewrite as local schema guidance if appropriate)
- `DOCKER.md`
- `frontend/docs/superpowers/specs/2026-10-01-putnow-modular-refactor-design.md`
- `frontend/docs/superpowers/specs/2026-10-01-putnow-docker-local-design.md`
- corresponding earlier implementation plans where they claim Flyway is the active owner

**Steps:**

1. Document that entities are the schema source only for local/dev.
2. Document `update` limitations and the explicitly approved reset workflow.
3. State that production uses validation and requires a future separately approved provisioning strategy.
4. Replace active Flyway commands and environment variables.
5. Add concise supersession notes to historical documents so past decisions remain understandable.
6. Keep the destructive reset command out of normal start/stop instructions and mark it irreversible.

## Task 9: Perform the Approved One-Time Volume Reset

**Precondition:** Tasks 1–8 pass review-level checks and the schema integration test is green.

**Commands:**

```powershell
docker compose down
docker volume inspect putnow-postgres-data
docker volume rm putnow-postgres-data
docker compose up --build --detach
docker compose ps
```

**Steps:**

1. Record the current Compose service state without printing environment secrets.
2. Stop the `putnow` stack normally.
3. Inspect `putnow-postgres-data` and verify its exact name and Compose ownership label.
4. Delete only that named volume.
5. Rebuild and start the four-service stack.
6. Wait for PostgreSQL, Mailpit, backend, and frontend health checks.
7. Inspect a bounded backend log tail for Hibernate DDL errors, without exposing secrets.
8. Verify `ADMIN` and `USER` exist once each.
9. Report explicitly that the prior local PostgreSQL data was permanently removed.

## Task 10: Verify Persistence, APIs, and Full Regression

**Backend and Docker checks:**

1. Call backend Actuator health and the public concert endpoint.
2. Create a disposable local record through a safe application path or repository-backed smoke test.
3. Restart the stack without deleting the volume.
4. Confirm the disposable record and both roles remain, proving `ddl-auto=update` preserves data.
5. Confirm no `flyway_schema_history` table exists.
6. Confirm browser credentialed CORS and cookie authentication still work from `http://localhost:5000`.

**Frontend commands:**

```powershell
corepack.cmd pnpm lint
corepack.cmd pnpm typecheck
corepack.cmd pnpm test
corepack.cmd pnpm build
corepack.cmd pnpm exec playwright test
```

**Final repository checks:**

```powershell
git -C Booking_System diff --check
git -C frontend diff --check
git -C Booking_System status --short
git -C frontend status --short
```

**Steps:**

1. Require all applicable frontend and backend checks to pass.
2. Distinguish an intentional E2E skip from a failure.
3. Scan tracked and untracked source/config files for usable credentials.
4. Confirm root `.env` remains ignored and is not printed.
5. Leave all changes uncommitted and unpushed.

## Completion Criteria

- Flyway dependencies, configuration, migrations, seed SQL, and migration tests are absent.
- Hibernate creates a clean PostgreSQL schema solely from the entity model in tests and local development.
- Important unique constraints, foreign keys, checks, indexes, and optimistic locks are verified.
- Development uses `ddl-auto=update`; production uses `ddl-auto=validate`.
- `ADMIN` and `USER` roles are initialized idempotently only in development.
- Only `putnow-postgres-data` was deleted, once, after successful pre-reset gates.
- All four Docker services are healthy on frontend `5000`, backend `8080`, PostgreSQL `6000`, Mailpit SMTP `1025`, and Mailpit UI `8025`.
- Data created after the reset survives a normal restart.
- Backend and frontend regression gates pass.
- No credential, commit, push, or unrelated destructive change is introduced.
