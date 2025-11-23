using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.DTOs;

public class DesignRequestDto
{
    [Required]
    [Range(0.1, 100, ErrorMessage = "Length must be between 0.1 and 100 meters")]
    public double Length { get; set; }
    
    [Required]
    [Range(0.1, 100, ErrorMessage = "Breadth must be between 0.1 and 100 meters")]
    public double Breadth { get; set; }
    
    [Required]
    [Range(0.1, 10, ErrorMessage = "Height must be between 0.1 and 10 meters")]
    public double Height { get; set; }
    
    [Required]
    public RoomType RoomType { get; set; }
    
    public DesignStyle? Style { get; set; }
    
    [Range(1, 20, ErrorMessage = "Occupants must be between 1 and 20")]
    public int? Occupants { get; set; }
    
    public Dictionary<string, object>? Preferences { get; set; }
}

