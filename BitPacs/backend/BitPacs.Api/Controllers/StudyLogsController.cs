using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BitPacs.Api.Models;
using BitPacs.Api.Data;
using System.Security.Claims;

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

            var log = new StudyLog
            {
                UserId = userId,
                ActionType = request.ActionType,
                StudyId = request.StudyId,
                StudyInstanceUID = request.StudyInstanceUID,
                PatientName = request.PatientName,
                StudyDescription = request.StudyDescription,
                Modality = request.Modality,
                Timestamp = DateTime.UtcNow,
                IpAddress = ipAddress
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
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Apenas Master/Admin podem ver logs de outros usuários
            if (currentUserRole != "Master" && currentUserRole != "Admin" && currentUserId != userId.ToString())
                return Forbid("Você não tem permissão para ver os logs deste usuário.");

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
                    l.IpAddress
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
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole != "Master" && currentUserRole != "Admin")
                return Forbid("Apenas administradores podem ver todos os logs.");

            var totalLogs = _context.StudyLogs.Count();
            var totalPages = (int)Math.Ceiling((double)totalLogs / pageSize);

            var logs = _context.StudyLogs
                .Include(l => l.User)
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
    }

    // Request para criar log
    public class CreateStudyLogRequest
    {
        public required string ActionType { get; set; } // "VIEW" ou "DOWNLOAD"
        public required string StudyId { get; set; }
        public string? StudyInstanceUID { get; set; }
        public string? PatientName { get; set; }
        public string? StudyDescription { get; set; }
        public string? Modality { get; set; }
    }
}
