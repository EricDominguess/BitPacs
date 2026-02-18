using BitPacs.Api.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace BitPacs.Api.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            try
            {
                // Verifica se já existe algum usuário Admin
                var masterExists = context.Users.Any(u => u.Role == "Master");
                
                if (!masterExists)
                {
                    var masterUser = new User
                    {
                        Nome = "Administrador",
                        Email = "master@bitpacs.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                        Role = "Master",
                    };
                    
                    context.Users.Add(masterUser);
                    context.SaveChanges();
                    
                    Console.WriteLine("✅ Usuário Mestre criado com sucesso!");
                    Console.WriteLine($"   Email: {masterUser.Email}");
                    Console.WriteLine("   Senha: Admin@123");
                }
                else
                {
                    Console.WriteLine("ℹ️  Usuário Mestre já existe no banco.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro no DbSeeder: {ex.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");
            }
        }
    }
}
