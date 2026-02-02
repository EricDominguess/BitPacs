using BCrypt.Net;
using BitPacs.Api.Data;
using BitPacs.Api.Models;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // Verifica se o banco existe
        context.Database.EnsureCreated();

        // Atualiza o email do admin antigo se existir (para minúsculo)
        var adminAntigo = context.Users.FirstOrDefault(u => u.Email == "admin@bitpacs.com" || u.Email == "Master@bitpacs.com");
        if (adminAntigo != null && adminAntigo.Email != "master@bitpacs.com")
        {
            adminAntigo.Email = "master@bitpacs.com";
            context.SaveChanges();
            Console.WriteLine("Email do admin atualizado para master@bitpacs.com");
        }

        // Verifica se já existe algum usuário com o email master
        if (!context.Users.Any(u => u.Email == "master@bitpacs.com"))
        {
            var adminSupremo = new User
            {
               Nome = "Admin Sistema",
               Email = "master@bitpacs.com",
               Role = "Master",
               // Aqui está o segredo: Gerar o Hash da senha
               PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123") 
            };

            context.Users.Add(adminSupremo);
            context.SaveChanges();

            Console.WriteLine("Admin usuário criado com sucesso.");
        }
    }
}