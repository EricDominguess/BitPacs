using BitPacs.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BitPacs.Api.Data
{
    public class AppDbContext : DbContext 
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }

        // Aqui podemos configurar as regras especiais do banco se precisar no futuro
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Garante que o email seja único no banco
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // SEEDING DO ADMIN
            var hasher = new PasswordHasher<Usuario>();

            modelBuilder.Entity<Usuario>().HasData(
                new Usuario
                {
                    
                }
            )
        }
    }
}