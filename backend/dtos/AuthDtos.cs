namespace backend.dtos;

public record RegisterDto(string Email, string Password);

public record LoginDto(string Email, string Password);

public record AuthResultDto(Guid UserId, string Email, long Permissions, string AccessToken);