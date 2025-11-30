using AspNetCore.Identity.MongoDbCore.Models;
using MongoDbGenericRepository.Attributes;

namespace ArchAID.Api.Models;

[CollectionName("Users")]
public class MongoIdentityUser : MongoIdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "HouseOwner"; // HouseOwner, Architect, Vendor, Student, Admin
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[CollectionName("Roles")]
public class MongoIdentityRole : MongoIdentityRole<Guid>
{
}

