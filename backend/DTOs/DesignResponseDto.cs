using backend.Models;

namespace backend.DTOs;

public class DesignResponseDto
{
    public Guid Id { get; set; }
    public RoomDesign Design { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

