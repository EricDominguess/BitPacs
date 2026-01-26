using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BitPacs.Api.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = 'O nome é obrigatório.')]
            public string Nome { get; set; } = string.Empty;
        
        [Required(ErrorMessage = 'O email é obrigatório.')]
        [EmailAddress(ErrorMessage = 'O email fornecido não é válido.')]
        public string Email { get; set; } = string.Empty;

        // O JsonIgnore impede que a senha (mesmo hash) seja enviada de volta para o frontend
        [Required]
        [JsonIgnore]
        public string SenhaHash { get; set; } = string.Empty;

        public string Cargo { get; set; } = "Medico";

        public string? Unidade { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? UltimoLogin { get; set; }
    }
}