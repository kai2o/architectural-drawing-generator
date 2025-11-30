namespace ArchAID.Api.Models;

public class MarketplaceItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid VendorId { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";
    public int Stock { get; set; }
    public string? CadFileUrl { get; set; }
    public string? StepFileUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Vendor
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? Website { get; set; }
    public DateTime CreatedAt { get; set; }
}

