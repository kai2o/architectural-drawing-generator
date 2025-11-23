# AI-Powered Home Designer & Floor Plan Generator

## 📋 Project Overview

This is a full-stack web application that automates the process of home interior design and architectural floor plan generation. The system intelligently creates optimized room layouts, furniture placements, and architectural drawings based on user-provided room dimensions and preferences. Users can visualize their designs in both 2D and 3D formats, and export professional CAD and SolidWorks files for use in architectural and engineering workflows.

The application combines rule-based layout algorithms with procedural geometry generation to create functional and aesthetically pleasing room designs that respect architectural standards, space optimization principles, and user preferences.

## 🎯 Why This Project is Needed

### Problem Statement

Traditional interior design and architectural planning processes are:
- **Time-consuming**: Manual design creation can take hours or days
- **Costly**: Hiring professional designers and architects is expensive
- **Inaccessible**: Professional design tools require specialized training
- **Inefficient**: Multiple iterations and revisions slow down the design process
- **Limited visualization**: 2D sketches don't provide a complete understanding of the space

### Solution Benefits

1. **Democratization of Design**: Makes professional-quality room design accessible to homeowners, DIY enthusiasts, and small businesses without requiring expensive software or design expertise.

2. **Rapid Prototyping**: Generate multiple design variations in seconds, allowing users to explore different layouts and styles before committing to a final design.

3. **Cost Efficiency**: Eliminates the need for initial consultation fees and reduces design iteration costs significantly.

4. **Professional Output**: Generates industry-standard CAD (.dwg/.dxf) and SolidWorks (.step) files that can be directly used by contractors, architects, and manufacturers.

5. **Space Optimization**: Uses algorithmic layout engines to maximize space utilization while maintaining functional requirements and clearance standards.

6. **Educational Value**: Helps users understand spatial relationships, furniture placement principles, and design best practices.

7. **Integration Ready**: Exported files can be imported into professional CAD software for further refinement, making it a valuable tool in the design workflow.

## 🏗️ Project Details

### Technology Stack

#### Frontend
- **Framework**: Angular 20.3.0
- **Styling**: Bootstrap 5.3.8
- **3D Rendering**: Three.js (for interactive 3D visualization)
- **Language**: TypeScript 5.9.2
- **Server-Side Rendering**: Angular SSR support

#### Backend
- **Framework**: .NET Core 8.0 (ASP.NET Core Web API)
- **CAD Generation**: netDxf 3.0.1 (for DXF/DWG file generation)
- **API Documentation**: Swashbuckle (Swagger/OpenAPI)
- **Language**: C#

### Core Features

#### 1. **Intelligent Room Design Generation**
   - Accepts room dimensions (length, breadth, height)
   - Supports multiple room types: Bedroom, Living Room, Kitchen, Bathroom, Custom
   - Design style preferences: Modern, Traditional, Minimalist, Industrial, Scandinavian, Contemporary
   - Occupancy-based furniture recommendations
   - Automatic wall generation with proper openings (doors/windows)

#### 2. **Layout Engine**
   - **Space Optimization**: Algorithmic placement of furniture to maximize usable space
   - **Clearance Rules**: Ensures minimum clearance requirements for walkways and accessibility
   - **Grid Partitioning**: Intelligent space division for optimal furniture arrangement
   - **Work Triangle Logic**: Specialized kitchen layout optimization (sink, stove, refrigerator placement)
   - **Storage Solutions**: Automatic generation of cabinets, shelves, and wardrobes based on room type

#### 3. **2D Floor Plan Preview**
   - Top-down view of the room layout
   - Wall boundaries with door and window openings
   - Furniture placement visualization
   - Accurate scale representation
   - Interactive SVG/Canvas rendering

#### 4. **3D Model Visualization**
   - Interactive 3D room visualization using Three.js
   - Floor, ceiling, and wall rendering
   - 3D furniture models
   - Camera controls for viewing from different angles
   - Real-time mesh generation with vertices and faces

#### 5. **CAD File Export**
   - **DXF Format**: Industry-standard Drawing Exchange Format
   - **DWG Compatibility**: Files compatible with AutoCAD and other CAD software
   - Complete architectural drawings with:
     - Wall boundaries
     - Door and window openings
     - Furniture placement
     - Dimensions and annotations

#### 6. **SolidWorks File Export**
   - **STEP Format**: Standard for the Exchange of Product model data
   - 3D parametric models
   - Compatible with SolidWorks, CATIA, and other CAD software
   - Full 3D geometry representation

### Architecture

#### Backend Structure
```
backend/
├── Controllers/          # API endpoints (RESTful)
│   └── DesignController.cs
├── Services/            # Business logic layer
│   ├── DesignService.cs
│   ├── LayoutEngineService.cs
│   ├── CadEngineService.cs
│   └── SolidWorksEngineService.cs
├── Models/              # Domain models
│   ├── RoomDesign.cs
│   ├── FurnitureItem.cs
│   ├── Wall.cs
│   ├── RoomType.cs
│   └── DesignStyle.cs
└── DTOs/                # Data Transfer Objects
    ├── DesignRequestDto.cs
    ├── DesignResponseDto.cs
    ├── Preview2DDto.cs
    └── Preview3DDto.cs
```

#### Frontend Structure
```
frontend/src/app/
├── components/          # Reusable UI components
│   ├── input-form/      # Design input form
│   ├── floor-plan-2d/   # 2D preview component
│   ├── viewer-3d/      # 3D visualization component
│   └── design-results/  # Results display component
├── pages/               # Page components
│   └── home/           # Main application page
├── services/            # API integration services
│   └── design.service.ts
└── models/              # TypeScript models
    └── room-design.model.ts
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/design/generate` | Generate a new room design based on input parameters |
| `GET` | `/api/design/{id}` | Retrieve design details by ID |
| `GET` | `/api/design/{id}/preview/2d` | Get 2D floor plan preview data |
| `GET` | `/api/design/{id}/preview/3d` | Get 3D model preview data |
| `GET` | `/api/design/{id}/download/cad` | Download design as CAD (.dxf) file |
| `GET` | `/api/design/{id}/download/solidworks` | Download design as SolidWorks (.step) file |

### Design Models

#### Room Design Components
- **Walls**: Defined by start and end points with height, including door/window openings
- **Furniture Items**: Positioned with X, Y coordinates, dimensions (width, depth, height), and rotation
- **Storage Units**: Cabinets, shelves, and wardrobes with specific placement
- **Kitchen Layout**: Specialized counter placement with work triangle optimization (sink, stove, refrigerator)

#### Supported Room Types
- **Bedroom**: Optimized for sleeping, storage, and personal space
- **Living Room**: Focus on seating arrangements and entertainment areas
- **Kitchen**: Work triangle optimization, counter placement, and storage
- **Bathroom**: Fixture placement and storage solutions
- **Custom**: Flexible layout for any purpose

#### Design Styles
- **Modern**: Clean lines, minimal furniture, contemporary aesthetics
- **Traditional**: Classic furniture arrangements and styling
- **Minimalist**: Maximum space, minimal furniture
- **Industrial**: Open spaces, functional layouts
- **Scandinavian**: Light, airy, functional design
- **Contemporary**: Current trends and flexible arrangements

### Key Algorithms

1. **Space Partitioning**: Grid-based room division for optimal furniture placement
2. **Collision Detection**: Ensures furniture doesn't overlap and maintains clearance
3. **Work Triangle Calculation**: For kitchens, optimizes the distance between sink, stove, and refrigerator
4. **Wall Generation**: Creates four walls with appropriate openings based on room type
5. **Furniture Selection**: Chooses appropriate furniture based on room type, size, and occupancy

### File Generation

#### CAD (DXF) Generation
- Uses netDxf library to create DXF files
- Includes layers for walls, furniture, and annotations
- Maintains accurate scale and dimensions
- Compatible with AutoCAD, LibreCAD, and other CAD software

#### SolidWorks (STEP) Generation
- Generates STEP files (ISO 10303 standard)
- 3D parametric geometry representation
- Includes all room elements (walls, furniture, fixtures)
- Can be imported into SolidWorks, CATIA, Fusion 360, etc.

### User Workflow

1. **Input**: User enters room dimensions and preferences through the Angular form
2. **Generation**: Backend processes the request and generates an optimized layout
3. **Preview**: User can view the design in 2D (floor plan) and 3D (interactive model)
4. **Refinement**: User can regenerate with different parameters
5. **Export**: Download professional CAD or SolidWorks files for further use

### Future Enhancements

- Database persistence for saving and retrieving designs
- User authentication and design history
- Advanced AI/ML for style recommendations
- Material and color selection
- Cost estimation based on furniture and materials
- Integration with furniture catalogs
- Mobile responsive design improvements
- Real-time collaboration features

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- Angular CLI 20+

### Running the Application

#### Backend
```bash
cd backend
dotnet restore
dotnet run
```
Backend will be available at `https://localhost:5001` or `http://localhost:5000`

#### Frontend
```bash
cd frontend
npm install
ng serve
```
Frontend will be available at `http://localhost:4200`

### API Documentation
Once the backend is running, access Swagger UI at:
- `https://localhost:5001/swagger` (HTTPS)
- `http://localhost:5000/swagger` (HTTP)

## 📝 License

This project is developed as a semester 4 academic project.

---

**Note**: This application is designed to assist in the initial design phase. For final construction plans, consultation with licensed architects and engineers is recommended.

