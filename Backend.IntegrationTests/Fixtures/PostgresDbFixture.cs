using backend.data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Backend.IntegrationTests.Fixtures;

public sealed class PostgresDbFixture : IAsyncDisposable
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("testdb")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private bool _started;

    private async Task EnsureStartedAsync()
    {
        if (_started) return;
        await _db.StartAsync();
        _started = true;
    }

    public async Task<AppDbContext> CreateDbContextAsync()
    {
        await EnsureStartedAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_db.GetConnectionString())
            .EnableSensitiveDataLogging()
            .Options;

        var ctx = new AppDbContext(options);

        // simplest isolation:
        await ctx.Database.EnsureDeletedAsync();
        await ctx.Database.MigrateAsync(); 

        return ctx;
    }

    public async ValueTask DisposeAsync()
    {
        if (_started)
            await _db.DisposeAsync();
    }
}