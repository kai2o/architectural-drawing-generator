using backend.DTOs;
using backend.Models;

namespace backend.Services;

public class DesignService : IDesignService
{
    private readonly ILayoutEngineService _layoutEngine;
    private readonly ICadEngineService _cadEngine;
    private readonly ISolidWorksEngineService _solidWorksEngine;
    private readonly Dictionary<Guid, RoomDesign> _designStorage = new();

    public DesignService(
        ILayoutEngineService layoutEngine,
        ICadEngineService cadEngine,
        ISolidWorksEngineService solidWorksEngine)
    {
        _layoutEngine = layoutEngine;
        _cadEngine = cadEngine;
        _solidWorksEngine = solidWorksEngine;
    }

    public Task<DesignResponseDto> GenerateDesignAsync(DesignRequestDto request)
    {
        var design = _layoutEngine.GenerateLayout(
            request.Length,
            request.Breadth,
            request.Height,
            request.RoomType,
            request.Style,
            request.Occupants
        );

        _designStorage[design.Id] = design;

        var response = new DesignResponseDto
        {
            Id = design.Id,
            Design = design,
            Message = $"Design generated successfully for {request.RoomType} room"
        };

        return Task.FromResult(response);
    }

    public Task<RoomDesign?> GetDesignAsync(Guid id)
    {
        _designStorage.TryGetValue(id, out var design);
        return Task.FromResult(design);
    }

    public Task<Preview2DDto> GetPreview2DAsync(Guid id)
    {
        if (!_designStorage.TryGetValue(id, out var design))
        {
            return Task.FromResult<Preview2DDto>(null!);
        }

        var preview = new Preview2DDto
        {
            RoomLength = design.Length,
            RoomBreadth = design.Breadth,
            Walls = design.Walls.Select(w => new WallDto
            {
                StartX = w.StartPoint.X,
                StartY = w.StartPoint.Y,
                EndX = w.EndPoint.X,
                EndY = w.EndPoint.Y,
                Openings = w.Openings.Select(o => new OpeningDto
                {
                    Type = o.Type,
                    Position = o.Position,
                    Width = o.Width,
                    Height = o.Height
                }).ToList()
            }).ToList(),
            Furniture = design.Furniture.Select(f => new FurnitureDto
            {
                Name = f.Name,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Depth = f.Depth,
                Rotation = f.Rotation
            }).ToList()
        };

        return Task.FromResult(preview);
    }

    public Task<Preview3DDto> GetPreview3DAsync(Guid id)
    {
        if (!_designStorage.TryGetValue(id, out var design))
        {
            return Task.FromResult<Preview3DDto>(null!);
        }

        var vertices = new List<Vertex3D>();
        var faces = new List<Face>();
        var objects = new List<MeshObject>();
        int vertexOffset = 0;

        // Generate floor vertices
        vertices.AddRange(new[]
        {
            new Vertex3D(0, 0, 0),
            new Vertex3D(design.Length, 0, 0),
            new Vertex3D(design.Length, design.Breadth, 0),
            new Vertex3D(0, design.Breadth, 0)
        });
        faces.Add(new Face { Indices = new List<int> { 0, 1, 2, 3 } });
        objects.Add(new MeshObject
        {
            Name = "Floor",
            VertexIndices = new List<int> { 0, 1, 2, 3 },
            Type = "floor"
        });
        vertexOffset += 4;

        // Generate ceiling
        vertices.AddRange(new[]
        {
            new Vertex3D(0, 0, design.Height),
            new Vertex3D(design.Length, 0, design.Height),
            new Vertex3D(design.Length, design.Breadth, design.Height),
            new Vertex3D(0, design.Breadth, design.Height)
        });
        faces.Add(new Face { Indices = new List<int> { vertexOffset, vertexOffset + 1, vertexOffset + 2, vertexOffset + 3 } });
        objects.Add(new MeshObject
        {
            Name = "Ceiling",
            VertexIndices = new List<int> { vertexOffset, vertexOffset + 1, vertexOffset + 2, vertexOffset + 3 },
            Type = "ceiling"
        });
        vertexOffset += 4;

        // Generate walls
        foreach (var wall in design.Walls)
        {
            var wallVerts = new List<int>();
            vertices.AddRange(new[]
            {
                new Vertex3D(wall.StartPoint.X, wall.StartPoint.Y, 0),
                new Vertex3D(wall.EndPoint.X, wall.EndPoint.Y, 0),
                new Vertex3D(wall.EndPoint.X, wall.EndPoint.Y, wall.Height),
                new Vertex3D(wall.StartPoint.X, wall.StartPoint.Y, wall.Height)
            });
            wallVerts.AddRange(new[] { vertexOffset, vertexOffset + 1, vertexOffset + 2, vertexOffset + 3 });
            faces.Add(new Face { Indices = wallVerts });
            objects.Add(new MeshObject
            {
                Name = "Wall",
                VertexIndices = wallVerts,
                Type = "wall"
            });
            vertexOffset += 4;
        }

        // Generate furniture
        foreach (var furniture in design.Furniture)
        {
            var furnVerts = new List<int>();
            vertices.AddRange(new[]
            {
                new Vertex3D(furniture.X, furniture.Y, 0),
                new Vertex3D(furniture.X + furniture.Width, furniture.Y, 0),
                new Vertex3D(furniture.X + furniture.Width, furniture.Y + furniture.Depth, 0),
                new Vertex3D(furniture.X, furniture.Y + furniture.Depth, 0),
                new Vertex3D(furniture.X, furniture.Y, furniture.Height),
                new Vertex3D(furniture.X + furniture.Width, furniture.Y, furniture.Height),
                new Vertex3D(furniture.X + furniture.Width, furniture.Y + furniture.Depth, furniture.Height),
                new Vertex3D(furniture.X, furniture.Y + furniture.Depth, furniture.Height)
            });
            furnVerts.AddRange(Enumerable.Range(vertexOffset, 8));
            faces.Add(new Face { Indices = furnVerts });
            objects.Add(new MeshObject
            {
                Name = furniture.Name,
                VertexIndices = furnVerts,
                Type = "furniture"
            });
            vertexOffset += 8;
        }

        var preview = new Preview3DDto
        {
            Vertices = vertices,
            Faces = faces,
            Objects = objects
        };

        return Task.FromResult(preview);
    }

    public Task<byte[]?> GetCadFileAsync(Guid id)
    {
        if (!_designStorage.TryGetValue(id, out var design))
        {
            return Task.FromResult<byte[]?>(null);
        }

        var cadBytes = _cadEngine.GenerateDwgFile(design);
        return Task.FromResult<byte[]?>(cadBytes);
    }

    public Task<byte[]?> GetSolidWorksFileAsync(Guid id)
    {
        if (!_designStorage.TryGetValue(id, out var design))
        {
            return Task.FromResult<byte[]?>(null);
        }

        var swBytes = _solidWorksEngine.GenerateSolidWorksFile(design);
        return Task.FromResult<byte[]?>(swBytes);
    }
}

