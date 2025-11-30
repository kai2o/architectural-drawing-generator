# ArchAID – Planner5D-Inspired AI Design Platform

ArchAID is a canvas-first design environment that merges Planner5D’s intuitive UX with ArchAID-specific requirements: multi-floor residential + corporate planning, AI optimization, CAD/STEP delivery, and marketplace monetization. The goal is to build a production-ready Angular + .NET Core platform that satisfies every item in `guidline.md` and the phased roadmap in `task.md`.

## ✨ Experience Goals

- **Planner5D parity**: central canvas, 2D/3D toggle, AI floorplan recognition, furniture catalog, 360° walkthroughs, cross-platform modes.
- **ArchAID differentiators**: corporate partition tools, marketplace for architects/vendors, monetized object catalog, CAD/STEP export queue, AI optimizer panel, multi-floor management, policy-aware spaces (server room, mandir).
- **Performance + reach**: lazy catalogs, web workers for geometry, progressive glTF streaming, PWA/offline shell, mobile-friendly controls.

## 📁 Repository Layout

```
frontend/   Angular workspace (Planner5D-style UI, lazy modules, PWA shell)
backend/    ASP.NET Core 8 Web API (project, AI, marketplace, export services)
docs/       UX notes, Planner5D adaptation write-ups, screenshots
specs/      API contracts, sequence diagrams, service agreements
schemas/    JSON schemas, CAD/STEP metadata, marketplace payload formats
guidline.md Canonical UX + feature instructions
task.md     30-task execution plan grouped by phases
```

## 🛠️ Tech Stack

- **Frontend**: Angular 17+, SSR-ready, Bootstrap tokens, Montserrat/Inter typography, NgRx state, Three.js, service workers, dedicated geometry/collision web workers.
- **Backend**: .NET 8 Web API, JWT auth, modular services (`ProjectService`, `AssetService`, `MarketplaceService`, `AIService`), background workers for CAD/STEP conversion and rendering, Swagger/OpenAPI + versioning.
- **Rendering/Assets**: Three.js + glTF streaming, signed URLs, FreeCAD/STEP workflow, 4K render queue + 360 preview endpoints.

## 🚩 Roadmap (per `task.md`)

| Phase | Scope | Highlights |
| --- | --- | --- |
| 1 | Project setup | Angular + .NET scaffolding, docs/specs/schemas, guideline-aligned README |
| 2 | Canvas-first editor | Workspace shell, 2D wall engine, multi-floor manager, 3D mode, object placement, corporate cabin tools |
| 3 | AI systems | AI generate endpoint, assistant panel, floorplan import, auto-furnish logic |
| 4 | Library + marketplace | Library API + seed data, catalog UI, architect marketplace, vendor onboarding, in-canvas badges |
| 5 | Exports & rendering | CAD/STEP export service, export panel, render queue, 360 walkthrough viewer |
| 6 | Auth, billing, analytics | Role-based auth, Stripe monetization, dashboards for architects/vendors |
| 7 | Performance & cross-platform | Web workers, PWA/offline cache, mobile UI mode |
| 8 | Testing & delivery | Automated tests, CI/CD pipelines, final documentation package |

Every task must maintain UX parity with Planner5D while layering ArchAID’s marketplace + CAD/STEP + AI differentiators.

## ✅ Working Agreements

1. **Canvas-first**: Always prioritize the Planner5D-style layout (top bar, left tools, right inspector, bottom catalog, AI assistant panel).
2. **Feature-to-API mapping**: Each UI feature must map to a backend endpoint (even if mocked initially) so Angular services stay aligned with `guidline.md`.
3. **Corporate + special-room logic**: Server rooms, mandirs, cabins, and rule-based clearances need dedicated inspector controls and backend flags.
4. **Performance guardrails**: Use lazy loading, asset streaming, and workers for any heavy geometry, CAD export, or rendering work.
5. **Documentation-first**: Capture Planner5D adaptations, marketplace flows, and API details in `docs/`, `specs/`, and `schemas/` as tasks progress.

## 🚀 Getting Started

```
# Frontend (Angular workspace)
cd frontend
npm install
npm run start   # later tasks add NgRx, SSR, PWA, canvas modules

# Backend (ASP.NET Core 8)
cd backend
dotnet restore
dotnet run      # exposes Swagger with all required endpoints
```

During Task 2 add lazy modules (`editor`, `marketplace`, `auth`, `dashboard`, `shared`), Montserrat fonts, icon packs, and global styling tokens. During Task 3 scaffold modular services, JWT auth, and baseline controllers/endpoints listed in `guidline.md`.

## 📌 Next Steps

1. Confirm Task 1 structure is complete (both workspaces plus docs/specs/schemas directories).
2. Progress to Task 2 (Angular configuration, lazy modules, theming) and Task 3 (backend setup with services + Swagger).
3. Follow `task.md` sequentially; never skip ahead without satisfying acceptance criteria from `guidline.md`.

All future commits must be validated against `guidline.md` to guarantee Planner5D-level UX plus ArchAID’s marketplace, AI, and CAD requirements.

