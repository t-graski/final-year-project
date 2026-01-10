using backend.dtos;

namespace backend.services.interfaces;

public interface IAdminUserService
{
    Task<IReadOnlyList<AdminUserListItemDto>> ListAsync(string? q, int limit = 50, int offset = 0);
    Task<AdminUserListItemDto> GetAsync(Guid userId);

    Task DeleteAsync(Guid userId);
}