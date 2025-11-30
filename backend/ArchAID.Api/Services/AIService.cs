using ArchAID.Api.Models;

namespace ArchAID.Api.Services;

public interface IAIService
{
    Task<LayoutCandidate> GenerateLayoutAsync(Guid projectId, Guid floorId, LayoutGenerationRequest request);
    Task<FloorplanRecognitionResult> RecognizeFloorplanAsync(byte[] imageData, string fileName);
    Task<FurnishingSuggestion> SuggestFurnishingAsync(Guid projectId, Guid floorId, FurnishingRequest request);
}

public class AIService : IAIService
{
    public Task<LayoutCandidate> GenerateLayoutAsync(Guid projectId, Guid floorId, LayoutGenerationRequest request)
    {
        // Mock AI implementation - returns sample layout candidates
        var candidate = new LayoutCandidate
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            FloorId = floorId,
            Score = 85.5,
            Rationale = "Optimized for space efficiency and ergonomics",
            LayoutData = new Dictionary<string, object>
            {
                { "rooms", new[] { "Living Room", "Kitchen", "Bedroom 1", "Bedroom 2" } },
                { "area", 1200 },
                { "efficiency", 0.92 }
            },
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(candidate);
    }

    public Task<FloorplanRecognitionResult> RecognizeFloorplanAsync(byte[] imageData, string fileName)
    {
        // Mock AI implementation - returns sample wall geometry
        var result = new FloorplanRecognitionResult
        {
            Id = Guid.NewGuid(),
            FileName = fileName,
            Walls = new List<WallGeometry>
            {
                new WallGeometry { StartX = 0, StartY = 0, EndX = 1000, EndY = 0, Thickness = 20 },
                new WallGeometry { StartX = 1000, StartY = 0, EndX = 1000, EndY = 800, Thickness = 20 },
                new WallGeometry { StartX = 1000, StartY = 800, EndX = 0, EndY = 800, Thickness = 20 },
                new WallGeometry { StartX = 0, StartY = 800, EndX = 0, EndY = 0, Thickness = 20 }
            },
            Rooms = new List<RoomGeometry>
            {
                new RoomGeometry { X = 100, Y = 100, Width = 400, Height = 300, Type = "Living Room" },
                new RoomGeometry { X = 550, Y = 100, Width = 400, Height = 300, Type = "Kitchen" }
            },
            Confidence = 0.87,
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(result);
    }

    public Task<FurnishingSuggestion> SuggestFurnishingAsync(Guid projectId, Guid floorId, FurnishingRequest request)
    {
        // Mock AI implementation - returns sample furnishing suggestions
        var suggestion = new FurnishingSuggestion
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            FloorId = floorId,
            Style = request.Style,
            SuggestedItems = new List<SuggestedItem>
            {
                new SuggestedItem { AssetId = Guid.NewGuid(), Name = "Modern Sofa", Position = new { X = 200, Y = 150 } },
                new SuggestedItem { AssetId = Guid.NewGuid(), Name = "Coffee Table", Position = new { X = 300, Y = 200 } },
                new SuggestedItem { AssetId = Guid.NewGuid(), Name = "TV Stand", Position = new { X = 400, Y = 100 } }
            },
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(suggestion);
    }
}

