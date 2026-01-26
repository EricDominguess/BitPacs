using BitPacs.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace BitPacs.Api.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Garante que o banco foi criado
            context.Database.EnsureCreated();

            // Trava de segurança: Se já tiver qualquer usuário, não faz nada
            if (context.Usuarios.Any())
            {
                return; // O banco já foi semeado
            }

            // Se não tem ninguém, cria o Admin Supremo
            var admin = new Usuario
            {
                Nome = "Administrador Supremo",
                Email = "suporte6@bitpacs.com",
                Cargo = "Admin",
                Ativo = true,
                DataCriacao = DateTime.UtcNow
                SenhaHash = ""
            };

            // Gera o hash da senha
            var hasher = newPasswordHasher<Usuario>();
            admin.SenhaHash = hasher.HashPassword(admin, "Admin@2026!");

            // Salva no banco
            context.Usuarios.Add(admin);
            context.SaveChanges();
        }
    }
}