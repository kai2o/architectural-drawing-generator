using ArchAID.Api.Models;

namespace ArchAID.Api.Services;

public interface IAssetService
{
    Task<Asset?> GetAssetByIdAsync(Guid assetId);
    Task<IEnumerable<Asset>> GetAllAssetsAsync();
    Task<Asset> CreateAssetAsync(Asset asset);
    Task<Asset> UpdateAssetAsync(Guid assetId, Asset asset);
    Task<bool> DeleteAssetAsync(Guid assetId);
    Task<IEnumerable<Asset>> GetAssetsByCategoryAsync(string category);
}

public class AssetService : IAssetService
{
    private readonly List<Asset> _assets = new();
    
    public Task<Asset?> GetAssetByIdAsync(Guid assetId)
    {
        var asset = _assets.FirstOrDefault(a => a.Id == assetId);
        return Task.FromResult(asset);
    }

    public Task<IEnumerable<Asset>> GetAllAssetsAsync()
    {
        return Task.FromResult(_assets.AsEnumerable());
    }

    public Task<Asset> CreateAssetAsync(Asset asset)
    {
        asset.Id = Guid.NewGuid();
        asset.CreatedAt = DateTime.UtcNow;
        _assets.Add(asset);
        return Task.FromResult(asset);
    }

    public Task<Asset> UpdateAssetAsync(Guid assetId, Asset asset)
    {
        var existingAsset = _assets.FirstOrDefault(a => a.Id == assetId);
        if (existingAsset == null)
        {
            throw new KeyNotFoundException($"Asset with ID {assetId} not found.");
        }

        existingAsset.Name = asset.Name;
        existingAsset.Description = asset.Description;
        existingAsset.Category = asset.Category;
        existingAsset.UpdatedAt = DateTime.UtcNow;
        
        return Task.FromResult(existingAsset);
    }

    public Task<bool> DeleteAssetAsync(Guid assetId)
    {
        var asset = _assets.FirstOrDefault(a => a.Id == assetId);
        if (asset == null)
        {
            return Task.FromResult(false);
        }

        _assets.Remove(asset);
        return Task.FromResult(true);
    }

    public Task<IEnumerable<Asset>> GetAssetsByCategoryAsync(string category)
    {
        var assets = _assets.Where(a => a.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(assets);
    }
}

