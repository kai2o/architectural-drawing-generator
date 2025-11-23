# Quick Start Guide - Running the Backend

## Prerequisites
- ✅ .NET 8 SDK (or later) - You have version 10.0.100 installed
- ✅ Visual Studio Code or Visual Studio (optional)

## Step-by-Step Instructions

### Method 1: Using Command Line (Recommended)

1. **Open PowerShell or Command Prompt**

2. **Navigate to the backend directory:**
   ```powershell
   cd "C:\Users\Admin\OneDrive - Vidyalankar School of Information Technology\CODE\sem4_project\backend"
   ```

3. **Restore NuGet packages:**
   ```powershell
   dotnet restore
   ```

4. **Run the application:**
   ```powershell
   dotnet run
   ```

5. **You should see output like:**
   ```
   info: Microsoft.Hosting.Lifetime[14]
         Now listening on: http://localhost:5000
   info: Microsoft.Hosting.Lifetime[0]
         Application started. Press Ctrl+C to shut down.
   ```

6. **Open your browser and visit:**
   - **Swagger UI (API Documentation):** http://localhost:5000/swagger
   - **API Base URL:** http://localhost:5000/api

### Method 2: Using Visual Studio

1. Open `backend.csproj` in Visual Studio
2. Press `F5` or click the "Run" button
3. The browser will automatically open to the Swagger page

### Method 3: Using Visual Studio Code

1. Open the `backend` folder in VS Code
2. Open the integrated terminal (`` Ctrl+` ``)
3. Run: `dotnet run`
4. Open browser to http://localhost:5000/swagger

## Testing the API

### Option 1: Using Swagger UI
1. Go to http://localhost:5000/swagger
2. Click on any endpoint (e.g., `POST /api/design/generate`)
3. Click "Try it out"
4. Enter the request body:
   ```json
   {
     "length": 5.0,
     "breadth": 4.0,
     "height": 2.7,
     "roomType": "Bedroom",
     "occupants": 2
   }
   ```
5. Click "Execute"
6. View the response

### Option 2: Using PowerShell/curl

**Generate a design:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/design/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"length":5.0,"breadth":4.0,"height":2.7,"roomType":"Bedroom","occupants":2}'
```

**Get 2D preview:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/design/{YOUR_DESIGN_ID}/preview/2d" -Method GET
```

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, you can change it:
```powershell
dotnet run --urls "http://localhost:5001"
```

### Package Restore Errors
```powershell
dotnet clean
dotnet restore
dotnet build
dotnet run
```

### CORS Issues
If you get CORS errors when connecting from Angular:
- Make sure Angular is running on `http://localhost:4200`
- Check `Program.cs` - CORS is configured for `http://localhost:4200`

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Next Steps

Once the backend is running:
1. Start your Angular frontend: `cd frontend && npm start`
2. The frontend should connect to `http://localhost:5000`
3. Test the full application flow

## API Endpoints Available

- `POST /api/design/generate` - Generate a new room design
- `GET /api/design/{id}` - Get design details
- `GET /api/design/{id}/preview/2d` - Get 2D floor plan data
- `GET /api/design/{id}/preview/3d` - Get 3D model data
- `GET /api/design/{id}/download/cad` - Download CAD file
- `GET /api/design/{id}/download/solidworks` - Download STEP file

For full API documentation, visit: http://localhost:5000/swagger

