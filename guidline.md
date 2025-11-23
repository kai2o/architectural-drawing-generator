Home Interior Designer Automation Website

Tech Stack: Angular (Frontend) + .NET Core OR Java Spring Boot (Backend)
Output Formats: CAD (.dwg) + SolidWorks (.sldprt / .sldasm)
Core Function: Autogenerate room designs & floor plans based on user-provided dimensions.

SYSTEM INSTRUCTIONS FOR CURSOR

You are building a full-stack web application that automates the job of a home designer/architect.
Your output must include:

Angular frontend

Backend (choose .NET Core 8 or Java Spring Boot depending on my command)

Architecture diagrams

API design

Data models

CAD + SolidWorks file generation logic

Export modules

Clean file structure

Working code templates

Dummy sample outputs

Follow clean-code principles, SOLID and modular architecture.

✅ PROJECT TITLE:

AI-Powered Home Designer & Floor Plan Generator

📌 PROJECT DESCRIPTION

Build a web application where users enter:

Room length (m)

Room breadth (m)

Room height (m)

Optional: purpose (bedroom/living/kitchen), number of occupants, style preference.

The system must automatically generate:

Optimized layout suggestion (space management, furniture placement)

Kitchen counters or cabinets, if applicable

Storage recommendations

3D Model of the room design

2D architectural floor plan

Export in:

CAD format (.dwg)

SolidWorks format (.sldprt / .sldasm)

Use a geometry engine + rule-based design system + basic AI logic for layout generation.

🔧 CORE FEATURES
1. Input Module

Angular form that accepts:

Length

Breadth

Height

Room Type (bedroom/living/kitchen/bathroom/custom)

Optional design preferences

2. AI Layout Engine

Backend service processes dimensions and generates:

Coordinates for walls

Furniture placement

Storage layout

Kitchen counter placement

Door/window suggestions

Use procedural geometry algorithms:

Space optimization

Grid partitioning

Minimum clearance rules

Work triangle logic (for kitchens)

3. CAD & SolidWorks File Generation

Backend must export files using CAD libraries:

Use netDxf (for .NET) OR Java LibreDWG / DXFWriter (for Java)

Generate parametric SolidWorks files using:

.NET: SolidWorks API via interop

Java: Export STEP (.step) then convert to SolidWorks-compatible format

4. Angular UI/UX

**Note: This project uses Bootstrap 5 for styling. Custom CSS should only be written when absolutely necessary. Prefer Bootstrap utility classes and components for all UI elements.**

Modules required:

Input form page

2D floor plan preview

3D rendering (use Three.js)

Download section for CAD + SolidWorks outputs

"Regenerate design" option

5. Backend API Endpoints
POST /api/design/generate
GET  /api/design/{id}/download/cad
GET  /api/design/{id}/download/solidworks
GET  /api/design/{id}/preview/2d
GET  /api/design/{id}/preview/3d

🏗️ ARCHITECTURE

Generate for me:

High-level system architecture diagram

Component diagram

Backend controller-service-repository structure

Frontend module/component/service layout

Database schema (if using DB)

📁 PROJECT FILE STRUCTURE

Ask Cursor to generate a structure like:

Frontend (Angular)
/src  
 ├── app  
 │    ├── components  
 │    ├── pages  
 │    ├── services  
 │    ├── models  
 │    └── utils
 ├── assets  
 └── environments

Backend

For .NET:

/src  
 ├── Controllers  
 ├── Services  
 ├── Repositories  
 ├── Models  
 ├── DTOs  
 ├── CADEngine  
 ├── SolidWorksEngine  
 └── Helpers


For Java Spring Boot:

/src  
 ├── controller  
 ├── service  
 ├── repository  
 ├── model  
 ├── dto  
 ├── util  
 ├── cad  
 └── solidworks

🤖 TASK FOR CURSOR

Generate the complete full-stack application including:

✔ Backend full code

API controllers

Services

CAD generation logic

SolidWorks export logic

2D SVG/Canvas preview logic

3D model generation with vertices & meshes

DTOs & models

Sample request & response

✔ Frontend full code

Angular components

UI forms

Three.js viewer

CAD/SolidWorks download buttons

REST API integration

Beautiful responsive UI

✔ Build scripts

package.json

Angular config

.NET csproj / Java pom.xml

✔ Documentation

README.md

How to run

How CAD files are generated

Example output files

🧪 TESTING REQUIREMENTS

Unit tests for services

API tests

UI e2e tests

Sample CAD & STEP file exports

📝 OUTPUT FORMAT (VERY IMPORTANT)

Cursor must reply in this structure:

Architecture Summary

Frontend Code

Backend Code

CAD Generator Code

SolidWorks Generator Code

3D Rendering Code (Three.js)

API Documentation (OpenAPI/Swagger)

Test Cases

Deployment Instructions

Sample CAD + STEP output (text-based placeholders)