using BitPacs.Api.Models;
using BCrypt.Net; // Certifique-se que o pacote BCrypt.Net-Next está instalado
using Microsoft.EntityFrameworkCore;

namespace BitPacs.Api.Data
{
    public static class DbInitializer
    {
        public static void Seed(AppDbContext context)
        {
            // Garante que o banco existe
            context.Database.EnsureCreated();

            // Adiciona a coluna AvatarUrl se não existir
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'Users' AND column_name = 'AvatarUrl'
                        ) THEN 
                            ALTER TABLE ""Users"" ADD COLUMN ""AvatarUrl"" text;
                        END IF; 
                    END $$;
                ");
            }
            catch
            {
                // Ignora se a coluna já existe
            }

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