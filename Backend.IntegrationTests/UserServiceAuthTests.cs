using backend.data;
using backend.dtos;
using Backend.IntegrationTests.Fakes;
using Backend.IntegrationTests.Fixtures;
using backend.models.@base;
using backend.services.implementations;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;


namespace Backend.IntegrationTests;

public class UserServiceAuthTests(PostgresDbFixture fx) : IClassFixture<PostgresDbFixture>
{
    private UserService CreateSut(AppDbContext db)
        => new UserService(db, new FakeTokenService(), new FakeCurrentUser() { IsAuthenticated = false });

    [Fact]
    public async Task RegisterAsync_creates_user_role_and_student_when_role_student()
    {
        await using var db = await fx.CreateDbContextAsync();
        var sut = CreateSut(db);

        const string email = "test@example.com";

        var dto = new RegisterDto(email, "Test123!?", "Tobias", "Graski", new DateOnly(2000, 1, 1),
            SystemRole.Student);

        var res = await sut.RegisterAsync(dto);

        res.Email.Should().Be(email);
        res.AccessToken.Should().StartWith("TEST_TOKEN_FOR");

        var user = await db.Users.SingleAsync(u => u.Email == email, TestContext.Current.CancellationToken);

        user.IsActive.Should().BeTrue();
        user.PasswordHash.Should().NotBeNullOrWhiteSpace();
        user.PasswordHash.Should().NotBe(dto.Password);

        var role = await db.UserRoles.SingleAsync(r => r.UserId == user.Id, TestContext.Current.CancellationToken);

        role.Role.Should().Be(SystemRole.Student);

        var student = await db.Students.SingleAsync(s => s.UserId == user.Id, TestContext.Current.CancellationToken);

        student.StudentNumber.Should().NotBeNullOrWhiteSpace();

        (await db.Staff.AnyAsync(s => s.UserId == user.Id, TestContext.Current.CancellationToken))
            .Should().BeFalse();
    }

    [Fact]
    public async Task RegisterAsync_creates_staff_when_role_staff()
    {
        await using var db = await fx.CreateDbContextAsync();
        var sut = CreateSut(db);

        const string email = "staff@example.com";

        var dto = new RegisterDto(email, "Test123!?", "John", "Doe", new DateOnly(2000, 1, 1), SystemRole.Staff);

        await sut.RegisterAsync(dto);

        var user = await db.Users.SingleAsync(u => u.Email == email, TestContext.Current.CancellationToken);
        var role = await db.UserRoles.SingleAsync(r => r.UserId == user.Id, TestContext.Current.CancellationToken);

        role.Role.Should().Be(SystemRole.Staff);

        var staff = await db.Staff.SingleAsync(s => s.UserId == user.Id, TestContext.Current.CancellationToken);
        staff.StaffNumber.Should().NotBeNullOrWhiteSpace();
        staff.Department.Should().Be("Unassigned");

        (await db.Students.AnyAsync(s => s.UserId == user.Id, TestContext.Current.CancellationToken))
            .Should().BeFalse();
    }
}