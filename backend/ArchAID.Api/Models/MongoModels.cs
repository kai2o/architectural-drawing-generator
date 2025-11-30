using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ArchAID.Api.Models;

// MongoDB Models for Projects and Floors
[BsonIgnoreExtraElements]
public class MongoProject
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("ownerId")]
    public string OwnerId { get; set; } = string.Empty;

    [BsonElement("floors")]
    public List<MongoFloor> Floors { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class MongoFloor
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("projectId")]
    public string ProjectId { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("index")]
    public int Index { get; set; }

    [BsonElement("walls")]
    public List<MongoWall> Walls { get; set; } = new();

    [BsonElement("rooms")]
    public List<MongoRoom> Rooms { get; set; } = new();

    [BsonElement("thumbnail")]
    public string? Thumbnail { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class MongoWall
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("start")]
    public MongoPoint Start { get; set; } = new();

    [BsonElement("end")]
    public MongoPoint End { get; set; } = new();

    [BsonElement("length")]
    public double Length { get; set; }

    [BsonElement("thickness")]
    public double? Thickness { get; set; }
}

[BsonIgnoreExtraElements]
public class MongoRoom
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("points")]
    public List<MongoPoint> Points { get; set; } = new();

    [BsonElement("area")]
    public double Area { get; set; }

    [BsonElement("roomType")]
    public string? RoomType { get; set; }

    [BsonElement("center")]
    public MongoPoint Center { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class MongoPoint
{
    [BsonElement("x")]
    public double X { get; set; }

    [BsonElement("y")]
    public double Y { get; set; }
}

