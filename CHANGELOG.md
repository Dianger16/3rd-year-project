<!-- Copyright (c) 2026 XynaxDev | Contact: akashkumar.cs27@gmail.com -->

# Changelog

All notable changes to UnivGPT are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Planned / In Progress
- Continue reducing dashboard latency and repeated background refetches.
- Continue tightening role isolation across chat, notifications, and admin controls.
- Continue polishing responsive layout behavior for sidebar, profile, and table-heavy pages.

## [0.11.0] - 2026-04-04

### Added
- Reusable skeleton loading system applied across dashboards, courses, faculty, users, notifications, uploads, and audit tables.
- Better recipient preview in admin broadcast workflow with richer per-user context.
- Root-level changelog for project-level release tracking.

### Changed
- Profile and settings layouts were rebalanced for cleaner information hierarchy.
- Dropdown, filter, and tooltip interactions were standardized for consistency.
- Runtime configuration defaults and environment handling were cleaned up.

### Fixed
- Chat/session isolation issues between student, faculty, and admin contexts.
- Avatar/name propagation mismatches across directories and list views.
- Dean appeals review page state flow and refresh behavior.

### Performance
- Added stale-while-revalidate style client caching to cut repeated fetch cost.
- Improved sync-state behavior on paginated tables during refresh/navigation.

## [0.10.0] - 2026-04-03

### Added
- Moderation appeal review flow with admin/dean actions.
- Admin user activity report broadcast pipeline with recipient preview.
- Role-scoped document notification preview support.

### Changed
- Assistant pipeline was modularized into cleaner intent/moderation/snapshot services.
- Admin and dashboard UX received major polish (cards, tables, controls, interaction cues).
- Upload console and operational admin pages were redesigned for better usability.

### Fixed
- Cross-role data exposure risks in admin-only pages and actions.
- Conversation ownership boundaries (user + role scoping).
- Auth edge cases (forgot-password/provider mismatch handling).

### Performance
- Backend pagination guardrails and audit pruning improved stability at scale.
- Frontend defaults tuned for faster initial render on data-heavy screens.

## [0.9.0] - 2026-04-02

### Added
- Dedicated faculty directory/profile experience with mapped course context.
- Pagination across users, notifications, uploads, and dean appeals queues.
- Shared Radix-based filter/select controls in major dashboard flows.

### Changed
- Product naming standardized to **UnivGPT** across prompts and UI.
- Profile/settings upgraded with role-specific field presentation.
- Seed/demo workflow improved for realistic local role testing.

### Fixed
- Sidebar/mobile navigation stability and active-state jitter.
- Topbar notification view-all and related navigation behavior.
- Session persistence and logout reliability issues.

## [0.8.0] - 2026-03-06

### Added
- OTP signup verification, resend flow, and stronger auth lifecycle controls.
- Role-aware assistant routing for faculty/course/document queries.
- Moderation flow with warnings, escalation, block state, and appeal submission.
- End-to-end ingestion pipeline (extract -> chunk -> embed -> vector index).

### Changed
- Shifted toward model-driven moderation and intent routing with safer fallbacks.
- Improved auth/profile sync and role-safe API boundaries.

### Fixed
- Timeout/fallback behavior for provider instability.
- Early auth/profile consistency issues across backend and frontend.

## [0.1.0] - 2026-03-01

### Added
- Initial UnivGPT codebase bootstrap.
- Base backend/frontend structure, docs scaffold, and local setup flow.

