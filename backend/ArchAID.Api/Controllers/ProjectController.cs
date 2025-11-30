using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArchAID.Api.Models;
using ArchAID.Api.Services;

namespace ArchAID.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController : ControllerBase
{
    private readonly IProjectMongoService _projectService;
    private readonly ILogger<ProjectController> _logger;

    public ProjectController(IProjectMongoService projectService, ILogger<ProjectController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetAllProjects()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var projects = await _projectService.GetProjectsByOwnerIdAsync(userId);
            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects");
            return StatusCode(500, new { message = "An error occurred while retrieving projects" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(string id)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            // Verify ownership
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (project.OwnerId != userId)
            {
                return Forbid();
            }

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project {ProjectId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the project" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] Project project)
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            project.OwnerId = userId;
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;

            var createdProject = await _projectService.CreateProjectAsync(project);
            return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project");
            return StatusCode(500, new { message = "An error occurred while creating the project" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Project>> UpdateProject(string id, [FromBody] Project project)
    {
        try
        {
            var existingProject = await _projectService.GetProjectByIdAsync(id);
            if (existingProject == null)
            {
                return NotFound();
            }

            // Verify ownership
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (existingProject.OwnerId != userId)
            {
                return Forbid();
            }

            project.Id = existingProject.Id;
            project.OwnerId = existingProject.OwnerId;
            project.UpdatedAt = DateTime.UtcNow;

            var updatedProject = await _projectService.UpdateProjectAsync(id, project);
            return Ok(updatedProject);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the project" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(string id)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            // Verify ownership
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (project.OwnerId != userId)
            {
                return Forbid();
            }

            var deleted = await _projectService.DeleteProjectAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the project" });
        }
    }

    [HttpGet("{projectId}/floors")]
    public async Task<ActionResult<IEnumerable<Floor>>> GetFloors(string projectId)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(projectId);
            if (project == null)
            {
                return NotFound();
            }

            // Verify ownership
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (project.OwnerId != userId)
            {
                return Forbid();
            }

            var floors = await _projectService.GetFloorsByProjectIdAsync(projectId);
            return Ok(floors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting floors for project {ProjectId}", projectId);
            return StatusCode(500, new { message = "An error occurred while retrieving floors" });
        }
    }

    [HttpPost("{projectId}/floors")]
    public async Task<ActionResult<Floor>> AddFloor(string projectId, [FromBody] Floor floor)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(projectId);
            if (project == null)
            {
                return NotFound();
            }

            // Verify ownership
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (project.OwnerId != userId)
            {
                return Forbid();
            }

            var createdFloor = await _projectService.AddFloorToProjectAsync(projectId, floor);
            return CreatedAtAction(nameof(GetFloors), new { projectId }, createdFloor);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding floor to project {ProjectId}", projectId);
            return StatusCode(500, new { message = "An error occurred while adding the floor" });
        }
    }
}

