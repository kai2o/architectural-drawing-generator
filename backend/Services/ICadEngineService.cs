namespace backend.Services;

public interface ICadEngineService
{
    byte[] GenerateDwgFile(Models.RoomDesign design);
}

