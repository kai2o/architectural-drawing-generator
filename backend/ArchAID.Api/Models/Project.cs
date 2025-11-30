namespace ArchAID.Api.Models;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public List<Floor> Floors { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Floor
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Level { get; set; }
    public double Area { get; set; }
    public Dictionary<string, object> Geometry { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

