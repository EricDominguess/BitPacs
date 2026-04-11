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
        
        // Laudos/Relatórios anexados aos estudos
        public DbSet<Report> Reports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuração do relacionamento User -> StudyLogs
            modelBuilder.Entity<StudyLog>()
                .HasOne(sl => sl.User)
                .WithMany()
                .HasForeignKey(sl => sl.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ CONFIGURAÇÃO EXPLÍCITA DE LIMITES DE TAMANHO PARA StudyLog
            // Garante que o banco de dados respeita esses limites
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.ActionType)
                .HasMaxLength(50)
                .IsRequired();
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.StudyId)
                .HasMaxLength(512)
                .IsRequired();
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.StudyInstanceUID)
                .HasMaxLength(512);
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.PatientName)
                .HasMaxLength(256);
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.StudyDescription)
                .HasMaxLength(512);
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.Modality)
                .HasMaxLength(50);
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.UnidadeNome)
                .HasMaxLength(100);
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.IpAddress)
                .HasMaxLength(45); // Espaço para IPv6 (2001:0db8:85a3:0000:0000:8a2e:0370:7334)
            
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.TargetUserName)
                .HasMaxLength(256);
            
            // ⚠️ CRÍTICO: Campo Details pode conter URLs de integração com PatientID
            // Exemplo: "Formato: PDF | IntegrationURL: http://system.com?patient=12410"
            modelBuilder.Entity<StudyLog>()
                .Property(sl => sl.Details)
                .HasMaxLength(1024)
                .HasColumnType("varchar(1024)"); // Força VARCHAR explícito, não TEXT

            // Índices para melhorar performance das queries
            modelBuilder.Entity<StudyLog>()
                .HasIndex(sl => sl.UserId);

            modelBuilder.Entity<StudyLog>()
                .HasIndex(sl => sl.Timestamp);

            // ✅ CONFIGURAÇÃO DA TABELA REPORT
            modelBuilder.Entity<Report>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Report>()
                .Property(r => r.StudyId)
                .HasMaxLength(512)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.StudyInstanceUID)
                .HasMaxLength(512)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.PatientName)
                .HasMaxLength(256)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.FileName)
                .HasMaxLength(512)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.FilePath)
                .HasMaxLength(1024)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.UnidadeNome)
                .HasMaxLength(100)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.Status)
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<Report>()
                .Property(r => r.DeletedByUserName)
                .HasMaxLength(256);

            // Índices para melhorar performance
            modelBuilder.Entity<Report>()
                .HasIndex(r => r.StudyId);

            modelBuilder.Entity<Report>()
                .HasIndex(r => r.UnidadeNome);

            modelBuilder.Entity<Report>()
                .HasIndex(r => r.Status);
        }
    }
}