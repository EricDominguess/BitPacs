using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BitPacs.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // Nunca salve a senha, salve o Hash!
        public string Role { get; set; } = "Admin"; // Para diferenciar poderes depois
    }
}