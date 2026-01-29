using BCrypt.Net;
using BitPacs.Api.Data;
using BitPacs.Api.Models;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // Verifica se o banco existe
        context.Database.EnsureCreated();

        // Verifica se já existe algum usuário com esse email
        if (!context.Users.Any(u => u.Email == "admin@bitpacs.com"))
        {
            var adminSupremo = new User
            {
               Nome = "Admin Sistema",
               Email = "admin@bitpacs.com",
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