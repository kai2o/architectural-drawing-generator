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
        var titleLayer = new Layer("Titles") { Color = AciColor.Magenta };

        // Helper method to validate and clamp coordinates
        double ValidateCoordinate(double value) => double.IsNaN(value) || double.IsInfinity(value) ? 0.0 : value;

        // Get room dimensions
        var roomLength = ValidateCoordinate(design.Length);
        var roomBreadth = ValidateCoordinate(design.Breadth);
        var roomHeight = ValidateCoordinate(design.Height);

        // Define spacing between views
        var viewSpacing = Math.Max(roomLength, roomBreadth) * 1.5;
        var verticalSpacing = roomHeight * 1.5;

        // TOP VIEW (Floor Plan) - positioned at origin
        var topViewOffsetX = 0.0;
        var topViewOffsetY = 0.0;
        DrawTopView(dxf, design, topViewOffsetX, topViewOffsetY, wallLayer, furnitureLayer, dimensionsLayer, titleLayer);

        // FRONT VIEW (Elevation) - positioned below top view
        var frontViewOffsetX = 0.0;
        var frontViewOffsetY = -(roomBreadth + verticalSpacing);
        DrawFrontView(dxf, design, frontViewOffsetX, frontViewOffsetY, wallLayer, furnitureLayer, dimensionsLayer, titleLayer);

        // RIGHT VIEW (Side Elevation) - positioned to the right of front view
        var rightViewOffsetX = roomLength + viewSpacing;
        var rightViewOffsetY = -(roomBreadth + verticalSpacing);
        DrawRightView(dxf, design, rightViewOffsetX, rightViewOffsetY, wallLayer, furnitureLayer, dimensionsLayer, titleLayer);

        // Save to memory stream as DXF format (AutoCAD-compatible)
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

    private void DrawTopView(DxfDocument dxf, RoomDesign design, double offsetX, double offsetY, 
        Layer wallLayer, Layer furnitureLayer, Layer dimensionsLayer, Layer titleLayer)
    {
        double ValidateCoordinate(double value) => double.IsNaN(value) || double.IsInfinity(value) ? 0.0 : value;

        // Draw room outline (walls)
        foreach (var wall in design.Walls)
        {
            var startX = ValidateCoordinate(wall.StartPoint.X) + offsetX;
            var startY = ValidateCoordinate(wall.StartPoint.Y) + offsetY;
            var endX = ValidateCoordinate(wall.EndPoint.X) + offsetX;
            var endY = ValidateCoordinate(wall.EndPoint.Y) + offsetY;
            
            var line = new Line(
                new netDxf.Vector3(startX, startY, 0),
                new netDxf.Vector3(endX, endY, 0)
            );
            line.Layer = wallLayer;
            dxf.Entities.Add(line);

            // Draw openings (doors/windows) in top view
            foreach (var opening in wall.Openings)
            {
                var openingX = startX + (endX - startX) * ValidateCoordinate(opening.Position);
                var openingY = startY + (endY - startY) * ValidateCoordinate(opening.Position);
                var openingWidth = ValidateCoordinate(opening.Width);

                // Draw opening as a line break in the wall
                var openingStartX = openingX - openingWidth / 2;
                var openingStartY = openingY;
                var openingEndX = openingX + openingWidth / 2;
                var openingEndY = openingY;

                // Draw opening indicator
                var openingLine = new Line(
                    new netDxf.Vector3(openingStartX, openingStartY, 0),
                    new netDxf.Vector3(openingEndX, openingEndY, 0)
                );
                openingLine.Layer = wallLayer;
                dxf.Entities.Add(openingLine);
            }
        }

        // Draw furniture in top view
        foreach (var furniture in design.Furniture)
        {
            var fX = ValidateCoordinate(furniture.X) + offsetX;
            var fY = ValidateCoordinate(furniture.Y) + offsetY;
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

            var furnitureName = string.IsNullOrWhiteSpace(furniture.Name) ? "Furniture" : furniture.Name;
            var text = new Text(furnitureName, new Vector2(fX + fWidth / 2, fY + fDepth / 2), 0.2);
            text.Layer = furnitureLayer;
            dxf.Entities.Add(text);
        }

        // Draw storage units
        foreach (var storage in design.StorageUnits)
        {
            var sX = ValidateCoordinate(storage.X) + offsetX;
            var sY = ValidateCoordinate(storage.Y) + offsetY;
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

        // Add title
        var titleText = new Text("TOP VIEW", new Vector2(offsetX + design.Length / 2, offsetY + design.Breadth + 0.5), 0.4);
        titleText.Layer = titleLayer;
        dxf.Entities.Add(titleText);
    }

    private void DrawFrontView(DxfDocument dxf, RoomDesign design, double offsetX, double offsetY,
        Layer wallLayer, Layer furnitureLayer, Layer dimensionsLayer, Layer titleLayer)
    {
        double ValidateCoordinate(double value) => double.IsNaN(value) || double.IsInfinity(value) ? 0.0 : value;

        var roomLength = ValidateCoordinate(design.Length);
        var roomHeight = ValidateCoordinate(design.Height);

        // Draw left wall
        var leftWall = new Line(
            new netDxf.Vector3(offsetX, offsetY, 0),
            new netDxf.Vector3(offsetX, offsetY - roomHeight, 0)
        );
        leftWall.Layer = wallLayer;
        dxf.Entities.Add(leftWall);

        // Draw right wall
        var rightWall = new Line(
            new netDxf.Vector3(offsetX + roomLength, offsetY, 0),
            new netDxf.Vector3(offsetX + roomLength, offsetY - roomHeight, 0)
        );
        rightWall.Layer = wallLayer;
        dxf.Entities.Add(rightWall);

        // Draw floor
        var floor = new Line(
            new netDxf.Vector3(offsetX, offsetY, 0),
            new netDxf.Vector3(offsetX + roomLength, offsetY, 0)
        );
        floor.Layer = wallLayer;
        dxf.Entities.Add(floor);

        // Draw ceiling
        var ceiling = new Line(
            new netDxf.Vector3(offsetX, offsetY - roomHeight, 0),
            new netDxf.Vector3(offsetX + roomLength, offsetY - roomHeight, 0)
        );
        ceiling.Layer = wallLayer;
        dxf.Entities.Add(ceiling);

        // Draw openings (doors/windows) in front view
        foreach (var wall in design.Walls)
        {
            // Find front wall (wall along Y=0 or Y=breadth)
            var wallStartY = ValidateCoordinate(wall.StartPoint.Y);
            var wallEndY = ValidateCoordinate(wall.EndPoint.Y);
            
            // Check if this is a front-facing wall (assuming front wall is at Y=0 or Y=breadth)
            if (Math.Abs(wallStartY) < 0.1 || Math.Abs(wallEndY) < 0.1 || 
                Math.Abs(wallStartY - design.Breadth) < 0.1 || Math.Abs(wallEndY - design.Breadth) < 0.1)
            {
                foreach (var opening in wall.Openings)
                {
                    var openingX = ValidateCoordinate(wall.StartPoint.X) + 
                        (ValidateCoordinate(wall.EndPoint.X) - ValidateCoordinate(wall.StartPoint.X)) * 
                        ValidateCoordinate(opening.Position);
                    var openingWidth = ValidateCoordinate(opening.Width);
                    var openingHeight = ValidateCoordinate(opening.Height);
                    var openingBottom = -ValidateCoordinate(opening.Height); // Height from floor

                    // Draw opening rectangle
                    var openingRect = new Polyline2D(
                        new[]
                        {
                            new Vector2(offsetX + openingX - openingWidth / 2, offsetY),
                            new Vector2(offsetX + openingX + openingWidth / 2, offsetY),
                            new Vector2(offsetX + openingX + openingWidth / 2, offsetY + openingBottom),
                            new Vector2(offsetX + openingX - openingWidth / 2, offsetY + openingBottom)
                        },
                        true
                    );
                    openingRect.Layer = wallLayer;
                    dxf.Entities.Add(openingRect);
                }
            }
        }

        // Draw furniture in front view (showing height)
        foreach (var furniture in design.Furniture)
        {
            var fX = ValidateCoordinate(furniture.X) + offsetX;
            var fWidth = ValidateCoordinate(furniture.Width);
            var fHeight = ValidateCoordinate(furniture.Height);
            
            var furnitureRect = new Polyline2D(
                new[]
                {
                    new Vector2(fX, offsetY),
                    new Vector2(fX + fWidth, offsetY),
                    new Vector2(fX + fWidth, offsetY - fHeight),
                    new Vector2(fX, offsetY - fHeight)
                },
                true
            );
            furnitureRect.Layer = furnitureLayer;
            dxf.Entities.Add(furnitureRect);
        }

        // Add title
        var titleText = new Text("FRONT VIEW", new Vector2(offsetX + roomLength / 2, offsetY - roomHeight - 0.5), 0.4);
        titleText.Layer = titleLayer;
        dxf.Entities.Add(titleText);
    }

    private void DrawRightView(DxfDocument dxf, RoomDesign design, double offsetX, double offsetY,
        Layer wallLayer, Layer furnitureLayer, Layer dimensionsLayer, Layer titleLayer)
    {
        double ValidateCoordinate(double value) => double.IsNaN(value) || double.IsInfinity(value) ? 0.0 : value;

        var roomBreadth = ValidateCoordinate(design.Breadth);
        var roomHeight = ValidateCoordinate(design.Height);

        // Draw front wall (left side in right view)
        var frontWall = new Line(
            new netDxf.Vector3(offsetX, offsetY, 0),
            new netDxf.Vector3(offsetX, offsetY - roomHeight, 0)
        );
        frontWall.Layer = wallLayer;
        dxf.Entities.Add(frontWall);

        // Draw back wall (right side in right view)
        var backWall = new Line(
            new netDxf.Vector3(offsetX + roomBreadth, offsetY, 0),
            new netDxf.Vector3(offsetX + roomBreadth, offsetY - roomHeight, 0)
        );
        backWall.Layer = wallLayer;
        dxf.Entities.Add(backWall);

        // Draw floor
        var floor = new Line(
            new netDxf.Vector3(offsetX, offsetY, 0),
            new netDxf.Vector3(offsetX + roomBreadth, offsetY, 0)
        );
        floor.Layer = wallLayer;
        dxf.Entities.Add(floor);

        // Draw ceiling
        var ceiling = new Line(
            new netDxf.Vector3(offsetX, offsetY - roomHeight, 0),
            new netDxf.Vector3(offsetX + roomBreadth, offsetY - roomHeight, 0)
        );
        ceiling.Layer = wallLayer;
        dxf.Entities.Add(ceiling);

        // Draw openings (doors/windows) in right view
        foreach (var wall in design.Walls)
        {
            // Find side walls (walls along X=0 or X=length)
            var wallStartX = ValidateCoordinate(wall.StartPoint.X);
            var wallEndX = ValidateCoordinate(wall.EndPoint.X);
            
            if (Math.Abs(wallStartX) < 0.1 || Math.Abs(wallEndX) < 0.1 || 
                Math.Abs(wallStartX - design.Length) < 0.1 || Math.Abs(wallEndX - design.Length) < 0.1)
            {
                foreach (var opening in wall.Openings)
                {
                    var openingY = ValidateCoordinate(wall.StartPoint.Y) + 
                        (ValidateCoordinate(wall.EndPoint.Y) - ValidateCoordinate(wall.StartPoint.Y)) * 
                        ValidateCoordinate(opening.Position);
                    var openingWidth = ValidateCoordinate(opening.Width);
                    var openingHeight = ValidateCoordinate(opening.Height);
                    var openingBottom = -ValidateCoordinate(opening.Height);

                    // Draw opening rectangle
                    var openingRect = new Polyline2D(
                        new[]
                        {
                            new Vector2(offsetX + openingY - openingWidth / 2, offsetY),
                            new Vector2(offsetX + openingY + openingWidth / 2, offsetY),
                            new Vector2(offsetX + openingY + openingWidth / 2, offsetY + openingBottom),
                            new Vector2(offsetX + openingY - openingWidth / 2, offsetY + openingBottom)
                        },
                        true
                    );
                    openingRect.Layer = wallLayer;
                    dxf.Entities.Add(openingRect);
                }
            }
        }

        // Draw furniture in right view (showing depth and height)
        foreach (var furniture in design.Furniture)
        {
            var fY = ValidateCoordinate(furniture.Y) + offsetX; // Y becomes X in right view
            var fDepth = ValidateCoordinate(furniture.Depth);
            var fHeight = ValidateCoordinate(furniture.Height);
            
            var furnitureRect = new Polyline2D(
                new[]
                {
                    new Vector2(fY, offsetY),
                    new Vector2(fY + fDepth, offsetY),
                    new Vector2(fY + fDepth, offsetY - fHeight),
                    new Vector2(fY, offsetY - fHeight)
                },
                true
            );
            furnitureRect.Layer = furnitureLayer;
            dxf.Entities.Add(furnitureRect);
        }

        // Add title
        var titleText = new Text("RIGHT VIEW", new Vector2(offsetX + roomBreadth / 2, offsetY - roomHeight - 0.5), 0.4);
        titleText.Layer = titleLayer;
        dxf.Entities.Add(titleText);
    }
}

