namespace ArchAID.Api.Models;

public class LayoutGenerationRequest
{
    public double Width { get; set; }
    public double Height { get; set; }
    public List<string> RequiredRooms { get; set; } = new();
    public string Style { get; set; } = "Modern";
    public Dictionary<string, object> Constraints { get; set; } = new();
}

public class LayoutCandidate
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FloorId { get; set; }
    public double Score { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public Dictionary<string, object> LayoutData { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class FloorplanRecognitionResult
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public List<WallGeometry> Walls { get; set; } = new();
    public List<RoomGeometry> Rooms { get; set; } = new();
    public double Confidence { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WallGeometry
{
    public double StartX { get; set; }
    public double StartY { get; set; }
    public double EndX { get; set; }
    public double EndY { get; set; }
    public double Thickness { get; set; }
}

public class RoomGeometry
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class FurnishingRequest
{
    public string Style { get; set; } = "Modern";
    public List<string> PreferredVendors { get; set; } = new();
    public decimal? Budget { get; set; }
}

public class FurnishingSuggestion
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FloorId { get; set; }
    public string Style { get; set; } = string.Empty;
    public List<SuggestedItem> SuggestedItems { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class SuggestedItem
{
    public Guid AssetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public object Position { get; set; } = new();
}

