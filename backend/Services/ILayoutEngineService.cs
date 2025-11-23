using backend.Models;

namespace backend.Services;

public interface ILayoutEngineService
{
    RoomDesign GenerateLayout(double length, double breadth, double height, RoomType roomType, DesignStyle? style, int? occupants);
}

