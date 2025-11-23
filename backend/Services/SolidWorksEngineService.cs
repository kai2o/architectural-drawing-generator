using backend.Models;

namespace backend.Services;

public class SolidWorksEngineService : ISolidWorksEngineService
{
    public byte[] GenerateSolidWorksFile(RoomDesign design, string format = "step")
    {
        // Note: Direct SolidWorks API integration requires SolidWorks to be installed
        // For this implementation, we'll generate a STEP file format which is
        // SolidWorks-compatible and can be imported

        // Generate STEP file content (ISO 10303-21 format)
        var stepContent = GenerateStepFile(design);
        return System.Text.Encoding.UTF8.GetBytes(stepContent);
    }

    private string GenerateStepFile(RoomDesign design)
    {
        var step = new System.Text.StringBuilder();
        step.AppendLine("ISO-10303-21;");
        step.AppendLine("HEADER;");
        step.AppendLine("FILE_DESCRIPTION(('Room Design'), '2;1');");
        step.AppendLine($"FILE_NAME('room_design_{design.Id}.step', '{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ss}', ('System'), ('CAD Engine'), 'VERSION 1.0', 'VERSION 1.0', '');");
        step.AppendLine("FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));");
        step.AppendLine("ENDSEC;");
        step.AppendLine("DATA;");

        int entityId = 1;

        // Generate floor
        step.AppendLine($"#{entityId} = CARTESIAN_POINT('', ({design.Length / 2}, {design.Breadth / 2}, 0.0));");
        entityId++;
        step.AppendLine($"#{entityId} = DIRECTION('', (0.0, 0.0, 1.0));");
        entityId++;
        step.AppendLine($"#{entityId} = DIRECTION('', (1.0, 0.0, 0.0));");
        entityId++;
        step.AppendLine($"#{entityId} = AXIS2_PLACEMENT_3D('', #{entityId - 2}, #{entityId - 1}, #{entityId - 3});");
        entityId++;
        step.AppendLine($"#{entityId} = RECTANGULAR_CLOSED_PROFILE('', #{entityId - 1}, {design.Length}, {design.Breadth});");
        entityId++;
        step.AppendLine($"#{entityId} = EXTRUDED_AREA_SOLID('', #{entityId - 1}, #{entityId - 2}, {design.Height});");

        // Generate walls
        foreach (var wall in design.Walls)
        {
            var wallLength = Math.Sqrt(
                Math.Pow(wall.EndPoint.X - wall.StartPoint.X, 2) +
                Math.Pow(wall.EndPoint.Y - wall.StartPoint.Y, 2)
            );

            entityId++;
            step.AppendLine($"#{entityId} = CARTESIAN_POINT('', ({wall.StartPoint.X}, {wall.StartPoint.Y}, 0.0));");
            entityId++;
            step.AppendLine($"#{entityId} = DIRECTION('', (0.0, 0.0, 1.0));");
            entityId++;
            step.AppendLine($"#{entityId} = DIRECTION('', (1.0, 0.0, 0.0));");
            entityId++;
            step.AppendLine($"#{entityId} = AXIS2_PLACEMENT_3D('', #{entityId - 2}, #{entityId - 1}, #{entityId - 3});");
            entityId++;
            step.AppendLine($"#{entityId} = RECTANGULAR_CLOSED_PROFILE('', #{entityId - 1}, {wallLength}, {wall.Thickness});");
            entityId++;
            step.AppendLine($"#{entityId} = EXTRUDED_AREA_SOLID('', #{entityId - 1}, #{entityId - 2}, {wall.Height});");
        }

        // Generate furniture as boxes
        foreach (var furniture in design.Furniture)
        {
            entityId++;
            step.AppendLine($"#{entityId} = CARTESIAN_POINT('', ({furniture.X + furniture.Width / 2}, {furniture.Y + furniture.Depth / 2}, {furniture.Height / 2}));");
            entityId++;
            step.AppendLine($"#{entityId} = DIRECTION('', (0.0, 0.0, 1.0));");
            entityId++;
            step.AppendLine($"#{entityId} = DIRECTION('', (1.0, 0.0, 0.0));");
            entityId++;
            step.AppendLine($"#{entityId} = AXIS2_PLACEMENT_3D('', #{entityId - 2}, #{entityId - 1}, #{entityId - 3});");
            entityId++;
            step.AppendLine($"#{entityId} = RECTANGULAR_CLOSED_PROFILE('', #{entityId - 1}, {furniture.Width}, {furniture.Depth});");
            entityId++;
            step.AppendLine($"#{entityId} = EXTRUDED_AREA_SOLID('', #{entityId - 1}, #{entityId - 2}, {furniture.Height});");
        }

        step.AppendLine("ENDSEC;");
        step.AppendLine("END-ISO-10303-21;");

        return step.ToString();
    }
}

