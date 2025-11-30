using ArchAID.Api.Models;
using MongoDB.Driver;
using MongoDB.Bson;

namespace ArchAID.Api.Services;

public interface IProjectMongoService
{
    Task<Project?> GetProjectByIdAsync(string projectId);
    Task<IEnumerable<Project>> GetProjectsByOwnerIdAsync(string ownerId);
    Task<IEnumerable<Project>> GetAllProjectsAsync();
    Task<Project> CreateProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(string projectId, Project project);
    Task<bool> DeleteProjectAsync(string projectId);
    Task<IEnumerable<Floor>> GetFloorsByProjectIdAsync(string projectId);
    Task<Floor> AddFloorToProjectAsync(string projectId, Floor floor);
    Task<Floor> UpdateFloorAsync(string projectId, string floorId, Floor floor);
    Task<bool> DeleteFloorAsync(string projectId, string floorId);
}

public class ProjectMongoService : IProjectMongoService
{
    private readonly IMongoCollection<MongoProject> _projectsCollection;
    private const string CollectionName = "Projects";

    public ProjectMongoService(MongoDbService mongoDbService)
    {
        _projectsCollection = mongoDbService.GetCollection<MongoProject>(CollectionName);
        
        // Create indexes
        CreateIndexes();
    }

    private void CreateIndexes()
    {
        var indexOptions = new CreateIndexOptions { Unique = false };
        var ownerIdIndex = new CreateIndexModel<MongoProject>(
            Builders<MongoProject>.IndexKeys.Ascending(p => p.OwnerId),
            indexOptions);
        _projectsCollection.Indexes.CreateOne(ownerIdIndex);
    }

    public async Task<Project?> GetProjectByIdAsync(string projectId)
    {
        var mongoProject = await _projectsCollection
            .Find(p => p.Id == projectId)
            .FirstOrDefaultAsync();

        return mongoProject != null ? ConvertToProject(mongoProject) : null;
    }

    public async Task<IEnumerable<Project>> GetProjectsByOwnerIdAsync(string ownerId)
    {
        var mongoProjects = await _projectsCollection
            .Find(p => p.OwnerId == ownerId)
            .ToListAsync();

        return mongoProjects.Select(ConvertToProject);
    }

    public async Task<IEnumerable<Project>> GetAllProjectsAsync()
    {
        var mongoProjects = await _projectsCollection
            .Find(_ => true)
            .ToListAsync();

        return mongoProjects.Select(ConvertToProject);
    }

    public async Task<Project> CreateProjectAsync(Project project)
    {
        var mongoProject = ConvertToMongoProject(project);
        mongoProject.Id = ObjectId.GenerateNewId().ToString();
        mongoProject.CreatedAt = DateTime.UtcNow;
        mongoProject.UpdatedAt = DateTime.UtcNow;

        await _projectsCollection.InsertOneAsync(mongoProject);
        return ConvertToProject(mongoProject);
    }

    public async Task<Project> UpdateProjectAsync(string projectId, Project project)
    {
        var mongoProject = ConvertToMongoProject(project);
        mongoProject.Id = projectId;
        mongoProject.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<MongoProject>.Filter.Eq(p => p.Id, projectId);
        var update = Builders<MongoProject>.Update
            .Set(p => p.Name, mongoProject.Name)
            .Set(p => p.Description, mongoProject.Description)
            .Set(p => p.Floors, mongoProject.Floors)
            .Set(p => p.UpdatedAt, mongoProject.UpdatedAt);

        var result = await _projectsCollection.UpdateOneAsync(filter, update);

        if (result.MatchedCount == 0)
        {
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");
        }

        return await GetProjectByIdAsync(projectId) ?? project;
    }

    public async Task<bool> DeleteProjectAsync(string projectId)
    {
        var filter = Builders<MongoProject>.Filter.Eq(p => p.Id, projectId);
        var result = await _projectsCollection.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }

    public async Task<IEnumerable<Floor>> GetFloorsByProjectIdAsync(string projectId)
    {
        var project = await GetProjectByIdAsync(projectId);
        return project?.Floors ?? Enumerable.Empty<Floor>();
    }

    public async Task<Floor> AddFloorToProjectAsync(string projectId, Floor floor)
    {
        var mongoFloor = ConvertToMongoFloor(floor);
        mongoFloor.Id = ObjectId.GenerateNewId().ToString();
        mongoFloor.ProjectId = projectId;
        mongoFloor.CreatedAt = DateTime.UtcNow;

        var filter = Builders<MongoProject>.Filter.Eq(p => p.Id, projectId);
        var update = Builders<MongoProject>.Update.Push(p => p.Floors, mongoFloor);

        var result = await _projectsCollection.UpdateOneAsync(filter, update);

        if (result.MatchedCount == 0)
        {
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");
        }

        return ConvertToFloor(mongoFloor);
    }

    public async Task<Floor> UpdateFloorAsync(string projectId, string floorId, Floor floor)
    {
        var project = await GetProjectByIdAsync(projectId);
        if (project == null)
        {
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");
        }

        var floorIndex = project.Floors.FindIndex(f => f.Id.ToString() == floorId);
        if (floorIndex == -1)
        {
            throw new KeyNotFoundException($"Floor with ID {floorId} not found in project {projectId}.");
        }

        project.Floors[floorIndex] = floor;
        await UpdateProjectAsync(projectId, project);

        return floor;
    }

    public async Task<bool> DeleteFloorAsync(string projectId, string floorId)
    {
        var filter = Builders<MongoProject>.Filter.Eq(p => p.Id, projectId);
        var update = Builders<MongoProject>.Update.PullFilter(
            p => p.Floors,
            f => f.Id != null && f.Id.ToString() == floorId);

        var result = await _projectsCollection.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    // Conversion methods
    private Project ConvertToProject(MongoProject mongoProject)
    {
        return new Project
        {
            Id = Guid.TryParse(mongoProject.Id, out var guid) ? guid : Guid.NewGuid(),
            Name = mongoProject.Name,
            Description = mongoProject.Description,
            OwnerId = mongoProject.OwnerId,
            Floors = mongoProject.Floors.Select(ConvertToFloor).ToList(),
            CreatedAt = mongoProject.CreatedAt,
            UpdatedAt = mongoProject.UpdatedAt
        };
    }

    private MongoProject ConvertToMongoProject(Project project)
    {
        return new MongoProject
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Description = project.Description,
            OwnerId = project.OwnerId,
            Floors = project.Floors.Select(ConvertToMongoFloor).ToList(),
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }

    private Floor ConvertToFloor(MongoFloor mongoFloor)
    {
        return new Floor
        {
            Id = Guid.TryParse(mongoFloor.Id, out var guid) ? guid : Guid.NewGuid(),
            ProjectId = Guid.TryParse(mongoFloor.ProjectId, out var projectGuid) ? projectGuid : Guid.NewGuid(),
            Name = mongoFloor.Name,
            Level = mongoFloor.Index,
            Area = mongoFloor.Rooms.Sum(r => r.Area),
            Geometry = new Dictionary<string, object>
            {
                ["walls"] = mongoFloor.Walls.Select(w => new Dictionary<string, object>
                {
                    ["id"] = w.Id,
                    ["start"] = new { x = w.Start.X, y = w.Start.Y },
                    ["end"] = new { x = w.End.X, y = w.End.Y },
                    ["length"] = w.Length,
                    ["thickness"] = w.Thickness ?? 10
                }).ToList(),
                ["rooms"] = mongoFloor.Rooms.Select(r => new Dictionary<string, object>
                {
                    ["id"] = r.Id,
                    ["points"] = r.Points.Select(p => new { x = p.X, y = p.Y }).ToList(),
                    ["area"] = r.Area,
                    ["roomType"] = r.RoomType ?? "other",
                    ["center"] = new { x = r.Center.X, y = r.Center.Y }
                }).ToList()
            },
            CreatedAt = mongoFloor.CreatedAt
        };
    }

    private MongoFloor ConvertToMongoFloor(Floor floor)
    {
        var walls = new List<MongoWall>();
        var rooms = new List<MongoRoom>();

        if (floor.Geometry.ContainsKey("walls") && floor.Geometry["walls"] is List<object> wallsList)
        {
            walls = wallsList.Select(w => ConvertToMongoWall(w)).ToList();
        }

        if (floor.Geometry.ContainsKey("rooms") && floor.Geometry["rooms"] is List<object> roomsList)
        {
            rooms = roomsList.Select(r => ConvertToMongoRoom(r)).ToList();
        }

        return new MongoFloor
        {
            Id = floor.Id.ToString(),
            ProjectId = floor.ProjectId.ToString(),
            Name = floor.Name,
            Index = floor.Level,
            Walls = walls,
            Rooms = rooms,
            CreatedAt = floor.CreatedAt
        };
    }

    private MongoWall ConvertToMongoWall(object? wallObj)
    {
        // This is a simplified conversion - in production, use proper deserialization
        if (wallObj is Dictionary<string, object> wallDict)
        {
            var startObj = wallDict.GetValueOrDefault("start");
            var endObj = wallDict.GetValueOrDefault("end");
            
            return new MongoWall
            {
                Id = wallDict.GetValueOrDefault("id")?.ToString() ?? Guid.NewGuid().ToString(),
                Start = ConvertToMongoPoint(startObj),
                End = ConvertToMongoPoint(endObj),
                Length = wallDict.GetValueOrDefault("length") != null ? Convert.ToDouble(wallDict["length"]) : 0,
                Thickness = wallDict.ContainsKey("thickness") && wallDict["thickness"] != null ? Convert.ToDouble(wallDict["thickness"]) : 10
            };
        }
        return new MongoWall();
    }

    private MongoRoom ConvertToMongoRoom(object? roomObj)
    {
        if (roomObj is Dictionary<string, object> roomDict)
        {
            var points = new List<MongoPoint>();
            var pointsObj = roomDict.GetValueOrDefault("points");
            if (pointsObj is List<object> pointsList)
            {
                points = pointsList.Select(ConvertToMongoPoint).ToList();
            }

            var areaObj = roomDict.GetValueOrDefault("area");
            var area = areaObj != null ? Convert.ToDouble(areaObj) : 0;

            return new MongoRoom
            {
                Id = roomDict.GetValueOrDefault("id")?.ToString() ?? Guid.NewGuid().ToString(),
                Points = points,
                Area = area,
                RoomType = roomDict.GetValueOrDefault("roomType")?.ToString(),
                Center = ConvertToMongoPoint(roomDict.GetValueOrDefault("center"))
            };
        }
        return new MongoRoom();
    }

    private MongoPoint ConvertToMongoPoint(object? pointObj)
    {
        if (pointObj is Dictionary<string, object> pointDict)
        {
            return new MongoPoint
            {
                X = Convert.ToDouble(pointDict.GetValueOrDefault("x") ?? 0),
                Y = Convert.ToDouble(pointDict.GetValueOrDefault("y") ?? 0)
            };
        }
        return new MongoPoint();
    }
}

