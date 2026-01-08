using backend.data;
using backend.middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

app.UseHttpsRedirection();

builder.Services.AddControllers(opts => { opts.Filters.Add<ValidationResponseFilter>(); });

app.UseMiddleware<ActorContextMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers();
app.Run();