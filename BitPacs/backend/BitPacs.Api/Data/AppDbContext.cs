using Microsoft.EntityFrameworkCore;
using BitPacs.Api.Models; // Ajuste para o namespace correto do seu User

namespace BitPacs.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // O erro provavelmente estava aqui nesta linha:
        public DbSet<User> Users { get; set; }
        
        // Logs de visualização e download de estudos
        public DbSet<StudyLog> StudyLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuração do relacionamento User -> StudyLogs
            modelBuilder.Entity<StudyLog>()
                .HasOne(sl => sl.User)
                .WithMany()
                .HasForeignKey(sl => sl.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Índices para melhorar performance das queries
            modelBuilder.Entity<StudyLog>()
                .HasIndex(sl => sl.UserId);

            modelBuilder.Entity<StudyLog>()
                .HasIndex(sl => sl.Timestamp);
        }
    }
}