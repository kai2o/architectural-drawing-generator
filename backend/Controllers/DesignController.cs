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
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadCad(Guid id)
    {
        try
        {
            _logger.LogInformation("Download CAD file requested for design ID: {DesignId}", id);
            var cadBytes = await _designService.GetCadFileAsync(id);
            if (cadBytes == null || cadBytes.Length == 0)
            {
                _logger.LogWarning("CAD file not found or empty for design ID: {DesignId}", id);
                return NotFound(new { message = "Design not found or CAD file could not be generated", designId = id });
            }

            _logger.LogInformation("CAD file generated successfully for design ID: {DesignId}, size: {Size} bytes", id, cadBytes.Length);
            
            // Return as DXF file (netDxf generates DXF format)
            // AutoCAD can open DXF files - using .dxf extension for accuracy
            // MIME type: application/dxf or image/vnd.dxf both work, but application/dxf is more standard
            return File(cadBytes, "application/dxf", $"design_{id}.dxf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating CAD file for design ID: {DesignId}", id);
            return StatusCode(500, new { message = "An error occurred while generating the CAD file", error = ex.Message });
        }
    }

    /// <summary>
    /// Download the design as a SolidWorks (.step) file
    /// </summary>
    [HttpGet("{id}/download/solidworks")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DownloadSolidWorks(Guid id)
    {
        try
        {
            _logger.LogInformation("Download SolidWorks file requested for design ID: {DesignId}", id);
            var swBytes = await _designService.GetSolidWorksFileAsync(id);
            if (swBytes == null || swBytes.Length == 0)
            {
                _logger.LogWarning("SolidWorks file not found or empty for design ID: {DesignId}", id);
                return NotFound(new { message = "Design not found or SolidWorks file could not be generated", designId = id });
            }

            _logger.LogInformation("SolidWorks file generated successfully for design ID: {DesignId}, size: {Size} bytes", id, swBytes.Length);
            return File(swBytes, "application/step", $"design_{id}.step");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating SolidWorks file for design ID: {DesignId}", id);
            return StatusCode(500, new { message = "An error occurred while generating the SolidWorks file", error = ex.Message });
        }
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

