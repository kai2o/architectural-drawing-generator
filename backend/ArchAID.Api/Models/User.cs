using Microsoft.AspNetCore.Identity;

namespace ArchAID.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "HouseOwner"; // HouseOwner, Architect, Vendor, Student, Admin
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

