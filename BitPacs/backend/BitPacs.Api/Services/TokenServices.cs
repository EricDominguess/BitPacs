using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BitPacs.Api.Models;

namespace BitPacs.Api.Services
{
    public class TokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            // 1. Pega a chave secreta do appsettings.json
            var secretKey = _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey não configurada");
            var key = Encoding.ASCII.GetBytes(secretKey);

            // Gera um ID único para este token (para controlar single login)
            var tokenId = Guid.NewGuid().ToString();

            // 2. Define as "Claims" (os dados que vão dentro do Token)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nome),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role), // Importante para saber se é Admin
                new Claim("UnidadeId", user.UnidadeId ?? ""), // Unidades dos usuários
                new Claim("TokenId", tokenId) // ID único do token para validação de single login
            };

            // 3. Configura a assinatura e criptografia
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8), // Token dura 8 horas
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature
                ),
                // Opcional: Definir Emissor e Público se estiver no appsettings
                Issuer = _configuration["JwtSettings:Issuer"],
                Audience = _configuration["JwtSettings:Audience"]
            };

            // 4. Gera a string do Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public string? GetTokenIdFromClaims(System.Security.Claims.ClaimsPrincipal user)
        {
            return user.FindFirst("TokenId")?.Value;
        }
    }
}