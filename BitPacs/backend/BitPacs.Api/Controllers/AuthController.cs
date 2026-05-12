using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BitPacs.Api.Services;
using BitPacs.Api.Models;
using BitPacs.Api.Data;
using System.Collections.Generic;
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

            // Gera token e obtém o TokenId
            var tokenResult = _tokenService.GenerateToken(user);

            // Atualiza no banco o novo TokenId para invalidar tokens antigos
            user.LastLoginTokenId = tokenResult.TokenId;
            user.LastLoginAt = DateTime.UtcNow;
            _context.SaveChanges();

            var normalizedRole = NormalizeRole(user.Role);

            return Ok(new
            {
                token = tokenResult.Token,
                user = new { user.Id, user.Nome, user.Email, Role = normalizedRole, user.UnidadeId, user.AvatarUrl }
            });
        }

        [HttpGet("users")]
        [Authorize]
        public IActionResult GetUsers()
        {
            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var currentUserUnidade = User.FindFirst("UnidadeId")?.Value;
            var query = _context.Users.AsQueryable();

            if (currentUserRole == "Master")
            {
                // Master vê todos os usuários
            }
            else if (currentUserRole == "AdminGlobal")
            {
                // Admin global vê todos exceto Master
                query = query.Where(u => u.Role != "Master");
            }
            else if (currentUserRole == "AdminLocal")
            {
                // Admin local vê apenas usuários da sua unidade (exceto Masters e Admins Globais)
                query = query.Where(u => u.Role != "Master" && u.Role != "AdminGlobal" && u.UnidadeId == currentUserUnidade);
            }
            else
            {
                // Outros roles não deveriam acessar esta rota, mas por segurança retorna vazio
                return Ok(new List<object>());
            }

            var users = query
                .Select(u => new { u.Id, u.Nome, u.Email, u.Role, u.UnidadeId, u.AvatarUrl })
                .ToList()
                .Select(u => new { u.Id, u.Nome, u.Email, Role = NormalizeRole(u.Role), u.UnidadeId, u.AvatarUrl })
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

            return Ok(new { user.Id, user.Nome, user.Email, Role = NormalizeRole(user.Role), user.UnidadeId, user.AvatarUrl });
        }

        [HttpPost("register")]
        [Authorize]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var requestedRole = NormalizeRole(request.Role);

            if (!CanCreateRole(currentUserRole, requestedRole))
                return Forbid("Você não tem permissão para criar este tipo de usuário.");

            if (requestedRole != "Master" && requestedRole != "AdminGlobal" && string.IsNullOrWhiteSpace(request.UnidadeId))
                return BadRequest(new { message = "Unidade é obrigatória para este tipo de usuário." });

            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Este e-mail já está cadastrado." });

            var user = new User
            {
                Nome = request.Nome,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = requestedRole,
                // ✅ UnidadeId agora é string diretamente (ex: "guarapuava")
                UnidadeId = requestedRole == "Master" || requestedRole == "AdminGlobal" ? null : request.UnidadeId
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            // Registrar log de criação de usuário
            var creatorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(creatorIdClaim) && int.TryParse(creatorIdClaim, out int creatorId))
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var log = new StudyLog
                {
                    UserId = creatorId,
                    ActionType = "USER_CREATE",
                    StudyId = "",
                    TargetUserId = user.Id,
                    TargetUserName = user.Nome,
                    Details = $"Criou usuário {user.Nome} ({user.Email}) com função {user.Role}",
                    UnidadeNome = ResolveUnitLabel(user.UnidadeId),
                    Timestamp = DateTime.UtcNow.AddHours(-3),
                    IpAddress = ipAddress
                };
                _context.StudyLogs.Add(log);
                _context.SaveChanges();
            }

            return Ok(new { user.Id, user.Nome, user.Email, Role = NormalizeRole(user.Role), user.UnidadeId, user.AvatarUrl });
        }

        [HttpPut("users/{id}")]
        [Authorize]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(currentUserIdClaim, out int currentUserId);

            var requestedRole = string.IsNullOrEmpty(request.Role) ? null : NormalizeRole(request.Role);

            // Só valida permissão de role se estiver tentando MUDAR o role (não apenas manter o atual)
            if (!string.IsNullOrEmpty(request.Role) && requestedRole != NormalizeRole(user.Role) && !CanCreateRole(currentUserRole, requestedRole!))
                return Forbid("Você não tem permissão para definir este tipo de usuário.");

            bool passwordChanged = !string.IsNullOrEmpty(request.Password);

            if (!string.IsNullOrEmpty(request.Nome))
                user.Nome = request.Nome;

            if (!string.IsNullOrEmpty(request.Email))
            {
                if (_context.Users.Any(u => u.Email == request.Email && u.Id != id))
                    return BadRequest(new { message = "Este e-mail já está em uso." });
                user.Email = request.Email;
            }

            if (passwordChanged)
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            if (!string.IsNullOrEmpty(request.Role))
                user.Role = requestedRole!;

            // ✅ UnidadeId agora é string — sem parseInt, sem conversão
            if (request.UnidadeId != null)
                user.UnidadeId = user.Role == "Master" || user.Role == "AdminGlobal" ? null : request.UnidadeId;

            _context.SaveChanges();

            // Registrar log de mudança de senha
            if (passwordChanged && currentUserId > 0)
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var isSelfChange = currentUserId == id;
                var log = new StudyLog
                {
                    UserId = currentUserId,
                    ActionType = isSelfChange ? "PASSWORD_CHANGE" : "PASSWORD_CHANGE_OTHER",
                    StudyId = "",
                    TargetUserId = id,
                    TargetUserName = user.Nome,
                    Details = isSelfChange 
                        ? "Alterou sua própria senha" 
                        : $"Alterou a senha do usuário {user.Nome} ({user.Email})",
                    UnidadeNome = ResolveUnitLabel(user.UnidadeId),
                    Timestamp = DateTime.UtcNow.AddHours(-3),
                    IpAddress = ipAddress
                };
                _context.StudyLogs.Add(log);
                _context.SaveChanges();
            }

            return Ok(new { user.Id, user.Nome, user.Email, Role = NormalizeRole(user.Role), user.UnidadeId, user.AvatarUrl });
        }

        [HttpDelete("users/{id}")]
        [Authorize]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(currentUserIdClaim, out int currentUserId);

            if (currentUserIdClaim == id.ToString())
                return BadRequest(new { message = "Você não pode excluir sua própria conta." });

            if (!CanDeleteRole(currentUserRole, NormalizeRole(user.Role)))
                return Forbid("Você não tem permissão para excluir este usuário.");

            // Guardar dados do usuário antes de deletar para o log
            var deletedUserName = user.Nome;
            var deletedUserEmail = user.Email;
            var deletedUserRole = NormalizeRole(user.Role);
            var deletedUserUnitId = user.UnidadeId;

            _context.Users.Remove(user);
            _context.SaveChanges();

            // Registrar log de exclusão de usuário
            if (currentUserId > 0)
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var log = new StudyLog
                {
                    UserId = currentUserId,
                    ActionType = "USER_DELETE",
                    StudyId = "",
                    TargetUserId = id,
                    TargetUserName = deletedUserName,
                    Details = $"Excluiu usuário {deletedUserName} ({deletedUserEmail}) com função {deletedUserRole}",
                    UnidadeNome = ResolveUnitLabel(deletedUserUnitId),
                    Timestamp = DateTime.UtcNow.AddHours(-3),
                    IpAddress = ipAddress
                };
                _context.StudyLogs.Add(log);
                _context.SaveChanges();
            }

            return Ok(new { message = "Usuário excluído com sucesso." });
        }

        private bool CanCreateRole(string? creatorRole, string targetRole)
        {
            return creatorRole switch
            {
                "Master" => true,
                "AdminGlobal" => targetRole == "AdminLocal" || targetRole == "Medico" || targetRole == "Enfermeiro",
                "AdminLocal" => targetRole == "Medico" || targetRole == "Enfermeiro",
                _ => false
            };
        }

        private bool CanDeleteRole(string? deleterRole, string targetRole)
        {
            return deleterRole switch
            {
                "Master" => targetRole != "Master",
                "AdminGlobal" => targetRole == "AdminLocal" || targetRole == "Medico" || targetRole == "Enfermeiro",
                "AdminLocal" => targetRole == "Medico" || targetRole == "Enfermeiro",
                _ => false
            };
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return string.Empty;
            return role == "Admin" ? "AdminLocal" : role;
        }

        private static readonly Dictionary<string, string> UnitLabels = new(StringComparer.OrdinalIgnoreCase)
        {
            { "1", "Rio Branco" },
            { "2", "Foz do Iguaçu" },
            { "3", "Fazenda" },
            { "4", "Faxinal" },
            { "5", "Santa Mariana" },
            { "6", "Guarapuava" },
            { "7", "Carlópolis" },
            { "8", "Arapoti" },
            { "riobranco", "Rio Branco" },
            { "rio branco", "Rio Branco" },
            { "foziguacu", "Foz do Iguaçu" },
            { "foz do iguaçu", "Foz do Iguaçu" },
            { "foz do iguacu", "Foz do Iguaçu" },
            { "fazenda", "Fazenda" },
            { "faxinal", "Faxinal" },
            { "santamariana", "Santa Mariana" },
            { "santa mariana", "Santa Mariana" },
            { "guarapuava", "Guarapuava" },
            { "carlopolis", "Carlópolis" },
            { "carlópolis", "Carlópolis" },
            { "arapoti", "Arapoti" }
        };

        private static string ResolveUnitLabel(string? unidadeId)
        {
            if (string.IsNullOrWhiteSpace(unidadeId)) return "Unidade Geral";
            var trimmed = unidadeId.Trim();
            if (UnitLabels.TryGetValue(trimmed, out var label)) return label;

            var normalized = trimmed.ToLowerInvariant();
            var withoutPrefix = normalized
                .Replace("cis - unidade de ", string.Empty)
                .Replace("cis - ", string.Empty)
                .Replace("unidade de ", string.Empty)
                .Replace("unidade ", string.Empty)
                .Replace("cis ", string.Empty)
                .Trim();

            if (UnitLabels.TryGetValue(withoutPrefix, out label)) return label;
            return trimmed;
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

        [HttpPost("validate-token")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tokenIdClaim = User.FindFirst("TokenId")?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { valid = false, message = "Token inválido" });

                var user = _context.Users.Find(userId);
                if (user == null)
                    return Unauthorized(new { valid = false, message = "Usuário não encontrado" });

                // Verifica se o TokenId do token corresponde ao LastLoginTokenId no banco
                if (tokenIdClaim != user.LastLoginTokenId)
                    return Unauthorized(new { valid = false, message = "Token foi invalidado por um novo login" });

                return Ok(new { valid = true, message = "Token válido" });
            }
            catch
            {
                return Unauthorized(new { valid = false, message = "Erro ao validar token" });
            }
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
        // ✅ string agora (ex: "guarapuava")
        public string? UnidadeId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? Nome { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
        // ✅ string agora (ex: "guarapuava")
        public string? UnidadeId { get; set; }
    }
}