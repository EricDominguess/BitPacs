using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BitPacs.Api.Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [Column("Name")]
        public string Nome { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = "Medico";
        
        // ✅ Agora é string com o slug da unidade (ex: "guarapuava", "riobranco")
        // Rode a migration: ALTER TABLE "Users" ALTER COLUMN "UnidadeId" TYPE VARCHAR(50);
        public string? UnidadeId { get; set; }
        
        public string? AvatarUrl { get; set; }
        
        // Para controlar single login
        public string? LastLoginTokenId { get; set; }
        public DateTime? LastLoginAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
    }
}