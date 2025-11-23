namespace backend.Models;

public class Wall
{
    public Point2D StartPoint { get; set; } = new(0, 0);
    public Point2D EndPoint { get; set; } = new(0, 0);
    public double Height { get; set; }
    public double Thickness { get; set; } = 0.2; // 20cm default
    public List<Opening> Openings { get; set; } = new(); // doors, windows
}

public class Opening
{
    public string Type { get; set; } = string.Empty; // "door" or "window"
    public double Position { get; set; } // position along wall (0-1)
    public double Width { get; set; }
    public double Height { get; set; }
}

