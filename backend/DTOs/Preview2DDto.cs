namespace backend.DTOs;

public class Preview2DDto
{
    public List<WallDto> Walls { get; set; } = new();
    public List<FurnitureDto> Furniture { get; set; } = new();
    public double RoomLength { get; set; }
    public double RoomBreadth { get; set; }
}

public class WallDto
{
    public double StartX { get; set; }
    public double StartY { get; set; }
    public double EndX { get; set; }
    public double EndY { get; set; }
    public List<OpeningDto> Openings { get; set; } = new();
}

public class OpeningDto
{
    public string Type { get; set; } = string.Empty;
    public double Position { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

public class FurnitureDto
{
    public string Name { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Depth { get; set; }
    public double Rotation { get; set; }
}

