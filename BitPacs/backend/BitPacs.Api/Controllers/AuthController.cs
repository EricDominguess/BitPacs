using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BitPacs.Api.Services;
using BitPacs.Api.Models;
using BitPacs.Api.Data;
using System.Security.Claims;

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
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);

            if (user == null)
                return Unauthorized("Usuário inválido.");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("Senha incorreta.");

            var token = _tokenService.GenerateToken(user);

            return Ok(new
            {
                token = token,
                user = new { user.Id, user.Nome, user.Email, user.Role, user.UnidadeId, user.AvatarUrl }
            });
        }

        [HttpGet("users")]
        [Authorize]
        public IActionResult GetUsers()
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Users.AsQueryable();

            if (currentUserRole != "Master")
            {
                query = query.Where(u => u.Role != "Master");
            }

            var users = query
                .Select(u => new { u.Id, u.Nome, u.Email, u.Role, u.UnidadeId, u.AvatarUrl })
                .ToList();

            return Ok(users);
        }

        [HttpGet("users/{id}")]
        [Authorize]
        public IActionResult GetUser(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            return Ok(new { user.Id, user.Nome, user.Email, user.Role, user.UnidadeId, user.AvatarUrl });
        }

        [HttpPost("register")]
        [Authorize]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!CanCreateRole(currentUserRole, request.Role))
                return Forbid("Você não tem permissão para criar este tipo de usuário.");

            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Este e-mail já está cadastrado." });

            var user = new User
            {
                Nome = request.Nome,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                UnidadeId = request.Role != "Master" ? request.UnidadeId : null
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { user.Id, user.Nome, user.Email, user.Role, user.UnidadeId, user.AvatarUrl });
        }

        [HttpPut("users/{id}")]
        [Authorize]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.IsNullOrEmpty(request.Role) && !CanCreateRole(currentUserRole, request.Role))
                return Forbid("Você não tem permissão para definir este tipo de usuário.");

            if (!string.IsNullOrEmpty(request.Nome))
                user.Nome = request.Nome;

            if (!string.IsNullOrEmpty(request.Email))
            {
                if (_context.Users.Any(u => u.Email == request.Email && u.Id != id))
                    return BadRequest(new { message = "Este e-mail já está em uso." });
                user.Email = request.Email;
            }

            if (!string.IsNullOrEmpty(request.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            if (!string.IsNullOrEmpty(request.Role))
                user.Role = request.Role;

            if (request.UnidadeId.HasValue)
                user.UnidadeId = user.Role != "Master" ? request.UnidadeId : null;

            _context.SaveChanges();

            return Ok(new { user.Id, user.Nome, user.Email, user.Role, user.UnidadeId, user.AvatarUrl });
        }

        [HttpDelete("users/{id}")]
        [Authorize]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (currentUserId == id.ToString())
                return BadRequest(new { message = "Você não pode excluir sua própria conta." });

            if (!CanDeleteRole(currentUserRole, user.Role))
                return Forbid("Você não tem permissão para excluir este usuário.");

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "Usuário excluído com sucesso." });
        }

        private bool CanCreateRole(string? creatorRole, string targetRole)
        {
            return creatorRole switch
            {
                "Master" => true,
                "Admin" => targetRole == "Medico" || targetRole == "Enfermeiro",
                _ => false
            };
        }

        private bool CanDeleteRole(string? deleterRole, string targetRole)
        {
            return deleterRole switch
            {
                "Master" => targetRole != "Master",
                "Admin" => targetRole == "Medico" || targetRole == "Enfermeiro",
                _ => false
            };
        }

        [HttpPost("avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Nenhum arquivo enviado." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP." });

            if (file.Length > 2 * 1024 * 1024)
                return BadRequest(new { message = "Arquivo muito grande. Máximo 2MB." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Usuário não identificado.");

            var user = _context.Users.Find(userId);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var oldFileName = Path.GetFileName(user.AvatarUrl);
                var oldFilePath = Path.Combine(uploadsFolder, oldFileName);
                if (System.IO.File.Exists(oldFilePath))
                    System.IO.File.Delete(oldFilePath);
            }

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            user.AvatarUrl = $"/avatars/{fileName}";
            _context.SaveChanges();

            return Ok(new {
                avatarUrl = user.AvatarUrl,
                user = new { user.Id, user.Nome, user.Email, user.Role, user.AvatarUrl }
            });
        }

        [HttpDelete("avatar")]
        [Authorize]
        public IActionResult DeleteAvatar()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Usuário não identificado.");

            var user = _context.Users.Find(userId);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
                var fileName = Path.GetFileName(user.AvatarUrl);
                var filePath = Path.Combine(uploadsFolder, fileName);
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }

            user.AvatarUrl = null;
            _context.SaveChanges();

            return Ok(new { message = "Avatar removido com sucesso." });
        }
    }

    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class RegisterRequest
    {
        public required string Nome { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string Role { get; set; } = "Medico";
        public int? UnidadeId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? Nome { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
        public int? UnidadeId { get; set; }
    }
}
