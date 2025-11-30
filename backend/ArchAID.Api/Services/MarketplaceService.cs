using ArchAID.Api.Models;

namespace ArchAID.Api.Services;

public interface IMarketplaceService
{
    Task<MarketplaceItem?> GetItemByIdAsync(Guid itemId);
    Task<IEnumerable<MarketplaceItem>> GetAllItemsAsync();
    Task<IEnumerable<MarketplaceItem>> GetItemsByVendorAsync(Guid vendorId);
    Task<MarketplaceItem> CreateItemAsync(MarketplaceItem item);
    Task<MarketplaceItem> UpdateItemAsync(Guid itemId, MarketplaceItem item);
    Task<bool> DeleteItemAsync(Guid itemId);
    Task<IEnumerable<Vendor>> GetAllVendorsAsync();
    Task<Vendor> CreateVendorAsync(Vendor vendor);
}

public class MarketplaceService : IMarketplaceService
{
    private readonly List<MarketplaceItem> _items = new();
    private readonly List<Vendor> _vendors = new();
    
    public Task<MarketplaceItem?> GetItemByIdAsync(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        return Task.FromResult(item);
    }

    public Task<IEnumerable<MarketplaceItem>> GetAllItemsAsync()
    {
        return Task.FromResult(_items.AsEnumerable());
    }

    public Task<IEnumerable<MarketplaceItem>> GetItemsByVendorAsync(Guid vendorId)
    {
        var items = _items.Where(i => i.VendorId == vendorId);
        return Task.FromResult(items);
    }

    public Task<MarketplaceItem> CreateItemAsync(MarketplaceItem item)
    {
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;
        _items.Add(item);
        return Task.FromResult(item);
    }

    public Task<MarketplaceItem> UpdateItemAsync(Guid itemId, MarketplaceItem item)
    {
        var existingItem = _items.FirstOrDefault(i => i.Id == itemId);
        if (existingItem == null)
        {
            throw new KeyNotFoundException($"Marketplace item with ID {itemId} not found.");
        }

        existingItem.Name = item.Name;
        existingItem.Description = item.Description;
        existingItem.Price = item.Price;
        existingItem.UpdatedAt = DateTime.UtcNow;
        
        return Task.FromResult(existingItem);
    }

    public Task<bool> DeleteItemAsync(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return Task.FromResult(false);
        }

        _items.Remove(item);
        return Task.FromResult(true);
    }

    public Task<IEnumerable<Vendor>> GetAllVendorsAsync()
    {
        return Task.FromResult(_vendors.AsEnumerable());
    }

    public Task<Vendor> CreateVendorAsync(Vendor vendor)
    {
        vendor.Id = Guid.NewGuid();
        vendor.CreatedAt = DateTime.UtcNow;
        _vendors.Add(vendor);
        return Task.FromResult(vendor);
    }
}

