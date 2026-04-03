# Yosync Studio Deep Codebase Report

Prepared on: April 3, 2026  
Repository: `yosynclyric-studio`  
Scope: Full frontend (`src`), backend (`convex`), config, quality signals, and product/engineering roadmap.

---

## 1. Executive Summary

Yosync Studio has strong product depth in synchronized-lyrics creation, moderation workflow design, and multi-source import/export capabilities. The application already covers a meaningful end-to-end use case:

1. Create/edit synced lyrics.
2. Import from external sources.
3. Preview in live and karaoke modes.
4. Export in several formats and video.
5. Publish to community flow with admin moderation.

The most important risks are **security authorization gaps**, **engineering quality debt (lint/test coverage)**, and **scaling/performance concerns in data queries and bundle size**.  
The next best move is a staged plan:

1. Security hardening first.
2. Reliability and quality baseline.
3. Performance and architecture refactor.
4. Product expansion features.

---

## 2. Assessment Method

This report is based on a direct codebase audit and runtime checks:

1. File structure and architecture inspection across `src` and `convex`.
2. Feature/path validation from routes and component-level code.
3. Auth/session/authorization analysis in Convex mutations/queries.
4. Data model and search/duplicate logic review.
5. Build/test/lint execution for delivery readiness.
6. Documentation-to-implementation consistency review.

---

## 3. Current Application Snapshot

### 3.1 Size and Shape

1. Total files scanned (`src` + `convex`): `119`
2. TS/TSX files: `111`
3. Approximate TS/TSX lines: `14,800`
4. Largest files:
   - `src/pages/Admin.tsx` (~1,165 lines)
   - `src/components/LyricsEditor/PublishDialog.tsx` (~628 lines)
   - `convex/lyrics.ts` (~578 lines)
   - `src/pages/Profile.tsx` (~491 lines)
   - `src/components/LyricsEditor/MetadataEditorDialog.tsx` (~481 lines)

### 3.2 Runtime Health Signals

1. Tests: pass, but only one trivial placeholder test.
2. Build: passes.
3. Lint: fails with high issue count.
4. Bundle warning: large main chunk (`~858 KB` pre-gzip, `~259 KB` gzip).

Interpretation:

1. Product functionality exists and compiles.
2. Quality gates are not strict enough to prevent regressions.
3. Code quality debt is significant and measurable.

---

## 4. Architecture Overview

### 4.1 Frontend

Stack:

1. React 18 + TypeScript + Vite.
2. Router: `react-router-dom`.
3. Data/client calls: Convex React hooks.
4. UI primitives: shadcn/ui + Radix + Tailwind.

Route structure:

1. Landing: `/`
2. Auth: `/login`, `/register`
3. Workspace: `/dashboard`, `/editor/:projectId`
4. User area: `/profile`, `/settings`
5. Admin area: `/admin`
6. About/info: `/about`
7. 404 fallback

### 4.2 Backend (Convex)

Tables:

1. `users`
2. `sessions`
3. `lyrics`
4. `notifications`

HTTP endpoints:

1. `GET /get` for specific song match.
2. `GET /search` for text search.
3. CORS and preflight support included.

Cron:

1. Daily cleanup of old notifications.

### 4.3 Storage Model

1. Project drafts and backups are browser `localStorage` based.
2. Community lyrics are in Convex.
3. Audio file itself is object URL based in session and not persisted as file.

---

## 5. Implemented Feature Inventory

## 5.1 Core Editing & Sync

1. Line-level synchronization.
2. Word-level synchronization.
3. Waveform display and seeking.
4. Keyboard shortcuts for sync and navigation.
5. Undo/redo history.
6. Line operations (add/delete/duplicate/reorder/split words).

## 5.2 Import and Search

1. Bulk text import.
2. LRC import + metadata extraction.
3. Universal lyrics search (Yosync + LRCLIB).
4. YouTube Music search and source linking.

## 5.3 Export and Output

1. Text export: LRC, SRT, VTT, TXT.
2. Video export via canvas + MediaRecorder.
3. Metadata embedding workflow (gated by feature flag).

## 5.4 Community Workflow

1. Publish flow to Yosync database.
2. Duplicate detection and improvement submission path.
3. Moderation panel for approve/reject/edit/delete/restore.
4. Notifications for moderation outcomes.

## 5.5 Account & Roles

1. Guest mode with generated identity.
2. User registration/login/session token.
3. Role model (`guest`, `user`, `admin`).
4. Protected route behavior.

---

## 6. SWOT Analysis

## 6.1 Strengths

1. End-to-end lyric production workflow is already mature.
2. Strong UX ambition in editor + karaoke + moderation views.
3. Convex model supports moderation and revision lifecycle.
4. Cross-source ingestion strategy (internal + LRCLIB + YT) is product-strong.
5. Public API support creates ecosystem potential.

## 6.2 Weaknesses

1. Security authorization checks are inconsistent in critical mutations.
2. High lint debt with many explicit `any` usages and hook dependency issues.
3. Test coverage is effectively absent for core business logic.
4. Oversized UI files make maintenance and onboarding harder.
5. Local-only project persistence limits reliability and multi-device continuity.
6. Documentation claims do not fully match implementation in some areas.

## 6.3 Opportunities

1. Become a leader in lyric authoring quality with AI-assisted sync.
2. Add true collaboration and review comments for teams.
3. Build contributor reputation and trust-scoring for moderation at scale.
4. Expand public API usage via partner/developer programs.
5. Convert from local drafts to cloud project workspaces.

## 6.4 Threats

1. Security incident risk from authz gaps.
2. Trust/brand damage if users find doc-feature mismatch.
3. Scale and latency issues from full scans and large bundle delivery.
4. Rising maintenance cost from monolithic components.
5. External dependency fragility (third-party music/search endpoints).

---

## 7. Security Deep Dive

### 7.1 Critical Findings

### Finding A: User mutations trust client-provided `userId`

Affected patterns:

1. `updateProfile`
2. `updatePassword`
3. `upgradeToAccount`

Risk:

1. Without binding action to authenticated session identity, a malicious client can attempt unauthorized updates by passing another user id.

Expected fix:

1. Require session token in args.
2. Validate token server-side.
3. Enforce `session.userId === args.userId` (or admin override rules).

### Finding B: Notification mutations do not verify ownership

Affected:

1. `markRead`
2. `markAllRead`

Risk:

1. User could mark notifications for another user if IDs are discovered.

Expected fix:

1. Require auth token.
2. Resolve authenticated user id.
3. Check notification ownership before patching.

### Finding C: Publish identity may be spoofed

Affected:

1. Publish flow accepts `submittedBy` / `submittedById` from client.

Risk:

1. User attribution may be forged.

Expected fix:

1. Derive submitter identity from validated session or securely managed guest identity created server-side.
2. Ignore client-attributed identity fields where possible.

### Finding D: Sensitive local env handling risk

Observed:

1. `.env.local` contains admin/password-style values.

Risk:

1. Accidental leak or operational misuse.

Expected fix:

1. Rotate sensitive values.
2. Keep secrets out committed/shared files.
3. Move admin bootstrap strategy away from static password checks.

### Finding E: Token in localStorage

Risk:

1. If XSS occurs, long-lived token exfiltration risk is high.

Mitigation options:

1. Harden XSS surface + CSP + strict sanitization.
2. Consider secure cookie strategy if platform allows.
3. Reduce token lifetime and add renewal/rotation controls.

---

## 8. Data and Scalability Analysis

### 8.1 Query Characteristics

Observed in search and duplicate paths:

1. Full collection scans (`query("lyrics").collect()`) for ranking and duplicate detection.
2. Client-side scoring after full fetch in query handlers.

Risk:

1. Works for small/medium datasets.
2. Degrades as library grows.

Recommendation:

1. Introduce normalized lookup fields and indexed query-first narrowing.
2. Keep fuzzy ranking but on pre-filtered candidate sets.
3. Consider materialized normalized key columns for exact/similar match shortcuts.

### 8.2 Moderation and Versioning

Strength:

1. Improvement model with parent-child linkage is conceptually strong.

Gap:

1. Could benefit from explicit revision table semantics and immutable version lineage metadata.

Recommendation:

1. Add formal revision metadata (`revisionNumber`, `diffSummary`, `mergedBy`, `mergedAt`).

---

## 9. Frontend Engineering Quality

### 9.1 Code Organization

Current state:

1. Multiple very large UI files with mixed concerns (view + business logic + networking + transformation logic).

Impact:

1. Harder to test.
2. Harder to safely change.
3. Higher merge conflict rates.

Recommendation:

1. Split into:
   - Feature container hooks (`useAdminModeration`, `usePublishFlow`).
   - Presentation components.
   - Domain utility modules.

### 9.2 Type Safety and Linting

Observed:

1. Extensive explicit `any`.
2. Hook dependency warnings.
3. ESLint currently failing by default.

Recommendation:

1. Create incremental lint baseline strategy.
2. Block new `any` in changed files.
3. Move toward strict type contracts in Convex response mapping.

### 9.3 Testability

Observed:

1. Only placeholder test exists.

Recommendation:

1. Add prioritized tests:
   - `parseLRC` correctness.
   - export formatting.
   - duplicate scoring logic.
   - auth guard behavior.
   - publish flow state machine.

---

## 10. Product and UX Assessment

### 10.1 What Already Feels Strong

1. Editor flow is functional and rich.
2. Live preview and karaoke mode improve perceived quality.
3. Multi-source import and discovery is practical.
4. Moderation workflow already reflects real product thinking.

### 10.2 UX Risks / Inconsistencies

1. Metadata editor currently disabled while presented as major feature.
2. Some pages contain malformed text artifacts and encoding artifacts.
3. Feature claims and implementation mismatch may reduce user trust.

### 10.3 Immediate UX Wins

1. Auto timing suggestions for unsynced lines.
2. Timeline zoom and snap modes.
3. Better conflict-safe restore and backup management UI.
4. “What changed” panel on publish for contributor confidence.

---

## 11. Documentation Accuracy Gaps

Items to align:

1. “Encrypted local storage” should be corrected or implemented.
2. “Real-time collaboration” should be corrected or implemented.
3. FFmpeg mention should be corrected or actual FFmpeg pipeline added.
4. Metadata editor status should reflect feature flag reality.

Recommendation:

1. Treat docs consistency as a release gate.

---

## 12. Prioritized Action Plan

### Phase 0: Security Hotfix (Immediate, 2-5 days)

1. Enforce session validation in all profile/password/account upgrade mutations.
2. Enforce ownership checks in notification mutations.
3. Bind submission identity server-side.
4. Rotate/remove sensitive credentials and revise admin bootstrap strategy.

Success criteria:

1. No mutation relies on client-supplied identity without verification.
2. Unauthorized mutation attempts are rejected with clear error paths.

### Phase 1: Reliability Baseline (1-2 weeks)

1. Bring lint to passing in critical modules first.
2. Add minimum meaningful tests for core utils and auth/publish flows.
3. Add CI checks: lint + test + build.
4. Fix hook dependency issues and avoid silent behavior drifts.

Success criteria:

1. CI blocks regressions.
2. Core business logic has test coverage.

### Phase 2: Performance and Scale (2-4 weeks)

1. Query optimization to reduce full-table scans.
2. Frontend code-splitting for heavy modules/dialogs.
3. Optimize bundle and lazy-load heavy parsing/rendering dependencies.

Success criteria:

1. Reduced initial bundle pressure.
2. Query latency stable as lyric dataset grows.

### Phase 3: Product Expansion (4-8+ weeks)

1. Collaboration MVP (shared projects + comments).
2. AI timing assistant and sync-quality diagnostics.
3. Contributor trust scoring + moderation acceleration tools.
4. Cloud project persistence.

Success criteria:

1. Higher user retention and contribution quality.
2. Faster moderation throughput.

---

## 13. Feature Expansion Backlog (Detailed)

### 13.1 High Impact Features

1. AI-Assisted Sync:
   - Auto-place rough timings.
   - Confidence heatmap for suspect lines.
   - One-click normalize timing spacing.

2. Collaboration Layer:
   - Project share links.
   - Comment threads on lines.
   - Reviewer assignment and status.

3. Moderation Intelligence:
   - Duplicate confidence scoring in admin queue.
   - Auto-flag suspicious submissions.
   - Side-by-side metadata merge recommendation.

4. Search Quality:
   - Alias mapping for artists.
   - Typo tolerance and phonetic matching.
   - Weighted ranking based on usage and quality history.

5. Cross-device Project Sync:
   - Optional cloud save.
   - Conflict-aware merge/resolution.
   - Offline-first fallback cache.

### 13.2 Nice-to-Have Product Polish

1. “Review before publish” checklist wizard.
2. Accessibility pass for keyboard and screen-reader workflows.
3. Export presets for common platforms (YouTube, Instagram, shorts).
4. Theming presets for karaoke style branding.

---

## 14. Risk Register

### High Risk

1. Unauthorized account/profile changes if authz not hardened.
2. Identity spoofing in submission flow.
3. Sensitive env values mishandling.

### Medium Risk

1. Scalability slowdown from full scans.
2. Regression risk from low test coverage.
3. UX trust risk from docs mismatch.

### Low Risk

1. Cosmetic encoding/artifact issues.
2. Internal consistency issues in minor config/documentation.

---

## 15. Recommended Governance Changes

1. Security review checklist required for every mutation that writes user data.
2. “Docs parity check” before each release.
3. Definition of done for features includes:
   - tests,
   - type-safe contracts,
   - telemetry/observability,
   - migration notes if schema changes.
4. Limit maximum file size targets for maintainability.

---

## 16. Final Conclusion

Yosync Studio already has a compelling and differentiated product core.  
The platform can become highly competitive with focused execution on three fronts:

1. **Security correctness first**.
2. **Engineering quality discipline second**.
3. **Product acceleration third**.

If these are addressed in order, the application can scale from a strong prototype/product to a robust production-grade lyric authoring and moderation platform.

---

## 17. Remediation Update (Completed Work)

Update date: April 3, 2026

This section records what has already been implemented after the original audit.

### 17.1 Security Fixes Completed

1. Added session-token validation helper in Convex auth.
2. Secured user-sensitive mutations by enforcing token-bound identity checks:
   - `updateProfile`
   - `updatePassword`
   - `upgradeToAccount`
3. Added secure guest session bootstrap (`ensureGuestSession`) so guest operations can be authorized safely.
4. Secured notification read mutations with token and ownership validation:
   - `markRead`
   - `markAllRead`
5. Secured notification query path by binding fetch to session token:
   - `getUserNotifications`
6. Updated frontend callers (Profile + NotificationBell) to pass auth token for protected operations.

### 17.2 Reputation and Documentation Fixes Completed

1. Updated README to remove/clarify mismatches:
   - Replaced “Real-time collaboration” phrasing with local autosave/backup behavior.
   - Replaced FFmpeg phrasing with MediaRecorder-based export wording.
   - Clarified metadata editor as feature-flagged.
2. Updated About page technology card from `FFmpeg.js` to `MediaRecorder`.

### 17.3 Scale/Performance Improvements Completed

1. Improved `searchByText` query strategy:
   - Uses search index first.
   - Falls back only when indexed results are sparse.
2. Added route-level lazy loading with `React.lazy` + `Suspense` to reduce initial JS payload.
3. Build verification confirmed chunk splitting and reduced main entry burden compared to prior monolithic loading.

### 17.4 UX/Access Control Hardening Completed

1. Dashboard now hides the Admin button for non-admin users.

### 17.5 Tooling/Config Hardening Completed

1. `tsconfig.app.json` improvements:
   - Enabled `"strict": true`
   - Enabled `"forceConsistentCasingInFileNames": true`
   - Removed deprecated `baseUrl`
2. Build validation completed successfully after config updates.

---

## 18. Execution Checklist

### 18.1 Security Checklist

- [x] Enforce session-token validation in account/profile mutations.
- [x] Enforce ownership check (`session.userId === target userId`) or admin override for sensitive profile/password/account actions.
- [x] Require token for notification mutations.
- [x] Verify notification ownership before patching read state.
- [x] Bind notification fetch to authenticated session identity.
- [x] Regenerate Convex bindings after API signature changes.
- [ ] Fully bind lyric publish submitter identity to server-validated session only (remove all spoofable client identity inputs).
- [ ] Rotate/remove sensitive local secrets and enforce secret management policy.

### 18.2 Reputation/Documentation Checklist

- [x] Update README claims to match implemented behavior.
- [x] Add feature-flag transparency for metadata editor.
- [x] Align About page stack labels with actual implementation.
- [ ] Add release checklist item: “Docs parity check” before every version tag.

### 18.3 Scale/Performance Checklist

- [x] Move lyric text search to index-first strategy.
- [x] Introduce route-level code splitting.
- [x] Optimize duplicate candidate detection to avoid broad full-table scans.
- [ ] Add query latency telemetry for search and duplicate detection.
- [ ] Add performance budgets for JS bundles in CI.

### 18.4 Engineering Quality Checklist

- [x] Validate build after each hardening change.
- [ ] Resolve outstanding lint error backlog (`any` usage + hook dependency issues).
- [ ] Add meaningful tests for auth, publish flow, and duplicate scoring.
- [x] Add CI gate requiring lint + test + build pass.

### 18.5 Product/UX Checklist

- [x] Hide admin-only dashboard actions for non-admin users.
- [ ] Add user-facing permission guards for all admin entry points and menu surfaces.
- [ ] Add publish-flow contributor identity transparency (“Signed in as …” + verified source).

---

## 19. Next Recommended Sprint (Practical Scope)

For the next sprint, prioritize these exact items:

1. Remove identity spoof possibility in publish mutation entirely.
2. Refactor duplicate detection query path to index-narrowed candidates only.
3. Clean lint baseline in auth + lyrics + dashboard/profile modules.
4. Add minimum critical tests:
   - auth ownership guard tests
   - notification ownership tests
   - search ranking/duplicate candidate tests
