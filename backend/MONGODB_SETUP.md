# MongoDB Setup Guide for ArchAID

## Installation Options

### Option 1: Local MongoDB Installation

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download for Windows
   - Run the installer

2. **Install MongoDB**
   - Follow the installation wizard
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)

3. **Verify Installation**
   ```powershell
   mongod --version
   mongo --version
   ```

4. **Start MongoDB Service**
   - MongoDB should start automatically as a Windows service
   - Or manually start: `net start MongoDB`

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to you
   - Create cluster

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Update appsettings.json**
   ```json
   "ConnectionStrings": {
     "MongoDb": "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
   }
   ```

## Configuration

### Update appsettings.json

For **Local MongoDB**:
```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb://localhost:27017"
  },
  "MongoDb": {
    "DatabaseName": "ArchAID"
  }
}
```

For **MongoDB Atlas**:
```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
  },
  "MongoDb": {
    "DatabaseName": "ArchAID"
  }
}
```

## Testing the Connection

1. **Start the Backend**
   ```powershell
   cd backend/ArchAID.Api
   dotnet run
   ```

2. **Check Logs**
   - If MongoDB is connected, the application will start successfully
   - If not, you'll see connection errors

3. **Test via Swagger**
   - Navigate to: http://localhost:5165 (or your configured port)
   - Try registering a new user
   - Check MongoDB to see if the user was created

## MongoDB Collections

The application will automatically create these collections:
- **Users** - User accounts and authentication
- **Roles** - User roles
- **Projects** - User projects with floors, walls, and rooms

## Troubleshooting

### Connection Issues

1. **Check MongoDB is running**
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   ```

2. **Check connection string**
   - Verify the connection string in appsettings.json
   - For Atlas, ensure IP whitelist includes your IP (0.0.0.0/0 for development)

3. **Check firewall**
   - Ensure port 27017 is open (for local MongoDB)
   - For Atlas, ensure your IP is whitelisted

### Common Errors

- **"Unable to connect to MongoDB"**: Check if MongoDB service is running
- **"Authentication failed"**: Verify username/password in connection string
- **"Network timeout"**: Check firewall and network settings

## Next Steps

After MongoDB is set up:
1. Run the backend application
2. Register a new user via the API
3. Create a project
4. Verify data is stored in MongoDB

You can use MongoDB Compass (GUI tool) to view your data:
- Download: https://www.mongodb.com/try/download/compass
- Connect to: `mongodb://localhost:27017` (local) or your Atlas connection string

