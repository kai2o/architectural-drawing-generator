using backend.Models;
using netDxf;
using netDxf.Entities;
using netDxf.Tables;

namespace backend.Services;

public class CadEngineService : ICadEngineService
{
    public byte[] GenerateDwgFile(RoomDesign design)
    {
        var dxf = new DxfDocument();

        // Set up layers
        var wallLayer = new Layer("Walls") { Color = AciColor.Blue };
        var furnitureLayer = new Layer("Furniture") { Color = AciColor.Green };
        var dimensionsLayer = new Layer("Dimensions") { Color = AciColor.Red };

        // Draw walls
        foreach (var wall in design.Walls)
        {
            var line = new Line(
                new netDxf.Vector3(wall.StartPoint.X, wall.StartPoint.Y, 0),
                new netDxf.Vector3(wall.EndPoint.X, wall.EndPoint.Y, 0)
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

                var openingX = wall.StartPoint.X + (wall.EndPoint.X - wall.StartPoint.X) * opening.Position;
                var openingY = wall.StartPoint.Y + (wall.EndPoint.Y - wall.StartPoint.Y) * opening.Position;

                // Draw opening as a rectangle
                var openingRect = new Polyline2D(
                    new[]
                    {
                        new Vector2(openingX - opening.Width / 2, openingY),
                        new Vector2(openingX + opening.Width / 2, openingY),
                        new Vector2(openingX + opening.Width / 2, openingY + opening.Height),
                        new Vector2(openingX - opening.Width / 2, openingY + opening.Height)
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
            var rect = new Polyline2D(
                new[]
                {
                    new Vector2(furniture.X, furniture.Y),
                    new Vector2(furniture.X + furniture.Width, furniture.Y),
                    new Vector2(furniture.X + furniture.Width, furniture.Y + furniture.Depth),
                    new Vector2(furniture.X, furniture.Y + furniture.Depth)
                },
                true
            );
            rect.Layer = furnitureLayer;
            dxf.Entities.Add(rect);

            // Add text label
            var text = new Text(furniture.Name, new Vector2(furniture.X + furniture.Width / 2, furniture.Y + furniture.Depth / 2), 0.2);
            text.Layer = furnitureLayer;
            dxf.Entities.Add(text);
        }

        // Draw kitchen counters if applicable
        if (design.KitchenLayout != null)
        {
            foreach (var counter in design.KitchenLayout.Counters)
            {
                var counterRect = new Polyline2D(
                    new[]
                    {
                        new Vector2(counter.X, counter.Y),
                        new Vector2(counter.X + counter.Length, counter.Y),
                        new Vector2(counter.X + counter.Length, counter.Y + counter.Depth),
                        new Vector2(counter.X, counter.Y + counter.Depth)
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
            var storageRect = new Polyline2D(
                new[]
                {
                    new Vector2(storage.X, storage.Y),
                    new Vector2(storage.X + storage.Width, storage.Y),
                    new Vector2(storage.X + storage.Width, storage.Y + storage.Depth),
                    new Vector2(storage.X, storage.Y + storage.Depth)
                },
                true
            );
            storageRect.Layer = furnitureLayer;
            dxf.Entities.Add(storageRect);
        }

        // Add room dimensions (simplified - using text annotation instead)
        var dimText = new Text($"Length: {design.Length}m x Breadth: {design.Breadth}m", 
            new Vector2(design.Length / 2, -0.5), 0.3);
        dimText.Layer = dimensionsLayer;
        dxf.Entities.Add(dimText);

        // Save to memory stream as DXF (netDxf saves as DXF, which is compatible with DWG viewers)
        using var stream = new MemoryStream();
        dxf.Save(stream);
        stream.Position = 0;
        return stream.ToArray();
    }
}

