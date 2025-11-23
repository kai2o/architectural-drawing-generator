namespace backend.Models;

public class RoomDesign
{
    public Guid Id { get; set; }
    public double Length { get; set; }
    public double Breadth { get; set; }
    public double Height { get; set; }
    public RoomType RoomType { get; set; }
    public DesignStyle? Style { get; set; }
    public int? Occupants { get; set; }
    public List<Wall> Walls { get; set; } = new();
    public List<FurnitureItem> Furniture { get; set; } = new();
    public List<StorageUnit> StorageUnits { get; set; } = new();
    public KitchenLayout? KitchenLayout { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StorageUnit
{
    public string Name { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Depth { get; set; }
    public double Height { get; set; }
    public string Type { get; set; } = string.Empty; // "cabinet", "shelf", "wardrobe"
}

public class KitchenLayout
{
    public List<Counter> Counters { get; set; } = new();
    public Point2D SinkLocation { get; set; } = new(0, 0);
    public Point2D StoveLocation { get; set; } = new(0, 0);
    public Point2D RefrigeratorLocation { get; set; } = new(0, 0);
}

public class Counter
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Length { get; set; }
    public double Depth { get; set; } = 0.6; // 60cm standard
    public double Height { get; set; } = 0.9; // 90cm standard
    public bool HasUpperCabinets { get; set; }
}

