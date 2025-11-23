using backend.DTOs;
using backend.Models;

namespace backend.Services;

public interface IDesignService
{
    Task<DesignResponseDto> GenerateDesignAsync(DesignRequestDto request);
    Task<RoomDesign?> GetDesignAsync(Guid id);
    Task<Preview2DDto> GetPreview2DAsync(Guid id);
    Task<Preview3DDto> GetPreview3DAsync(Guid id);
    Task<byte[]?> GetCadFileAsync(Guid id);
    Task<byte[]?> GetSolidWorksFileAsync(Guid id);
}

