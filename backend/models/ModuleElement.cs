using System.Text.Json;
using backend.models.@base;
using backend.models.enums;

namespace backend.models;

public class ModuleElement : SoftDeletableEntity<Guid>
{
   public Guid ModuleId { get; set; } 
   public Module Module { get; set; }
   
   public int SortOrder { get; set; }
   public ModuleElementType Type { get; set; }
   
   public string? IconKey { get; set; }

   public JsonDocument Options { get; set; } = JsonDocument.Parse("{}");
   
   public double? AssessmentWeight { get; set; }
   public bool MarksPublished { get; set; } = false;
}