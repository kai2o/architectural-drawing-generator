using backend.DTOs;
using backend.Models;
using Microsoft.Extensions.Logging;

namespace backend.Services;

public class DesignService : IDesignService
{
    private readonly ILayoutEngineService _layoutEngine;
    private readonly ICadEngineService _cadEngine;
    private readonly ISolidWorksEngineService _solidWorksEngine;
    private readonly ILogger<DesignService> _logger;
    // Use static storage so designs persist across HTTP requests (since service is Scoped)
    private static readonly Dictionary<Guid, RoomDesign> _designStorage = new();

    public DesignService(
        ILayoutEngineService layoutEngine,
        ICadEngineService cadEngine,
        ISolidWorksEngineService solidWorksEngine,
        ILogger<DesignService> logger)
    {
        _layoutEngine = layoutEngine;
        _cadEngine = cadEngine;
        _solidWorksEngine = solidWorksEngine;
        _logger = logger;
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

        lock (_designStorage)
        {
            _designStorage[design.Id] = design;
            _logger.LogInformation("Design stored successfully. ID: {DesignId}, Storage count: {Count}", design.Id, _designStorage.Count);
        }

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
        lock (_designStorage)
        {
            _designStorage.TryGetValue(id, out var design);
            return Task.FromResult(design);
        }
    }

    public Task<Preview2DDto> GetPreview2DAsync(Guid id)
    {
        lock (_designStorage)
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
    }

    public Task<Preview3DDto> GetPreview3DAsync(Guid id)
    {
        lock (_designStorage)
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
    }

    public Task<byte[]?> GetCadFileAsync(Guid id)
    {
        lock (_designStorage)
        {
            _logger.LogInformation("GetCadFileAsync called for ID: {DesignId}, Storage count: {Count}", id, _designStorage.Count);
            _logger.LogInformation("Available design IDs: {Ids}", string.Join(", ", _designStorage.Keys.Select(k => k.ToString())));
            
            if (!_designStorage.TryGetValue(id, out var design))
            {
                _logger.LogWarning("Design not found in storage for ID: {DesignId}", id);
                return Task.FromResult<byte[]?>(null);
            }

            _logger.LogInformation("Design found, generating CAD file for ID: {DesignId}", id);
            try
            {
                var cadBytes = _cadEngine.GenerateDwgFile(design);
                _logger.LogInformation("CAD file generated successfully. Size: {Size} bytes", cadBytes?.Length ?? 0);
                return Task.FromResult<byte[]?>(cadBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating CAD file for design {DesignId}", id);
                return Task.FromResult<byte[]?>(null);
            }
        }
    }

    public Task<byte[]?> GetSolidWorksFileAsync(Guid id)
    {
        lock (_designStorage)
        {
            _logger.LogInformation("GetSolidWorksFileAsync called for ID: {DesignId}, Storage count: {Count}", id, _designStorage.Count);
            _logger.LogInformation("Available design IDs: {Ids}", string.Join(", ", _designStorage.Keys.Select(k => k.ToString())));
            
            if (!_designStorage.TryGetValue(id, out var design))
            {
                _logger.LogWarning("Design not found in storage for ID: {DesignId}", id);
                return Task.FromResult<byte[]?>(null);
            }

            _logger.LogInformation("Design found, generating SolidWorks file for ID: {DesignId}", id);
            try
            {
                var swBytes = _solidWorksEngine.GenerateSolidWorksFile(design);
                _logger.LogInformation("SolidWorks file generated successfully. Size: {Size} bytes", swBytes?.Length ?? 0);
                return Task.FromResult<byte[]?>(swBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SolidWorks file for design {DesignId}", id);
                return Task.FromResult<byte[]?>(null);
            }
        }
    }
}

