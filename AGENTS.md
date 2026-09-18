# AGENTS.md

## Purpose

This file defines the working rules for AI coding agents in the `saas-japanese` repository. Follow the existing codebase and make the smallest complete change that satisfies the request.

## Scope

- These instructions apply to the repository root and all subdirectories.
- `fontend/AGENTS.md` contains additional Next.js-specific instructions. When working under `fontend/`, follow both files; the nearest `AGENTS.md` takes precedence if rules conflict.
- **Ignore `ai-service/` completely unless the user explicitly asks to work on it.**
  - Do not read, edit, format, test, build, review, or refactor files under `ai-service/`.
  - Do not include `ai-service/` failures in validation results.
  - Do not change the `ai-service/onsei` submodule or `.gitmodules`.
- `UI/` contains static design/reference prototypes. Treat it as reference material, not the production frontend, unless the task explicitly targets it.
- The production applications are `backend/` and `fontend/`. The spelling `fontend` is intentional and must not be renamed casually.

## Repository Map

- `backend/`: Java 17, Spring Boot, Gradle Kotlin DSL, Spring MVC, Spring Security, Spring Data JPA, MySQL, validation, Lombok, Checkstyle, SpotBugs.
- `fontend/`: Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS 4, shadcn/base-ui components, TanStack Query, Axios, React Hook Form, and Zod.
- `UI/`: HTML/CSS prototypes and business/entity documentation.
- `database_schema.md`: database design reference; compare it with current JPA entities before changing persistence behavior.
- `fe_design_guidline.md`: frontend visual rules and design tokens.
- `ai-service/`: out of scope by default.

## General Workflow

1. Read this file, then read any closer `AGENTS.md` that applies to the target path.
2. Inspect the relevant implementation, adjacent files, tests, and configuration before editing.
3. Reuse existing patterns and shared abstractions instead of creating parallel structures.
4. Keep changes focused. Do not perform unrelated cleanup, renames, dependency upgrades, or broad refactors.
5. Preserve the user's existing work and do not overwrite unrelated changes.
6. Run the narrowest useful checks first, followed by the broader checks relevant to the changed application.
7. Report changed files, validation performed, and any checks that could not run.

## Security and Secrets

- Never commit real passwords, tokens, API keys, private keys, or cloud credentials.
- Treat values in `application.properties`, local environment files, certificate folders, and frontend environment files as sensitive even if placeholders or development values already exist.
- New configuration must use environment variables or an ignored local configuration mechanism.
- Do not print secrets in logs, tests, examples, commits, or responses.
- Do not weaken authentication, authorization, validation, CORS, CSRF, or upload restrictions merely to make a feature work.
- The current security configuration may temporarily permit broad access; do not treat that as the desired authorization design. Preserve or improve endpoint-specific rules when a task touches security.

## Backend Rules

### Architecture

Follow the existing layered flow:

`controller -> service interface -> service implementation -> repository -> entity`

Use the existing supporting packages where appropriate:

- `domain/request`: validated input DTOs.
- `domain/response`: API output DTOs.
- `domain/query`: pagination, filtering, and sorting inputs.
- `service/mapper`: entity/DTO mapping.
- `specification`: dynamic JPA filters.
- `util/error`: domain exceptions and centralized error handling.
- `provider`: integrations with external services.

Controllers should handle HTTP concerns and delegate business logic. Business rules and transactions belong in services. Do not expose JPA entities directly from controllers when a response DTO exists.

### API Conventions

- All `@RestController` routes receive the `/api/v1` prefix from `WebConfiguration`. Do not duplicate that prefix in controller `@RequestMapping` values.
- Use Bean Validation on request DTOs and `@Valid` at controller boundaries.
- Preserve pagination/filter/sort behavior through query DTOs, Spring Data `Page`, and specifications.
- Validate client-provided sort fields against an allowlist; never pass arbitrary fields directly to JPA sorting.
- Use the existing exception types and global error response mechanism instead of ad-hoc `try/catch` blocks in controllers.
- Keep create/update/delete operations transactional; use read-only transactions for queries when appropriate.
- Respect soft-delete fields and repository methods such as `findBy...AndIsDeletedFalse`; do not silently convert soft deletion into physical deletion.
- When media ownership changes, preserve `Media.isUsed` consistency and handle replacement/removal safely.
- Avoid N+1 queries. If response mapping needs related counts or collections, prefer a repository query, projection, fetch strategy, or batch approach.

### Java Style

- Use Java 17-compatible code.
- Prefer constructor injection with `final` fields and the Lombok pattern already used in the surrounding package.
- Match nearby naming and formatting; do not introduce a new mapping or boilerplate library without approval.
- Compare boxed identifiers with `.equals()` or `Objects.equals()`, not `!=`.
- Remove unused imports and avoid commented-out implementations.
- Add tests for changed business rules and regression fixes when the test infrastructure supports them.

### Backend Commands

Run from `backend/`:

- Windows: `gradlew.bat bootRun`
- Unix-like systems: `./gradlew bootRun`
- Tests: `./gradlew test`
- Static checks: `./gradlew check`
- Build: `./gradlew build`

Use the Gradle wrapper; do not require a globally installed Gradle. Do not disable Checkstyle, SpotBugs, or tests to obtain a green build.

## Frontend Rules

### Structure and Responsibilities

- `app/`: routes, layouts, loading/error boundaries, and page composition.
- `features/`: feature-specific UI and orchestration.
- `components/ui/`: reusable primitives; preserve shadcn/base-ui conventions.
- `components/`: shared composed components and providers.
- `apis/`: HTTP endpoint functions and API-specific request/response types.
- `hooks/`: reusable hooks, including generic CRUD hooks.
- `services/`: cross-feature application services and configured clients.
- `types/`: shared TypeScript types.
- `utils/` and `lib/`: stateless utilities, constants, and infrastructure helpers.

Keep page files thin. Do not put raw Axios calls in pages or presentational components. Keep remote server state in TanStack Query; introduce Redux only for genuinely shared client state, not as a duplicate API cache.

### Data and Forms

- Use the configured authorized Axios instance for authenticated endpoints.
- Build API URLs from `NEXT_PUBLIC_API_URL` and the existing `API_VERSION` constant.
- Keep endpoint-specific request/response types beside the matching API module; move only broadly shared types to `types/`.
- Reuse generic CRUD hooks when their contract fits. A mutation needing an ID should accept one variables object such as `{ id, data }`, because TanStack Query mutation functions receive one variables argument.
- Use stable query keys and invalidate the exact affected queries after successful mutations.
- Use React Hook Form with Zod for non-trivial forms. Keep validation messages user-facing and consistent.
- For uploads, validate MIME type and size before sending, show preview/upload/error states, and clean up object URLs.
- Avoid unsafe casts, `any`, duplicated server state, and unnecessary `useEffect`.

### Components and Styling

- Add `'use client'` only when browser APIs, state, effects, event handlers, or client-only libraries require it.
- Prefer Server Components by default and keep client boundaries small.
- Reuse existing components before adding new ones. Keep domain-specific components inside their feature.
- Follow `fe_design_guidline.md` for colors, typography, spacing, cards, tables, badges, and responsive behavior.
- Maintain accessibility: semantic elements, labels, keyboard interaction, visible focus states, alt text, and appropriate ARIA attributes.
- Preserve responsive layouts and test at mobile and desktop widths.
- Do not edit the generated Next.js rules block in `fontend/AGENTS.md`.

### TypeScript and Imports

- TypeScript strict mode is enabled.
- Use the `@/*` alias for project imports.
- Follow existing ESLint rules: no unused imports, no debugger, strict equality, hooks rules, and `const` where possible.
- Remove temporary `console.log` statements before completion.
- Do not edit generated output such as `.next/`, `next-env.d.ts`, or `tsconfig.tsbuildinfo`.

### Package Manager and Frontend Commands

The repository currently contains both npm and pnpm lockfiles. Do not modify both in one task.

- Prefer the package manager implied by the user's command or the lockfile already changed on the working branch.
- If no preference is available, use pnpm and modify only `pnpm-lock.yaml`.
- Do not switch package managers or regenerate lockfiles unless dependency changes require it.

Run from `fontend/`:

- Development: `pnpm dev`
- Lint: `pnpm lint`
- Production build/type validation: `pnpm build`

For a small frontend change, run lint on the affected scope when possible, then run the full lint/build checks relevant to the change.

## Database and Integration Changes

- Check both current JPA entities/migrations and `database_schema.md`; runtime code is authoritative if documentation is stale.
- Avoid destructive schema changes. Explain migration and compatibility implications before altering columns, relationships, nullability, or deletion behavior.
- Keep API contracts synchronized between backend response/request DTOs and frontend API types.
- External integrations such as Brevo and Cloudinary must remain behind providers/services and configuration. Mock them in unit tests; do not call paid or production services during validation.

## Testing Expectations

- A backend behavior change should normally include or update a focused Spring/JUnit test.
- A frontend logic change should be covered by the repository's available test tooling; if no frontend test runner exists, validate with lint, TypeScript/Next build, and a concise manual test plan.
- For a cross-stack feature, verify the request path, HTTP method, payload, response shape, error behavior, loading state, and cache invalidation on both sides.
- Never claim a check passed unless it was actually run. If environment dependencies such as MySQL are unavailable, state that clearly.

## Change Boundaries

Ask before:

- changing public API contracts outside the requested feature;
- adding or upgrading major dependencies;
- renaming top-level directories, especially `fontend/`;
- changing authentication/token strategy;
- making destructive database changes;
- modifying CI/CD, deployment, submodules, or `ai-service/`.

Do not commit generated files, IDE state, local databases, build output, or secrets.
