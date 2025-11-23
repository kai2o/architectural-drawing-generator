using backend.Models;

namespace backend.Services;

public class LayoutEngineService : ILayoutEngineService
{
    private const double MinClearance = 0.6; // 60cm minimum clearance
    private const double DoorWidth = 0.9; // 90cm standard door
    private const double WindowWidth = 1.2; // 120cm standard window

    public RoomDesign GenerateLayout(double length, double breadth, double height, RoomType roomType, DesignStyle? style, int? occupants)
    {
        var design = new RoomDesign
        {
            Id = Guid.NewGuid(),
            Length = length,
            Breadth = breadth,
            Height = height,
            RoomType = roomType,
            Style = style,
            Occupants = occupants
        };

        // Generate walls
        design.Walls = GenerateWalls(length, breadth, height);

        // Generate room-specific layouts
        switch (roomType)
        {
            case RoomType.Kitchen:
                design.KitchenLayout = GenerateKitchenLayout(length, breadth);
                break;
            case RoomType.Bedroom:
                design.Furniture = GenerateBedroomFurniture(length, breadth, occupants ?? 1);
                design.StorageUnits = GenerateBedroomStorage(length, breadth);
                break;
            case RoomType.Living:
                design.Furniture = GenerateLivingRoomFurniture(length, breadth, occupants ?? 2);
                break;
            case RoomType.Bathroom:
                design.Furniture = GenerateBathroomFurniture(length, breadth);
                break;
            default:
                design.Furniture = GenerateGenericFurniture(length, breadth);
                break;
        }

        return design;
    }

    private List<Wall> GenerateWalls(double length, double breadth, double height)
    {
        var walls = new List<Wall>
        {
            // North wall
            new Wall
            {
                StartPoint = new Point2D(0, 0),
                EndPoint = new Point2D(length, 0),
                Height = height,
                Openings = GenerateOpenings(length, "north")
            },
            // East wall
            new Wall
            {
                StartPoint = new Point2D(length, 0),
                EndPoint = new Point2D(length, breadth),
                Height = height,
                Openings = GenerateOpenings(breadth, "east")
            },
            // South wall
            new Wall
            {
                StartPoint = new Point2D(length, breadth),
                EndPoint = new Point2D(0, breadth),
                Height = height,
                Openings = GenerateOpenings(length, "south")
            },
            // West wall
            new Wall
            {
                StartPoint = new Point2D(0, breadth),
                EndPoint = new Point2D(0, 0),
                Height = height,
                Openings = GenerateOpenings(breadth, "west")
            }
        };

        return walls;
    }

    private List<Opening> GenerateOpenings(double wallLength, string wallSide)
    {
        var openings = new List<Opening>();

        // Add a door on one of the longer walls
        if (wallLength >= 3.0 && (wallSide == "north" || wallSide == "south"))
        {
            openings.Add(new Opening
            {
                Type = "door",
                Position = 0.2, // 20% along the wall
                Width = DoorWidth,
                Height = 2.1 // 210cm standard door height
            });
        }

        // Add windows on opposite walls
        if (wallLength >= 2.0 && (wallSide == "east" || wallSide == "west"))
        {
            openings.Add(new Opening
            {
                Type = "window",
                Position = 0.5, // Center of wall
                Width = Math.Min(WindowWidth, wallLength * 0.4),
                Height = 1.2 // 120cm window height
            });
        }

        return openings;
    }

    private KitchenLayout GenerateKitchenLayout(double length, double breadth)
    {
        var layout = new KitchenLayout();
        var counterDepth = 0.6;
        var workTriangleSize = Math.Min(length, breadth) * 0.6;

        // Place counters along walls (L-shaped or U-shaped based on size)
        if (length >= 3.0 && breadth >= 2.5)
        {
            // U-shaped kitchen
            layout.Counters.Add(new Counter
            {
                X = 0,
                Y = 0,
                Length = length * 0.4,
                HasUpperCabinets = true
            });
            layout.Counters.Add(new Counter
            {
                X = length * 0.4,
                Y = 0,
                Length = breadth,
                HasUpperCabinets = true
            });
            layout.Counters.Add(new Counter
            {
                X = length * 0.4,
                Y = breadth - counterDepth,
                Length = length * 0.6,
                HasUpperCabinets = true
            });

            // Work triangle
            layout.SinkLocation = new Point2D(length * 0.2, 0);
            layout.StoveLocation = new Point2D(length * 0.6, breadth - counterDepth);
            layout.RefrigeratorLocation = new Point2D(length * 0.4, breadth);
        }
        else
        {
            // L-shaped kitchen
            layout.Counters.Add(new Counter
            {
                X = 0,
                Y = 0,
                Length = length * 0.6,
                HasUpperCabinets = true
            });
            layout.Counters.Add(new Counter
            {
                X = length * 0.6,
                Y = 0,
                Length = breadth,
                HasUpperCabinets = true
            });

            layout.SinkLocation = new Point2D(length * 0.3, 0);
            layout.StoveLocation = new Point2D(length * 0.6, breadth * 0.5);
            layout.RefrigeratorLocation = new Point2D(0, breadth);
        }

        return layout;
    }

    private List<FurnitureItem> GenerateBedroomFurniture(double length, double breadth, int occupants)
    {
        var furniture = new List<FurnitureItem>();
        var bedWidth = occupants == 1 ? 1.0 : 1.6; // Single or double bed
        var bedLength = 2.0;

        // Place bed in corner
        furniture.Add(new FurnitureItem
        {
            Name = "Bed",
            X = MinClearance,
            Y = MinClearance,
            Width = bedWidth,
            Depth = bedLength,
            Height = 0.5,
            Rotation = 0
        });

        // Nightstand
        furniture.Add(new FurnitureItem
        {
            Name = "Nightstand",
            X = MinClearance + bedWidth + 0.1,
            Y = MinClearance,
            Width = 0.5,
            Depth = 0.5,
            Height = 0.6,
            Rotation = 0
        });

        // Dresser/Wardrobe
        if (length >= 3.0)
        {
            furniture.Add(new FurnitureItem
            {
                Name = "Dresser",
                X = length - 1.2,
                Y = MinClearance,
                Width = 1.2,
                Depth = 0.6,
                Height = 1.0,
                Rotation = 0
            });
        }

        return furniture;
    }

    private List<StorageUnit> GenerateBedroomStorage(double length, double breadth)
    {
        var storage = new List<StorageUnit>();

        // Wardrobe along one wall
        if (length >= 2.0)
        {
            storage.Add(new StorageUnit
            {
                Name = "Wardrobe",
                X = length - 0.6,
                Y = 0,
                Width = 0.6,
                Depth = breadth,
                Height = 2.4,
                Type = "wardrobe"
            });
        }

        return storage;
    }

    private List<FurnitureItem> GenerateLivingRoomFurniture(double length, double breadth, int occupants)
    {
        var furniture = new List<FurnitureItem>();
        var seatingCapacity = Math.Max(2, occupants);

        // Sofa
        var sofaLength = Math.Min(2.4, length * 0.6);
        furniture.Add(new FurnitureItem
        {
            Name = "Sofa",
            X = length * 0.3,
            Y = breadth - 1.0,
            Width = sofaLength,
            Depth = 0.9,
            Height = 0.9,
            Rotation = 0
        });

        // Coffee table
        furniture.Add(new FurnitureItem
        {
            Name = "Coffee Table",
            X = length * 0.3 + sofaLength / 2 - 0.4,
            Y = breadth - 1.0 - 0.6,
            Width = 0.8,
            Depth = 0.8,
            Height = 0.4,
            Rotation = 0
        });

        // TV stand
        if (length >= 2.5)
        {
            furniture.Add(new FurnitureItem
            {
                Name = "TV Stand",
                X = length * 0.1,
                Y = 0,
                Width = 1.5,
                Depth = 0.4,
                Height = 0.5,
                Rotation = 0
            });
        }

        return furniture;
    }

    private List<FurnitureItem> GenerateBathroomFurniture(double length, double breadth)
    {
        var furniture = new List<FurnitureItem>();

        // Toilet
        furniture.Add(new FurnitureItem
        {
            Name = "Toilet",
            X = length - 0.4,
            Y = breadth - 0.5,
            Width = 0.4,
            Depth = 0.5,
            Height = 0.4,
            Rotation = 0
        });

        // Sink
        furniture.Add(new FurnitureItem
        {
            Name = "Sink",
            X = length * 0.3,
            Y = 0,
            Width = 0.6,
            Depth = 0.4,
            Height = 0.8,
            Rotation = 0
        });

        // Shower/Bathtub
        if (length >= 1.8)
        {
            furniture.Add(new FurnitureItem
            {
                Name = "Shower",
                X = 0,
                Y = 0,
                Width = 0.9,
                Depth = 0.9,
                Height = 2.0,
                Rotation = 0
            });
        }

        return furniture;
    }

    private List<FurnitureItem> GenerateGenericFurniture(double length, double breadth)
    {
        var furniture = new List<FurnitureItem>();

        // Basic table
        furniture.Add(new FurnitureItem
        {
            Name = "Table",
            X = length / 2 - 0.5,
            Y = breadth / 2 - 0.5,
            Width = 1.0,
            Depth = 1.0,
            Height = 0.75,
            Rotation = 0
        });

        return furniture;
    }
}

