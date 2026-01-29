using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BitPacs.Api.Data;
using BitPacs.Api.Services;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

Env.Load(); // Carrega as variáveis do .env

// Pegamos as variáveis (com valores padrão caso falhe)
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "bitpacs_db";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? "senha_padrao";

// Montamos a string de conexão manualmente
var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};User Id={dbUser};Password={dbPass};";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)); // Conectando ao Postgres

// Registra o serviço que gera os tokens (TokenService.cs)
builder.Services.AddScoped<TokenService>();

// Pega a chave secreta do .env
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "chave_fallback_para_dev";
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false; // Em desenvolvimento (localhost) pode ser false
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"]
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // A porta do seu Front React
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // Esta linha cria o Admin se ele não existir
        DbSeeder.Seed(context); 
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao criar usuário Admin: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 1º Libera o acesso do React
app.UseCors("AllowReact");

// 2º Verifica quem é o usuário (Token válido?)
app.UseAuthentication();

// 3º Verifica o que ele pode fazer (Permissões)
app.UseAuthorization();

app.MapControllers();

app.Run();