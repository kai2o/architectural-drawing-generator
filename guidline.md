Project title: ArchAID — AI-Powered Home & Corporate Space Designer + Marketplace
Core: 2D/3D layout generator • CAD/STEP/SolidWorks exports • AI optimizer • Multi-persona marketplace

Important: Planner5D inspiration (key UI/UX features to emulate)

Use the following Planner5D UI and feature set as the primary UX inspiration:

Fast floor-plan creation and AI floor-plan recognition. 
Planner 5D

Extensive furniture & decor library (thousands of items) for drag-and-drop furnishing. 
Planner 5D

High-quality visualizations and 4K renders + 360° walkthrough mode. 
Planner 5D

Cross-platform availability (web, mobile, desktop) and AR/preview where possible. 
Planner 5D

Use these features as a UX baseline; add marketplace + monetization + CAD/STEP export + multi-floor/corporate specificity on top.

0 — Global instruction to Cursor (summary)

Build the full-stack ArchAID platform and make the Angular frontend match Planner5D’s intuitive canvas-first UX with the following additions: full-house & multi-floor management, corporate partition/cabin tools, user-defined exceptions (mandir, server room), an AI optimizer microservice, a marketplace for architects/vendors with monetization, and a robust CAD/STEP export pipeline. Prioritize .NET Core 8 backend.

1 — Planner5D-inspired Frontend UX (exact requirements for Cursor)

Implement an Angular UI that includes these Planner5D-style modules and behaviors:

Canvas-first design workspace

Central resizable canvas with 2D floorplan editing and instant toggle to 3D view (Three.js).

Snap-to-grid, rulers, measurement guides, and live measurement readouts.

Undo/redo stack, multicursor selection, group/ungroup, align & distribute actions.

Multi-floor manager: a persistent floor selector showing thumbnails for each floor; changes sync across floors.

Left toolbar (toolset) — emulate Planner5D flow:

Draw tools: wall, door, window, column, beam, staircase, floor cutouts.

Room tool: auto-fill a bounded polygon and set room type (bedroom, kitchen, server room, mandir, etc.).

Partition/cabin generator for corporate layouts (snap to grid, modular widths).

Measurement tool + dimension annotation.

Right panel (properties & inspector):

Contextual properties: dimensions, rotation, material, layer, tags, clearance constraints (e.g., maintain 900mm).

For special rooms (server room, mandir) show extra policy toggles (e.g., Vastu orientation, rack spacing).

Bottom / Docked catalog (object library):

Large searchable library of furniture & decor. Provide categories, filters (by vendor, price, style), and thumbnails.

Drag-and-drop from library into canvas; when placed, object opens a properties card (dimensions, vendor info, CAD/STEP links).

Collections / mood boards feature (save a set of items as a palette).

Top action bar:

Project metadata (name, floors, area), collaboration/share button, preview, render, export.

Quick switches: 2D/3D toggle, measurement units (m / ft), grid size, snap on/off.

3D viewer (Three.js):

Real-time conversion of 2D geometry -> 3D (extrude walls, place objects).

Walkthrough / 360º mode and camera presets (isometric, first-person, top).

Material editor (change finishes and lighting intensity) and 4K render button.

AI Assistant panel:

“Generate layout” button for a selected floor or entire building, with options for rule-based/ML hybrid, style, and constraints.

Shows 3 candidate layouts with scores + rationales (space efficiency, ergonomics, cost).

“Auto-furnish” option (populate rooms using vendor items from marketplace) and “Optimize” (re-run optimizer after manual edits).

Templates & Gallery:

Template library (rooms, floor plans, commercial shells) with thumbnail previews and “use template” action.

Floorplan import (upload image/PDF) → AI floorplan recognition to convert to editable geometry (Planner5D feature inspiration). 
Planner 5D

Shop / Vendor Panels:

In-object vendor badge / preview showing vendor, SKU, and “Buy” or “Request quote”.

“Add to project” vs “Place-to-buy” behavior for vendor items.

Performance & Progressive Enhancement:

Lazy load large catalogs, progressive glTF streaming for large scenes, web worker offloading for geometry operations.

Mobile-friendly UI modes (condensed toolbar, simplified property inspector), inspired by Planner5D cross-platform approach. 
Planner 5D

2 — Planner5D UX → Backend + API mapping (Cursor must implement)

Map the UI to these APIs / backend behaviors (additions to your API list):

POST /api/project/{id}/floor/{floorId}/ai/generate — returns candidate layouts & score.

POST /api/project/{id}/import/floorplan — accepts image/PDF, runs AI floorplan recognition, returns editable geometry. (Planner5D feature inspiration). 
Planner 5D

GET /api/library/items?filter=vendor|style|category — paged item library.

POST /api/library/items/{id}/place — reserves vendor item or returns purchase flow.

GET /api/project/{id}/preview/360 — signed URL / tile stream for walkthrough.

Keep previously described endpoints (design/generate, export, marketplace) but ensure performance/streaming endpoints for 3D.

3 — UI Patterns & Interaction Details for Cursor (exact deliverables)

Object placement UX: snapping guidelines, minimum clearance red/green indicators while dragging, smart pivot handles, rotate by degrees input, fine-grain keyboard nudging.

Measurements & Labels: on-hover dimension labels for walls/rooms; toggle to show/hide annotations.

Multi-select & batch-edit: change material/finish or vendor for multiple items at once.

Versioning & Revisions: save revisions per project; “compare revisions” UI and ability to roll back.

Share & Collaboration: generate share links (view-only / edit) and comments on objects (issue tracking like BCF).

Render Queue: async rendering with progress, downloadable 4K assets when ready.

4 — Marketplace & Monetization (how UI differs from Planner5D)

Planner5D has a large library & shop features; for ArchAID, Cursor must deliver:

Vendor onboarding flow, SKU management, stock & pricing UI.

In-canvas vendor badges & direct purchase flows — placing an item into a project can optionally trigger a “add to cart” with vendor SKU.

Architect listing flow: designers can upload parametric templates and set license/pricing (single-use, subscription, royalty).

Payout interface, analytics dashboards for vendors & architects.

(These are new features — present them as distinct panels & flows in the UI; keep the core Planner5D-style object catalog as the foundation.)

5 — Design tokens, visual system & assets (exact spec)

Adopt Planner5D’s approach to clean, iconographic UI but apply ArchAID brand tokens. Base styling on Bootstrap components; only add lightweight external/custom CSS when absolutely necessary—Tailwind.css is not part of this stack:

Grid & canvas: light blueprint grid on canvas background, adjustable opacity.

Primary colors: as earlier (Primary #2E86FF, Dark #0A1A2F, Accent #00D2D9).

Typography: Montserrat / Inter as before.

Iconography: line icons; use blueprint/architectural icons for drawing tools.

Animations: subtle micro-interactions for drag & drop, placement previews and AI suggestions.

6 — Cross-platform & offline sync

Planner5D offers apps across platforms; Cursor’s output must include:

App shell that supports progressive web app (PWA) features, offline project caching, and sync.

Mobile-friendly controls and a condensed catalog for touch interactions. 
Planner 5D

7 — Performance and scale notes (implementation guidance for Cursor)

Use web workers for heavy geometry ops (partitioning, boolean ops).

Stream glTF assets via signed URLs; preload assets likely to be used in scene.

Paginate library queries; favor server-side filtering.

Use background workers for CAD/STEP conversion and rendering (return job IDs).

8 — Acceptance criteria (Planner5D parity + ArchAID uniqueness)

Cursor’s deliverable must satisfy:

UX parity with Planner5D’s core flows: fast floorplan creation, library-based furnishing, 2D/3D toggle, 360 walkthrough, AI floorplan recognition. 
Planner 5D

Added ArchAID features: marketplace + monetization, CAD/STEP export pipeline, multi-floor & corporate space rules, user-defined exceptions.

Angular app with the Canvas workspace, left toolbar, right inspector, bottom catalog, AI assistant panel and multi-floor manager — all interactive and wired to backend mock endpoints.

.NET Core backend endpoints for AI import, generate, catalog, export queue and marketplace.

Sample seed library (≥ 2 vendors, 50 sample items) and templates (multi-floor & corporate shells).

Documentation describing how Planner5D patterns were adapted (include screenshots or references).

9 — Citations & resources used (Planner5D baseline)

Planner5D homepage — feature highlights (floor plan editor, 3D, AI floorplan recognition, large item library, 360 walkthrough & cross-platform). 
Planner 5d