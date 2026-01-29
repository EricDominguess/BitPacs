using BitPacs.Api.Models;
using BCrypt.Net; // Certifique-se que o pacote BCrypt.Net-Next está instalado

namespace BitPacs.Api.Data
{
    public static class DbInitializer
    {
        public static void Seed(AppDbContext context)
        {
            // Garante que o banco existe
            context.Database.EnsureCreated();

            // Verifica se já tem usuários
            if (context.Users.Any())
            {
                return; // O banco já foi semeado
            }

            // Cria o Admin Supremo
            var adminUser = new User
            {
                Nome = "Admin Supremo",          // <--- PRECISE DESTA VÍRGULA
                Email = "admin@bitpacs.com",     // <--- PRECISE DESTA VÍRGULA
                Role = "Master",                 // <--- PRECISE DESTA VÍRGULA
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123") // A última linha não precisa
            };

            context.Users.Add(adminUser);
            context.SaveChanges();
        }
    }
}