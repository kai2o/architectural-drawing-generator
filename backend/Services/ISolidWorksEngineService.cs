namespace backend.Services;

public interface ISolidWorksEngineService
{
    byte[] GenerateSolidWorksFile(Models.RoomDesign design, string format = "step");
}

