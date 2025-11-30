using MongoDB.Driver;

namespace ArchAID.Api.Services;

public class MongoDbService
{
    private readonly IMongoDatabase _database;

    public MongoDbService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb") 
            ?? "mongodb://localhost:27017";
        var databaseName = configuration["MongoDb:DatabaseName"] ?? "ArchAID";
        
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<T> GetCollection<T>(string collectionName)
    {
        return _database.GetCollection<T>(collectionName);
    }
}

