using backend.models.@base;

namespace backend.models;

public class Role : SoftDeletableEntity<Guid>
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long Permissions { get; set; }
    public int Rank { get; set; }
    public bool IsSystem { get; set; }
}