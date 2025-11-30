using ArchAID.Api.Models;

namespace ArchAID.Api.Services;

public interface IProjectService
{
    Task<Project?> GetProjectByIdAsync(Guid projectId);
    Task<IEnumerable<Project>> GetAllProjectsAsync();
    Task<Project> CreateProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(Guid projectId, Project project);
    Task<bool> DeleteProjectAsync(Guid projectId);
    Task<IEnumerable<Floor>> GetFloorsByProjectIdAsync(Guid projectId);
    Task<Floor> AddFloorToProjectAsync(Guid projectId, Floor floor);
}

public class ProjectService : IProjectService
{
    private readonly List<Project> _projects = new();
    
    public Task<Project?> GetProjectByIdAsync(Guid projectId)
    {
        var project = _projects.FirstOrDefault(p => p.Id == projectId);
        return Task.FromResult(project);
    }

    public Task<IEnumerable<Project>> GetAllProjectsAsync()
    {
        return Task.FromResult(_projects.AsEnumerable());
    }

    public Task<Project> CreateProjectAsync(Project project)
    {
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        _projects.Add(project);
        return Task.FromResult(project);
    }

    public Task<Project> UpdateProjectAsync(Guid projectId, Project project)
    {
        var existingProject = _projects.FirstOrDefault(p => p.Id == projectId);
        if (existingProject == null)
        {
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");
        }

        existingProject.Name = project.Name;
        existingProject.Description = project.Description;
        existingProject.UpdatedAt = DateTime.UtcNow;
        
        return Task.FromResult(existingProject);
    }

    public Task<bool> DeleteProjectAsync(Guid projectId)
    {
        var project = _projects.FirstOrDefault(p => p.Id == projectId);
        if (project == null)
        {
            return Task.FromResult(false);
        }

        _projects.Remove(project);
        return Task.FromResult(true);
    }

    public Task<IEnumerable<Floor>> GetFloorsByProjectIdAsync(Guid projectId)
    {
        var project = _projects.FirstOrDefault(p => p.Id == projectId);
        if (project == null)
        {
            return Task.FromResult(Enumerable.Empty<Floor>());
        }

        return Task.FromResult(project.Floors.AsEnumerable());
    }

    public Task<Floor> AddFloorToProjectAsync(Guid projectId, Floor floor)
    {
        var project = _projects.FirstOrDefault(p => p.Id == projectId);
        if (project == null)
        {
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");
        }

        floor.Id = Guid.NewGuid();
        project.Floors.Add(floor);
        return Task.FromResult(floor);
    }
}

