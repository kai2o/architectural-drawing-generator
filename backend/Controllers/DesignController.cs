using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DesignController : ControllerBase
{
    private readonly IDesignService _designService;
    private readonly ILogger<DesignController> _logger;

    public DesignController(IDesignService designService, ILogger<DesignController> logger)
    {
        _designService = designService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a new room design based on provided dimensions and preferences
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(DesignResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DesignResponseDto>> GenerateDesign([FromBody] DesignRequestDto request)
    {
        try
        {
            // Log the received request for debugging
            _logger.LogInformation("Received design request: Length={Length}, Breadth={Breadth}, Height={Height}, RoomType={RoomType}, Style={Style}, Occupants={Occupants}",
                request?.Length, request?.Breadth, request?.Height, request?.RoomType, request?.Style, request?.Occupants);

            if (request == null)
            {
                _logger.LogWarning("Request body is null");
                return BadRequest(new { message = "Request body is required" });
            }

            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                    .ToList();
                
                _logger.LogWarning("Model validation failed: {Errors}", string.Join(", ", errors));
                return BadRequest(new { message = "Validation failed", errors = errors });
            }

            if (request.Length <= 0 || request.Breadth <= 0 || request.Height <= 0)
            {
                return BadRequest(new { message = "Length, breadth, and height must be greater than 0" });
            }

            var response = await _designService.GenerateDesignAsync(request);
            _logger.LogInformation("Design generated with ID: {DesignId}", response.Id);
            _logger.LogInformation("Returning response with Design containing {WallCount} walls and {FurnitureCount} furniture items", 
                response.Design?.Walls?.Count ?? 0, 
                response.Design?.Furniture?.Count ?? 0);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating design");
            return StatusCode(500, new { message = "An error occurred while generating the design", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a 2D preview of the design
    /// </summary>
    [HttpGet("{id}/preview/2d")]
    [ProducesResponseType(typeof(Preview2DDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Preview2DDto>> GetPreview2D(Guid id)
    {
        var preview = await _designService.GetPreview2DAsync(id);
        if (preview == null)
        {
            return NotFound($"Design with ID {id} not found");
        }
        return Ok(preview);
    }

    /// <summary>
    /// Get a 3D preview of the design
    /// </summary>
    [HttpGet("{id}/preview/3d")]
    [ProducesResponseType(typeof(Preview3DDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Preview3DDto>> GetPreview3D(Guid id)
    {
        var preview = await _designService.GetPreview3DAsync(id);
        if (preview == null)
        {
            return NotFound($"Design with ID {id} not found");
        }
        return Ok(preview);
    }

    /// <summary>
    /// Download the design as a CAD (.dwg) file
    /// </summary>
    [HttpGet("{id}/download/cad")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadCad(Guid id)
    {
        var cadBytes = await _designService.GetCadFileAsync(id);
        if (cadBytes == null)
        {
            return NotFound($"Design with ID {id} not found");
        }

        return File(cadBytes, "application/acad", $"design_{id}.dwg");
    }

    /// <summary>
    /// Download the design as a SolidWorks (.step) file
    /// </summary>
    [HttpGet("{id}/download/solidworks")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadSolidWorks(Guid id)
    {
        var swBytes = await _designService.GetSolidWorksFileAsync(id);
        if (swBytes == null)
        {
            return NotFound($"Design with ID {id} not found");
        }

        return File(swBytes, "application/step", $"design_{id}.step");
    }

    /// <summary>
    /// Get design details by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Models.RoomDesign), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Models.RoomDesign>> GetDesign(Guid id)
    {
        var design = await _designService.GetDesignAsync(id);
        if (design == null)
        {
            return NotFound($"Design with ID {id} not found");
        }
        return Ok(design);
    }
}

