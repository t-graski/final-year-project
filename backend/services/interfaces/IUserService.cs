using backend.dtos;

namespace backend.services.interfaces;

public interface IUserService
{
    Task<AuthResultDto> RegisterAsync(RegisterDto dto);
    Task<AuthResultDto> LoginAsync(LoginDto dto);
}