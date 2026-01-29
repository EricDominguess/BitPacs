using Microsoft.AspNetCore.Mvc;
using BitPacs.Api.Services;
using BitPacs.Api.Models;
using BitPacs.Api.Data;

namespace BitPacs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(AppDbContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // 1. Busca usuário
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);

            if (user == null)
                return Unauthorized("Usuário inválido.");

            // 2. Verifica senha (Hashes)
            // Certifique-se de ter o pacote BCrypt.Net-Next instalado
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("Senha incorreta.");

            // 3. Gera Token
            var token = _tokenService.GenerateToken(user);

            // 4. Retorna
            return Ok(new
            {
                token = token,
                user = new { user.Id, user.Nome, user.Email, user.Role }
            });
        }
    }

    // Classe simples para receber o JSON do React
    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}