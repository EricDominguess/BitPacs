using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BitPacs.Api.Models;
using BitPacs.Api.Data;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System.Globalization;
using System.Text;

namespace BitPacs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudyLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudyLogsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: Registrar um log de visualização ou download
        [HttpPost]
        [Authorize]
        public IActionResult CreateLog([FromBody] CreateStudyLogRequest request)
        {
            // Pega o ID do usuário logado
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Usuário não identificado.");

            // Valida o tipo de ação
            if (request.ActionType != "VIEW" && request.ActionType != "DOWNLOAD")
                return BadRequest(new { message = "Tipo de ação inválido. Use 'VIEW' ou 'DOWNLOAD'." });

            // Obtém o IP do cliente
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            // Converte para horário de São Paulo (UTC-3)
            var localTime = GetBrazilTime();

            var log = new StudyLog
            {
                UserId = userId,
                ActionType = request.ActionType,
                StudyId = request.StudyId,
                StudyInstanceUID = request.StudyInstanceUID,
                PatientName = request.PatientName,
                StudyDescription = request.StudyDescription,
                Modality = request.Modality,
                Timestamp = localTime,
                UnidadeNome = request.UnidadeNome,
                IpAddress = ipAddress,
                Details = request.Details // Detalhes extras (formato do download)
            };

            _context.StudyLogs.Add(log);
            _context.SaveChanges();

            return Ok(new { message = "Log registrado com sucesso.", logId = log.Id });
        }

        // GET: Buscar logs de um usuário específico (com paginação)
        [HttpGet("user/{userId}")]
        [Authorize]
        public IActionResult GetUserLogs(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 8)
        {
            // Verifica se o usuário tem permissão (Master ou Admin podem ver qualquer um)
            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (currentUserRole == "Master")
            {
                // ok
            }
            else if (currentUserRole == "AdminGlobal")
            {
                var targetUser = _context.Users.AsNoTracking().FirstOrDefault(u => u.Id == userId);
                if (targetUser == null)
                    return NotFound("Usuário não encontrado.");

                var targetRole = NormalizeRole(targetUser.Role);
                if (targetRole == "Master")
                    return Forbid("Você não tem permissão para ver os logs deste usuário.");
            }
            else if (currentUserRole == "AdminLocal")
            {
                var targetUser = _context.Users.AsNoTracking().FirstOrDefault(u => u.Id == userId);
                if (targetUser == null)
                    return NotFound("Usuário não encontrado.");

                var targetRole = NormalizeRole(targetUser.Role);
                var currentUserUnidade = User.FindFirst("UnidadeId")?.Value;

                var isAllowedRole = targetRole == "AdminLocal" || targetRole == "Medico" || targetRole == "Médico" || targetRole == "Enfermeiro" || targetRole == "Admin";
                if (!isAllowedRole || targetRole == "AdminGlobal" || targetRole == "Master" || targetUser.UnidadeId != currentUserUnidade)
                    return Forbid("Você não tem permissão para ver os logs deste usuário.");
            }
            else if (currentUserId != userId.ToString())
            {
                return Forbid("Você não tem permissão para ver os logs deste usuário.");
            }

            // Verifica se o usuário existe
            var userExists = _context.Users.Any(u => u.Id == userId);
            if (!userExists)
                return NotFound("Usuário não encontrado.");

            // Query paginada
            var totalLogs = _context.StudyLogs.Count(l => l.UserId == userId);
            var totalPages = (int)Math.Ceiling((double)totalLogs / pageSize);

            var logs = _context.StudyLogs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.ActionType,
                    l.StudyId,
                    l.StudyInstanceUID,
                    l.PatientName,
                    l.StudyDescription,
                    l.Modality,
                    l.Timestamp,
                    l.IpAddress,
                    l.UnidadeNome,
                    l.TargetUserId,
                    l.TargetUserName,
                    l.Details
                })
                .ToList();

            return Ok(new
            {
                logs,
                pagination = new
                {
                    currentPage = page,
                    pageSize,
                    totalLogs,
                    totalPages
                }
            });
        }

        // GET: Buscar todos os logs (apenas Master/Admin)
        [HttpGet]
        [Authorize]
        public IActionResult GetAllLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);

            if (currentUserRole != "Master" && currentUserRole != "AdminGlobal")
                return Forbid("Apenas administradores podem ver todos os logs.");

            IQueryable<StudyLog> logsQuery = _context.StudyLogs
                .Include(l => l.User);

            if (currentUserRole == "AdminGlobal")
            {
                logsQuery = logsQuery.Where(l => l.User == null || l.User.Role != "Master");
            }

            var totalLogs = logsQuery.Count();
            var totalPages = (int)Math.Ceiling((double)totalLogs / pageSize);

            var logs = logsQuery
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.ActionType,
                    l.StudyId,
                    l.StudyInstanceUID,
                    l.PatientName,
                    l.StudyDescription,
                    l.Modality,
                    l.Timestamp,
                    l.IpAddress,
                    l.UnidadeNome,
                    User = new
                    {
                        l.User!.Id,
                        l.User.Nome,
                        l.User.Email
                    }
                })
                .ToList();

            return Ok(new
            {
                logs,
                pagination = new
                {
                    currentPage = page,
                    pageSize,
                    totalLogs,
                    totalPages
                }
            });
        }

        // GET: Resumo diário de visualizações/downloads por unidade
        [HttpGet("summary")]
        [Authorize]
        public IActionResult GetSummary([FromQuery] string? unidade, [FromQuery] string? date)
        {
            var currentUserRole = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            if (currentUserRole != "Master" && currentUserRole != "AdminGlobal" && currentUserRole != "AdminLocal")
                return Forbid("Apenas administradores podem ver o resumo.");

            var unidadeFiltro = unidade;
            if (currentUserRole == "AdminLocal")
            {
                unidadeFiltro = User.FindFirst("UnidadeId")?.Value;
            }

            var baseDate = GetBrazilTime().Date;
            if (!string.IsNullOrWhiteSpace(date))
            {
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var parsedDate))
                    return BadRequest(new { message = "Formato de data inválido. Use yyyy-MM-dd." });
                baseDate = parsedDate.Date;
            }

            var start = baseDate;
            var end = baseDate.AddDays(1);

            IQueryable<StudyLog> logsQuery = _context.StudyLogs
                .AsNoTracking()
                .Include(l => l.User)
                .Where(l => l.Timestamp >= start && l.Timestamp < end)
                .Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD");

            var unitCandidates = ExpandUnitCandidates(unidadeFiltro);
            if (unitCandidates.Count > 0)
            {
                logsQuery = logsQuery.Where(l =>
                    (l.UnidadeNome != null && unitCandidates.Any(c => l.UnidadeNome!.ToLower().Contains(c))) ||
                    (l.UnidadeNome == null && l.User != null && l.User.UnidadeId != null && unitCandidates.Contains(l.User.UnidadeId.ToLower()))
                );
            }

            var totalViews = logsQuery.Count(l => l.ActionType == "VIEW");
            var totalDownloads = logsQuery.Count(l => l.ActionType == "DOWNLOAD");

            return Ok(new
            {
                totalViews,
                totalDownloads
            });
        }

        // POST: Registrar log administrativo (criar usuário, deletar, mudar senha)
        [HttpPost("admin")]
        [Authorize]
        public IActionResult CreateAdminLog([FromBody] CreateAdminLogRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Usuário não identificado.");

            var validActions = new[] { "USER_CREATE", "USER_DELETE", "PASSWORD_CHANGE", "PASSWORD_CHANGE_OTHER" };
            if (!validActions.Contains(request.ActionType))
                return BadRequest(new { message = "Tipo de ação inválido." });

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var localTime = GetBrazilTime();

            var log = new StudyLog
            {
                UserId = userId,
                ActionType = request.ActionType,
                StudyId = "", // Não se aplica para ações administrativas
                TargetUserId = request.TargetUserId,
                TargetUserName = request.TargetUserName,
                Details = request.Details,
                Timestamp = localTime,
                IpAddress = ipAddress
            };

            _context.StudyLogs.Add(log);
            _context.SaveChanges();

            return Ok(new { message = "Log administrativo registrado com sucesso.", logId = log.Id });
        }

        // Helper method para obter horário do Brasil (UTC-3)
        private static DateTime GetBrazilTime()
        {
            return DateTime.UtcNow.AddHours(-3);
        }

        private static List<string> ExpandUnitCandidates(string? unidade)
        {
            var candidates = new List<string>();
            if (string.IsNullOrWhiteSpace(unidade)) return candidates;

            var normalized = unidade.Trim().ToLowerInvariant();
            candidates.Add(normalized);

            var noAccent = RemoveDiacritics(normalized);
            if (!string.IsNullOrWhiteSpace(noAccent))
            {
                candidates.Add(noAccent);
            }

            var unitMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "riobranco", "Rio Branco" },
                { "foziguacu", "Foz do Iguaçu" },
                { "fazenda", "Fazenda" },
                { "faxinal", "Faxinal" },
                { "santamariana", "Santa Mariana" },
                { "guarapuava", "Guarapuava" },
                { "carlopolis", "Carlópolis" },
                { "arapoti", "Arapoti" }
            };

            if (unitMap.TryGetValue(normalized, out var label))
            {
                var labelLower = label.ToLowerInvariant();
                candidates.Add(labelLower);
                var labelNoAccent = RemoveDiacritics(labelLower);
                if (!string.IsNullOrWhiteSpace(labelNoAccent))
                {
                    candidates.Add(labelNoAccent);
                }
            }

            var prefixCandidates = new List<string>();
            foreach (var item in candidates)
            {
                prefixCandidates.Add($"cis - unidade de {item}");
                prefixCandidates.Add($"cis - {item}");
                prefixCandidates.Add($"unidade de {item}");
                prefixCandidates.Add($"unidade {item}");
            }
            candidates.AddRange(prefixCandidates);

            return candidates.Distinct().ToList();
        }

        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return text;
            var normalized = text.Normalize(System.Text.NormalizationForm.FormD);
            var chars = normalized.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray();
            return new string(chars).Normalize(System.Text.NormalizationForm.FormC);
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return string.Empty;
            return role == "Admin" ? "AdminLocal" : role;
        }
    }

    // Request para criar log de estudo
    public class CreateStudyLogRequest
    {
        public required string ActionType { get; set; } // "VIEW" ou "DOWNLOAD"
        public required string StudyId { get; set; }
        public string? StudyInstanceUID { get; set; }
        public string? PatientName { get; set; }
        public string? StudyDescription { get; set; }
        public string? Modality { get; set; }
        public string? UnidadeNome { get; set; }
        public string? Details { get; set; } // Detalhes extras (ex: formato do download)
    }

    // Request para criar log administrativo
    public class CreateAdminLogRequest
    {
        public required string ActionType { get; set; } // "USER_CREATE", "USER_DELETE", "PASSWORD_CHANGE", "PASSWORD_CHANGE_OTHER"
        public int? TargetUserId { get; set; }
        public string? TargetUserName { get; set; }
        public string? Details { get; set; }
    }
}
