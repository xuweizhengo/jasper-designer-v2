# Repository Guidelines

## Project Structure & Module Organization
- `src/` Solid.js + TypeScript UI. Key areas: `components/` (UI, e.g., `Canvas/`, `Panels/`), `stores/` (contexts), `utils/` (helpers), `types/` (shared TS types), `interaction/` (canvas interactions), `tests/` (dev-time integration scripts).
- `src-tauri/` Rust + Tauri backend. `src/commands/` (IPC), `src/core/` (business logic), `src/data/` (providers, storage), `tauri.conf.json` (app config).
- `scripts/` Packaging/build helpers; `builds/` and `dist/` are outputs; `docs/` for documentation.

## Build, Test, and Development Commands
- Frontend dev: `npm run dev` (Vite dev server), or desktop dev: `npm run tauri dev`.
- Build release: `npm run build` (type-check + Vite), desktop: `npm run tauri build`.
- Preview static build: `npm run preview`.
- Rust quality (run in `src-tauri/`): `cargo fmt` (format), `cargo clippy` (lint), `cargo test` (unit tests).
- Unified helper: `./build-manager.sh` or `scripts/package.sh` for guided packaging.

## Coding Style & Naming Conventions
- TypeScript/Solid: 2‑space indent, TypeScript strict types. Components use `PascalCase.tsx` (e.g., `ElementRenderer.tsx`); utilities `kebab-case.ts` (e.g., `text-style-manager.ts`). Context/providers may use `PascalCase.tsx`. CSS colocated with components when practical.
- Rust: follow `rustfmt` defaults; prefer small modules with focused traits/impls; use `Result<T, E>` over panics in command paths.
- Imports: prefer relative within feature folders; shared types from `src/types`.

## Testing Guidelines
- Rust: place unit tests inline with modules using `#[cfg(test)]`; run `cargo test` in `src-tauri/`.
- Frontend: `src/tests/` contains developer integration scripts (run during dev; logs to console). Keep tests deterministic and avoid network calls.
- Aim for meaningful coverage on core canvas, data, and command paths; prioritize regression tests for fixed bugs.

## Commit & Pull Request Guidelines
- Commits: concise, imperative summary; optional emoji and bilingual notes are fine. Example: `feat(canvas): add resize handles performance tweak`.
- PRs: include purpose, key changes, how to test (commands + steps), screenshots/GIFs for UI, and linked issues. Ensure `npm run build`, `cargo fmt`, and `cargo clippy` pass; note any known limitations.

## Security & Configuration Tips
- Tauri config lives in `src-tauri/tauri.conf.json`; avoid introducing network access by default. For Windows packaging and safe execution notes, see `scripts/` and generated notices.

## API Contracts & Naming (Must‑Follow)
- Transport (JSON) uses camelCase; Rust structs stay snake_case with `#[serde(rename_all = "camelCase", deny_unknown_fields)]` on all request/response DTOs.
- Every Tauri command accepts a single DTO (request object). Do not add multi‑scalar params.
- Responses also use DTOs with `rename_all = "camelCase"` so TS receives camelCase fields (e.g., `providerType`, `createdAt`, `lastUpdated`, `totalCount`).
- Do not add alias keys for compatibility. If schema changes, migrate callers and data files explicitly.

## Invocation Rule (No Bare `invoke`)
- Only the API layer may import `@tauri-apps/api/tauri`:
  - Allowed: files under `src/api/**`.
  - Forbidden: any other file. Use the exported functions from `src/api/**` instead.
- Lint enforces this with ESLint `no-restricted-imports` and per‑folder overrides.

## Change Checklist (PRs touching commands/DTOs)
- Update Rust DTOs with `serde` attributes and add/adjust unit tests for (de)serialization.
- Regenerate or update TS types (if using a generator later), and update `src/api/**` signatures.
- Run `npm run lint` and ensure no restricted imports; run `npm run build` and `cargo check`.
