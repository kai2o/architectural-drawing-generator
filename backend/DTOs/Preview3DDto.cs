namespace backend.DTOs;

public class Preview3DDto
{
    public List<Vertex3D> Vertices { get; set; } = new();
    public List<Face> Faces { get; set; } = new();
    public List<MeshObject> Objects { get; set; } = new();
}

public class Vertex3D
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }

    public Vertex3D() { }

    public Vertex3D(double x, double y, double z)
    {
        X = x;
        Y = y;
        Z = z;
    }
}

public class Face
{
    public List<int> Indices { get; set; } = new();
}

public class MeshObject
{
    public string Name { get; set; } = string.Empty;
    public List<int> VertexIndices { get; set; } = new();
    public string Type { get; set; } = string.Empty; // "wall", "furniture", "floor", "ceiling"
}

