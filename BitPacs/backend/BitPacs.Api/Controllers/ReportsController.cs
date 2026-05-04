using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BitPacs.Api.Data;

namespace BitPacs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(AppDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetReports(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? unidades,
            [FromQuery] string? modality,
            [FromQuery] string? medico,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                var unidadeClaim = User.FindFirst("UnidadeId")?.Value;

                if (role != "Master" && role != "Admin")
                {
                    return Forbid("Você não tem permissão para acessar relatórios.");
                }

                var unidadesSelecionadas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (role == "Admin")
                {
                    if (!string.IsNullOrWhiteSpace(unidadeClaim))
                    {
                        unidadesSelecionadas.Add(unidadeClaim.Trim());
                    }
                }
                else if (!string.IsNullOrWhiteSpace(unidades))
                {
                    foreach (var item in unidades.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var value = item.Trim();
                        if (!string.IsNullOrWhiteSpace(value))
                        {
                            unidadesSelecionadas.Add(value);
                        }
                    }
                }

                DateTime? start = null;
                DateTime? end = null;
                if (!string.IsNullOrWhiteSpace(startDate))
                {
                    if (DateTime.TryParse(startDate, out var startParsed))
                    {
                        start = DateTime.SpecifyKind(startParsed.Date, DateTimeKind.Utc);
                    }
                }
                if (!string.IsNullOrWhiteSpace(endDate))
                {
                    if (DateTime.TryParse(endDate, out var endParsed))
                    {
                        end = DateTime.SpecifyKind(endParsed.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                    }
                }

                var query = _context.StudyLogs
                    .AsNoTracking()
                    .Include(l => l.User)
                    .Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD");

                if (start.HasValue)
                {
                    query = query.Where(l => l.Timestamp >= start.Value);
                }

                if (end.HasValue)
                {
                    query = query.Where(l => l.Timestamp <= end.Value);
                }

                if (unidadesSelecionadas.Count > 0)
                {
                    var unidadesLower = unidadesSelecionadas.Select(u => u.ToLowerInvariant()).ToList();
                    query = query.Where(l => l.UnidadeNome != null && unidadesLower.Contains(l.UnidadeNome.ToLower()));
                }

                if (!string.IsNullOrWhiteSpace(modality))
                {
                    var modalityValue = modality.Trim();
                    query = query.Where(l => l.Modality == modalityValue);
                }

                _ = medico;

                _ = status;

                var totalLogs = await query.CountAsync();
                var totalStudies = await query.Select(l => l.StudyId).Distinct().CountAsync();
                var totalPatients = await query
                    .Where(l => l.PatientName != null && l.PatientName != "")
                    .Select(l => l.PatientName!)
                    .Distinct()
                    .CountAsync();
                var totalViews = await query.CountAsync(l => l.ActionType == "VIEW");
                var totalDownloads = await query.CountAsync(l => l.ActionType == "DOWNLOAD");

                var safePage = page < 1 ? 1 : page;
                var safePageSize = pageSize < 1 ? 50 : Math.Min(pageSize, 200);

                var records = await query
                    .OrderByDescending(l => l.Timestamp)
                    .Skip((safePage - 1) * safePageSize)
                    .Take(safePageSize)
                    .Select(l => new
                    {
                        l.Id,
                        Timestamp = l.Timestamp,
                        l.PatientName,
                        l.StudyDescription,
                        l.Modality,
                        l.UnidadeNome,
                        l.ActionType,
                        UserName = l.User != null ? l.User.Nome : null
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totals = new
                    {
                        totalLogs,
                        totalStudies,
                        totalPatients,
                        totalViews,
                        totalDownloads
                    },
                    records
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar relatório.");
                return StatusCode(500, new { message = "Erro ao gerar relatório.", detail = ex.Message });
            }
        }
    }
}
