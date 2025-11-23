using backend.Models;
using netDxf;
using netDxf.Entities;
using netDxf.Tables;
using System.Linq;

namespace backend.Services;

public class CadEngineService : ICadEngineService
{
    public byte[] GenerateDwgFile(RoomDesign design)
    {
        // Create DXF document (netDxf creates valid DXF files by default)
        // The default version is compatible with AutoCAD 2010+
        var dxf = new DxfDocument();

        // Set up layers with proper AutoCAD-compatible colors
        var wallLayer = new Layer("Walls") { Color = AciColor.Blue };
        var furnitureLayer = new Layer("Furniture") { Color = AciColor.Green };
        var dimensionsLayer = new Layer("Dimensions") { Color = AciColor.Red };

        // Helper method to validate and clamp coordinates
        double ValidateCoordinate(double value) => double.IsNaN(value) || double.IsInfinity(value) ? 0.0 : value;

        // Draw walls
        foreach (var wall in design.Walls)
        {
            var startX = ValidateCoordinate(wall.StartPoint.X);
            var startY = ValidateCoordinate(wall.StartPoint.Y);
            var endX = ValidateCoordinate(wall.EndPoint.X);
            var endY = ValidateCoordinate(wall.EndPoint.Y);
            
            var line = new Line(
                new netDxf.Vector3(startX, startY, 0),
                new netDxf.Vector3(endX, endY, 0)
            );
            line.Layer = wallLayer;
            dxf.Entities.Add(line);

            // Draw openings (doors/windows)
            foreach (var opening in wall.Openings)
            {
                var wallLength = Math.Sqrt(
                    Math.Pow(wall.EndPoint.X - wall.StartPoint.X, 2) +
                    Math.Pow(wall.EndPoint.Y - wall.StartPoint.Y, 2)
                );

                var openingX = startX + (endX - startX) * ValidateCoordinate(opening.Position);
                var openingY = startY + (endY - startY) * ValidateCoordinate(opening.Position);
                var openingWidth = ValidateCoordinate(opening.Width);
                var openingHeight = ValidateCoordinate(opening.Height);

                // Draw opening as a rectangle
                var openingRect = new Polyline2D(
                    new[]
                    {
                        new Vector2(openingX - openingWidth / 2, openingY),
                        new Vector2(openingX + openingWidth / 2, openingY),
                        new Vector2(openingX + openingWidth / 2, openingY + openingHeight),
                        new Vector2(openingX - openingWidth / 2, openingY + openingHeight)
                    },
                    true
                );
                openingRect.Layer = wallLayer;
                dxf.Entities.Add(openingRect);
            }
        }

        // Draw furniture
        foreach (var furniture in design.Furniture)
        {
            var fX = ValidateCoordinate(furniture.X);
            var fY = ValidateCoordinate(furniture.Y);
            var fWidth = ValidateCoordinate(furniture.Width);
            var fDepth = ValidateCoordinate(furniture.Depth);
            
            var rect = new Polyline2D(
                new[]
                {
                    new Vector2(fX, fY),
                    new Vector2(fX + fWidth, fY),
                    new Vector2(fX + fWidth, fY + fDepth),
                    new Vector2(fX, fY + fDepth)
                },
                true
            );
            rect.Layer = furnitureLayer;
            dxf.Entities.Add(rect);

            // Add text label (ensure text is not empty or null)
            var furnitureName = string.IsNullOrWhiteSpace(furniture.Name) ? "Furniture" : furniture.Name;
            var text = new Text(furnitureName, new Vector2(fX + fWidth / 2, fY + fDepth / 2), 0.2);
            text.Layer = furnitureLayer;
            dxf.Entities.Add(text);
        }

        // Draw kitchen counters if applicable
        if (design.KitchenLayout != null)
        {
            foreach (var counter in design.KitchenLayout.Counters)
            {
                var cX = ValidateCoordinate(counter.X);
                var cY = ValidateCoordinate(counter.Y);
                var cLength = ValidateCoordinate(counter.Length);
                var cDepth = ValidateCoordinate(counter.Depth);
                
                var counterRect = new Polyline2D(
                    new[]
                    {
                        new Vector2(cX, cY),
                        new Vector2(cX + cLength, cY),
                        new Vector2(cX + cLength, cY + cDepth),
                        new Vector2(cX, cY + cDepth)
                    },
                    true
                );
                counterRect.Layer = furnitureLayer;
                dxf.Entities.Add(counterRect);
            }
        }

        // Draw storage units
        foreach (var storage in design.StorageUnits)
        {
            var sX = ValidateCoordinate(storage.X);
            var sY = ValidateCoordinate(storage.Y);
            var sWidth = ValidateCoordinate(storage.Width);
            var sDepth = ValidateCoordinate(storage.Depth);
            
            var storageRect = new Polyline2D(
                new[]
                {
                    new Vector2(sX, sY),
                    new Vector2(sX + sWidth, sY),
                    new Vector2(sX + sWidth, sY + sDepth),
                    new Vector2(sX, sY + sDepth)
                },
                true
            );
            storageRect.Layer = furnitureLayer;
            dxf.Entities.Add(storageRect);
        }

        // Add room dimensions (simplified - using text annotation instead)
        var roomLength = ValidateCoordinate(design.Length);
        var roomBreadth = ValidateCoordinate(design.Breadth);
        var dimText = new Text($"Length: {roomLength:F2}m x Breadth: {roomBreadth:F2}m", 
            new Vector2(roomLength / 2, -0.5), 0.3);
        dimText.Layer = dimensionsLayer;
        dxf.Entities.Add(dimText);

        // Save to memory stream as DXF format (AutoCAD-compatible)
        // Note: We always add at least the dimension text, so entities will always exist
        // Note: netDxf generates DXF files, which AutoCAD can open directly
        using var stream = new MemoryStream();
        
        // Save with ASCII format for maximum compatibility (binary DXF can have issues)
        // netDxf.Save() by default saves as ASCII DXF which is more compatible
        dxf.Save(stream);
        
        // Ensure stream is properly positioned
        stream.Position = 0;
        var fileBytes = stream.ToArray();
        
        // Validate that we have actual content
        if (fileBytes.Length == 0)
        {
            throw new InvalidOperationException("Generated CAD file is empty");
        }
        
        return fileBytes;
    }
}

