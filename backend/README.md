# Backend API - AI-Powered Home Designer

## Overview

This is a .NET Core 8 Web API backend for the AI-Powered Home Designer application. It provides endpoints for generating automated room designs, floor plans, and exporting to CAD (.dwg) and SolidWorks (.step) formats.

## Tech Stack

- **.NET Core 8.0**
- **netDxf** - For CAD/DXF file generation
- **Swagger/OpenAPI** - API documentation
- **ASP.NET Core Web API**

## Architecture

The backend follows a clean architecture pattern with:

- **Controllers** - Handle HTTP requests/responses
- **Services** - Business logic layer
  - `LayoutEngineService` - AI logic for space optimization and furniture placement
  - `CadEngineService` - Generates CAD/DXF files
  - `SolidWorksEngineService` - Generates STEP files (SolidWorks-compatible)
  - `DesignService` - Orchestrates design generation
- **Models** - Domain entities
- **DTOs** - Data transfer objects for API communication

## API Endpoints

### POST /api/design/generate
Generate a new room design based on dimensions and preferences.

**Request Body:**
```json
{
  "length": 5.0,
  "breadth": 4.0,
  "height": 2.7,
  "roomType": "Bedroom",
  "style": "Modern",
  "occupants": 2,
  "preferences": {}
}
```

**Response:**
```json
{
  "id": "guid",
  "design": { ... },
  "message": "Design generated successfully"
}
```

### GET /api/design/{id}/preview/2d
Get 2D floor plan preview data (JSON format for frontend rendering).

### GET /api/design/{id}/preview/3d
Get 3D model data with vertices and faces (JSON format for Three.js).

### GET /api/design/{id}/download/cad
Download the design as a CAD (.dwg) file.

### GET /api/design/{id}/download/solidworks
Download the design as a SolidWorks-compatible STEP (.step) file.

### GET /api/design/{id}
Get full design details by ID.

## Room Types Supported

- **Bedroom** - Generates bed, nightstand, dresser, wardrobe
- **Kitchen** - Generates counters, work triangle (sink, stove, refrigerator)
- **Living** - Generates sofa, coffee table, TV stand
- **Bathroom** - Generates toilet, sink, shower
- **Custom** - Generic furniture layout

## Design Features

### Layout Engine
- **Space Optimization** - Calculates optimal furniture placement
- **Grid Partitioning** - Divides room into functional zones
- **Minimum Clearance Rules** - Ensures 60cm clearance for walkways
- **Work Triangle Logic** - For kitchens (sink, stove, refrigerator placement)
- **Door/Window Placement** - Automatically suggests openings

### CAD Generation
- Uses netDxf library to generate DXF files
- Creates layers for walls, furniture, and dimensions
- Includes room dimensions and labels

### SolidWorks Generation
- Generates STEP (ISO 10303-21) format files
- Creates 3D solid models of walls, furniture, and room structure
- Can be imported into SolidWorks or other CAD software

## Running the Application

### Prerequisites
- .NET 8 SDK installed
- Visual Studio 2022 or VS Code (optional)

### Steps

1. Navigate to the backend directory:
```bash
cd backend
```

2. Restore NuGet packages:
```bash
dotnet restore
```

3. Run the application:
```bash
dotnet run
```

4. The API will be available at:
   - HTTP: `http://localhost:5000`
   - Swagger UI: `http://localhost:5000/swagger`

### Development

To run in development mode with hot reload:
```bash
dotnet watch run
```

## Configuration

### CORS
The API is configured to allow requests from `http://localhost:4200` (Angular default port). Update `Program.cs` if using a different frontend URL.

### Port Configuration
Default port is 5000. To change, modify `Properties/launchSettings.json` or use:
```bash
dotnet run --urls "http://localhost:5001"
```

## Testing

### Using Swagger UI
1. Navigate to `http://localhost:5000/swagger`
2. Use the interactive API documentation to test endpoints
3. Click "Try it out" on any endpoint to test

### Using cURL

**Generate Design:**
```bash
curl -X POST "http://localhost:5000/api/design/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "length": 5.0,
    "breadth": 4.0,
    "height": 2.7,
    "roomType": "Bedroom",
    "occupants": 2
  }'
```

**Download CAD:**
```bash
curl -X GET "http://localhost:5000/api/design/{id}/download/cad" \
  -o design.dwg
```

## File Formats

### DXF/DWG
- Generated using netDxf library
- Compatible with AutoCAD, FreeCAD, and other CAD software
- Contains 2D floor plan with walls, furniture, and dimensions

### STEP
- ISO 10303-21 format
- 3D solid model representation
- Can be imported into SolidWorks, Solid Edge, Fusion 360, etc.

## Notes

- **In-Memory Storage**: Currently, designs are stored in memory. For production, implement a database (SQL Server, PostgreSQL, etc.)
- **SolidWorks API**: For direct .sldprt/.sldasm generation, SolidWorks must be installed and COM interop configured. The current implementation generates STEP files which can be imported.
- **CAD Format**: netDxf generates DXF format. Most CAD software can open DXF files. For true DWG format, additional libraries or conversion tools may be needed.

## Future Enhancements

- Database persistence (Entity Framework Core)
- User authentication and design history
- Advanced AI algorithms for layout optimization
- Support for multiple rooms/floors
- Real-time collaboration
- Export to additional formats (PDF, PNG, OBJ)

