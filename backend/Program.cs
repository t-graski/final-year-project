using System.Text;
using backend.auth;
using backend.data;
using backend.middleware;
using backend.services.implementations;
using backend.services.interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

static byte[] GetKeyBytes(string key)
{
    try
    {
        return Convert.FromBase64String(key);
    }
    catch (FormatException)
    {
        return Encoding.UTF8.GetBytes(key);
    }
}

var jwt = builder.Configuration.GetSection("Jwt");
var rawKey = jwt["Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");
var keyBytes = GetKeyBytes(rawKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var auth = ctx.Request.Headers.Authorization.ToString();
                Console.WriteLine($"AUTH HEADER RAW (event): `{auth}`");

                // Let the framework parse the bearer token normally.
                // Only log a quick sanity check if a bearer-like value exists.
                const string bearerPrefix = "Bearer ";
                if (!string.IsNullOrWhiteSpace(auth) && auth.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
                {
                    var token = auth.Substring(bearerPrefix.Length).Trim();

                    // Sanity check: header must be Base64Url decodable
                    var firstDot = token.IndexOf('.');
                    if (firstDot > 0)
                    {
                        var headerSegment = token.Substring(0, firstDot);
                        try
                        {
                            _ = Base64UrlEncoder.DecodeBytes(headerSegment);
                            Console.WriteLine("JWT HEADER BASE64URL: OK");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("JWT HEADER BASE64URL: FAIL - " + ex.Message);
                        }
                    }
                }

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine("JWT AUTH FAILED: " + ctx.Exception);
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine("JWT CHALLENGE: " + ctx.Error + " - " + ctx.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

// Log what actually arrives from Postman
app.Use(async (ctx, next) =>
{
    var auth = ctx.Request.Headers.Authorization.ToString();
    Console.WriteLine($"AUTH HEADER RAW: `{auth}`");
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<DbActorMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
