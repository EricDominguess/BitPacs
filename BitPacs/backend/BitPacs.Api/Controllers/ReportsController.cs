using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BitPacs.Api.Data;
using BitPacs.API.Services;
using System.Globalization;
using System.Text.Json;

namespace BitPacs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportsController> _logger;
        private readonly OrthancDashboardService _orthancService;

        public ReportsController(AppDbContext context, ILogger<ReportsController> logger, OrthancDashboardService orthancService)
        {
            _context = context;
            _logger = logger;
            _orthancService = orthancService;
        }

        [HttpGet("doctors")]
        [Authorize]
        public async Task<IActionResult> GetDoctors([FromQuery] string? unidade, [FromQuery] string? unidadeLabel)
        {
            var role = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
            var unidadeClaim = User.FindFirst("UnidadeId")?.Value;

            if (role != "Master" && role != "AdminGlobal" && role != "AdminLocal")
            {
                return Forbid("Você não tem permissão para acessar médicos.");
            }

            var unidadeFilter = role == "AdminLocal" ? unidadeClaim : unidade;
            var normalizedUnit = (unidadeFilter ?? string.Empty).Trim().ToLowerInvariant();
            var normalizedLabel = (unidadeLabel ?? string.Empty).Trim().ToLowerInvariant();

            var allowedRoles = new[] { "Medico", "Médico", "Enfermeiro", "AdminLocal", "AdminGlobal", "Admin" };

            var query = _context.Users
                .AsNoTracking()
                .Where(u => allowedRoles.Contains(u.Role));

            if (!string.IsNullOrWhiteSpace(normalizedUnit) || !string.IsNullOrWhiteSpace(normalizedLabel))
            {
                query = query.Where(u =>
                    (u.UnidadeId ?? "").ToLower() == normalizedUnit
                    || (!string.IsNullOrWhiteSpace(normalizedLabel) && (u.UnidadeId ?? "").ToLower() == normalizedLabel)
                );
            }

            var doctors = await query
                .OrderBy(u => u.Nome)
                .Select(u => new { u.Id, u.Nome, u.UnidadeId })
                .ToListAsync();

            return Ok(doctors);
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetReports(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? unidades,
            [FromQuery] string? modality,
            [FromQuery] string? medico,
            [FromQuery] int? medicoId,
            [FromQuery] string? reportType,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var role = NormalizeRole(User.FindFirst(ClaimTypes.Role)?.Value);
                var unidadeClaim = User.FindFirst("UnidadeId")?.Value;

                if (role != "Master" && role != "AdminGlobal" && role != "AdminLocal")
                {
                    return Forbid("Você não tem permissão para acessar relatórios.");
                }

                var unidadesSelecionadas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (role == "AdminLocal")
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

                var resolvedReportType = string.IsNullOrWhiteSpace(reportType) ? "exams" : reportType.Trim().ToLowerInvariant();

                if (resolvedReportType == "exams")
                {
                    var units = unidadesSelecionadas.Count > 0
                        ? unidadesSelecionadas.ToList()
                        : new List<string>();

                    if (role == "AdminLocal" && !string.IsNullOrWhiteSpace(unidadeClaim))
                    {
                        units = new List<string> { unidadeClaim.Trim() };
                    }

                    if (units.Count == 0)
                    {
                        return BadRequest(new { message = "Selecione ao menos uma unidade." });
                    }

                    var examRecords = new List<(string StudyId, DateTime? StudyDate, string? PatientName, string? PatientId, string? StudyDescription, string? Modality, string Unidade)>();

                    foreach (var unit in units)
                    {
                        var orthancUrl = GetOrthancUrl(unit);
                        var cacheKey = $"reports_studies_{unit.ToLowerInvariant()}";
                        var data = await _orthancService.GetDataWithCacheAsync(orthancUrl, "/studies?expand", cacheKey);

                        using var doc = JsonDocument.Parse(data);
                        if (doc.RootElement.ValueKind != JsonValueKind.Array) continue;

                        foreach (var item in doc.RootElement.EnumerateArray())
                        {
                            var studyId = GetString(item, "ID") ?? string.Empty;
                            if (string.IsNullOrWhiteSpace(studyId)) continue;

                            if (!item.TryGetProperty("MainDicomTags", out var tags)) continue;

                            JsonElement patientTags = default;
                            var hasPatientTags = item.TryGetProperty("PatientMainDicomTags", out patientTags);

                            var studyDateStr = GetString(tags, "StudyDate");
                            var studyDate = TryParseStudyDate(studyDateStr);

                            if (start.HasValue && (!studyDate.HasValue || studyDate.Value < start.Value)) continue;
                            if (end.HasValue && (!studyDate.HasValue || studyDate.Value > end.Value)) continue;

                            var modalityRaw = GetString(tags, "ModalitiesInStudy") ?? GetString(tags, "Modality");
                            if (!string.IsNullOrWhiteSpace(modality))
                            {
                                var modalityValue = modality.Trim();
                                var modalities = (modalityRaw ?? string.Empty).Split('\\', StringSplitOptions.RemoveEmptyEntries);
                                if (!modalities.Contains(modalityValue))
                                {
                                    continue;
                                }
                            }

                            var patientName = GetString(tags, "PatientName")
                                ?? (hasPatientTags ? GetString(patientTags, "PatientName") : null);
                            var patientId = GetString(tags, "PatientID")
                                ?? (hasPatientTags ? GetString(patientTags, "PatientID") : null);
                            var studyDescription = GetString(tags, "StudyDescription");

                            examRecords.Add((studyId, studyDate, NormalizePatientName(patientName), patientId, studyDescription, modalityRaw, unit));
                        }
                    }

                    var examTotalStudies = examRecords.Select(r => r.StudyId).Distinct().Count();
                    var examTotalPatients = examRecords
                        .Select(r => NormalizePatientName(r.PatientName) ?? r.PatientId)
                        .Where(r => !string.IsNullOrWhiteSpace(r))
                        .Distinct()
                        .Count();

                    var logsQuery = _context.StudyLogs
                        .AsNoTracking()
                        .Include(l => l.User)
                        .Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD");

                    if (start.HasValue)
                    {
                        logsQuery = logsQuery.Where(l => l.Timestamp >= start.Value);
                    }

                    if (end.HasValue)
                    {
                        logsQuery = logsQuery.Where(l => l.Timestamp <= end.Value);
                    }

                    if (units.Count > 0)
                    {
                        var unitFilters = ExpandUnitFilters(units);
                        logsQuery = logsQuery.Where(l => l.UnidadeNome != null && unitFilters.Any(f => l.UnidadeNome.ToLower().Contains(f)));
                    }

                    if (!string.IsNullOrWhiteSpace(modality))
                    {
                        var modalityValue = modality.Trim();
                        logsQuery = logsQuery.Where(l => l.Modality == modalityValue);
                    }

                    if (role == "AdminGlobal" || role == "AdminLocal")
                    {
                        logsQuery = logsQuery.Where(l => l.User == null || l.User.Role != "Master");
                    }

                    var examTotalViews = await logsQuery.CountAsync(l => l.ActionType == "VIEW");
                    var examTotalDownloads = await logsQuery.CountAsync(l => l.ActionType == "DOWNLOAD");
                    var examTotalLogs = examTotalViews + examTotalDownloads;

                    var examPage = page < 1 ? 1 : page;
                    var examPageSize = pageSize < 1 ? 50 : Math.Min(pageSize, 200);

                    var examRecordsPaged = examRecords
                        .OrderByDescending(r => r.StudyDate ?? DateTime.MinValue)
                        .Skip((examPage - 1) * examPageSize)
                        .Take(examPageSize)
                        .Select((r, index) => new
                        {
                            Id = index + 1 + ((examPage - 1) * examPageSize),
                            Timestamp = r.StudyDate ?? DateTime.UtcNow,
                            PatientName = r.PatientName ?? r.PatientId,
                            r.StudyDescription,
                            Modality = r.Modality,
                            UnidadeNome = r.Unidade,
                            ActionType = "EXAM",
                            UserName = (string?)null
                        })
                        .ToList();

                    var examByUnit = examRecords
                        .GroupBy(r => r.Unidade)
                        .Select(g => new
                        {
                            unidade = g.Key,
                            totalActions = g.Count(),
                            totalViews = 0,
                            totalDownloads = 0
                        })
                        .OrderByDescending(x => x.totalActions)
                        .ToList();

                    return Ok(new
                    {
                        totals = new
                        {
                            totalLogs = examTotalLogs,
                            totalStudies = examTotalStudies,
                            totalPatients = examTotalPatients,
                            totalViews = examTotalViews,
                            totalDownloads = examTotalDownloads
                        },
                        records = examRecordsPaged,
                        summaries = new
                        {
                            byDoctor = new List<object>(),
                            byUnit = examByUnit
                        }
                    });
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
                    var unitFilters = ExpandUnitFilters(unidadesSelecionadas);
                    query = query.Where(l => l.UnidadeNome != null && unitFilters.Any(f => l.UnidadeNome.ToLower().Contains(f)));
                }

                if (!string.IsNullOrWhiteSpace(modality))
                {
                    var modalityValue = modality.Trim();
                    query = query.Where(l => l.Modality == modalityValue);
                }

                if (role == "AdminGlobal" || role == "AdminLocal")
                {
                    query = query.Where(l => l.User == null || l.User.Role != "Master");
                }

                if (resolvedReportType == "activity")
                {
                    var allowedActivityRoles = role == "AdminLocal"
                        ? new[] { "Medico", "Médico", "Enfermeiro", "AdminLocal", "Admin" }
                        : new[] { "Medico", "Médico", "Enfermeiro", "AdminLocal", "AdminGlobal", "Admin" };

                    query = query.Where(l => l.User != null && allowedActivityRoles.Contains(l.User.Role));
                    if (medicoId.HasValue)
                    {
                        query = query.Where(l => l.UserId == medicoId.Value);
                    }
                }

                _ = medico;
                _ = status;

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

                List<object> byDoctor;
                if (resolvedReportType == "activity")
                {
                    var allowedActivityRoles = role == "AdminLocal"
                        ? new[] { "Medico", "Médico", "Enfermeiro", "AdminLocal", "Admin" }
                        : new[] { "Medico", "Médico", "Enfermeiro", "AdminLocal", "AdminGlobal", "Admin" };

                    var unitFilters = unidadesSelecionadas.Count > 0
                        ? ExpandUnitFilters(unidadesSelecionadas)
                        : new List<string>();

                    var usersQuery = _context.Users
                        .AsNoTracking()
                        .Where(u => allowedActivityRoles.Contains(u.Role));

                    if (unitFilters.Count > 0)
                    {
                        usersQuery = usersQuery.Where(u => u.UnidadeId != null && unitFilters.Any(f => u.UnidadeId.ToLower().Contains(f)));
                    }

                    if (medicoId.HasValue)
                    {
                        usersQuery = usersQuery.Where(u => u.Id == medicoId.Value);
                    }

                    var users = await usersQuery
                        .Select(u => new { u.Id, u.Nome })
                        .OrderBy(u => u.Nome)
                        .ToListAsync();

                    var logTotals = await query
                        .Where(l => l.UserId != null)
                        .GroupBy(l => l.UserId)
                        .Select(g => new
                        {
                            UserId = g.Key!.Value,
                            totalActions = g.Count(),
                            totalViews = g.Count(x => x.ActionType == "VIEW"),
                            totalDownloads = g.Count(x => x.ActionType == "DOWNLOAD")
                        })
                        .ToListAsync();

                    var logTotalsMap = logTotals.ToDictionary(x => x.UserId, x => x);

                    byDoctor = users
                        .Select(u =>
                        {
                            logTotalsMap.TryGetValue(u.Id, out var totals);
                            return new
                            {
                                doctorId = u.Id,
                                doctorName = u.Nome,
                                totalActions = totals?.totalActions ?? 0,
                                totalViews = totals?.totalViews ?? 0,
                                totalDownloads = totals?.totalDownloads ?? 0
                            };
                        })
                        .OrderByDescending(x => x.totalActions)
                        .ThenBy(x => x.doctorName)
                        .Cast<object>()
                        .ToList();
                }
                else
                {
                    byDoctor = await query
                        .Where(l => l.User != null)
                        .GroupBy(l => new { l.UserId, l.User!.Nome })
                        .Select(g => new
                        {
                            doctorId = g.Key.UserId,
                            doctorName = g.Key.Nome,
                            totalActions = g.Count(),
                            totalViews = g.Count(x => x.ActionType == "VIEW"),
                            totalDownloads = g.Count(x => x.ActionType == "DOWNLOAD")
                        })
                        .OrderByDescending(x => x.totalActions)
                        .ToListAsync<object>();
                }

                var byUnit = resolvedReportType == "activity"
                    ? new List<object>()
                    : await query
                        .Where(l => l.UnidadeNome != null)
                        .GroupBy(l => l.UnidadeNome!)
                        .Select(g => new
                        {
                            unidade = g.Key,
                            totalActions = g.Count(),
                            totalViews = g.Count(x => x.ActionType == "VIEW"),
                            totalDownloads = g.Count(x => x.ActionType == "DOWNLOAD")
                        })
                        .OrderByDescending(x => x.totalActions)
                        .ToListAsync<object>();

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
                    records,
                    summaries = new
                    {
                        byDoctor,
                        byUnit
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar relatório.");
                return StatusCode(500, new { message = "Erro ao gerar relatório.", detail = ex.Message });
            }
        }

        private static DateTime? TryParseStudyDate(string? studyDate)
        {
            if (string.IsNullOrWhiteSpace(studyDate)) return null;

            if (DateTime.TryParseExact(studyDate, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
            {
                return DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
            }

            return null;
        }

        private static string? GetString(JsonElement element, string propertyName)
        {
            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(propertyName, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.String)
                {
                    return prop.GetString();
                }
            }
            return null;
        }

        private static string? NormalizePatientName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return name;
            return name.Replace("^", " ").Trim();
        }

        private string GetOrthancUrl(string unidade)
        {
            return unidade.ToLower() switch
            {
                "foziguacu" => "http://10.31.0.39:8042",
                "fazenda" => "http://10.31.0.38:8042",
                "riobranco" => "http://10.31.0.36:8042",
                "faxinal" => "http://10.31.0.37:8042",
                "santamariana" => "http://10.31.0.46:8042",
                "guarapuava" => "http://10.31.0.47:8042",
                "carlopolis" => "http://10.31.0.48:8042",
                "arapoti" => "http://10.31.0.49:8042",
                _ => "http://localhost:8042"
            };
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return string.Empty;
            return role == "Admin" ? "AdminLocal" : role;
        }

        private static List<string> ExpandUnitFilters(IEnumerable<string> unidades)
        {
            var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in unidades)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                var normalized = raw.Trim().ToLowerInvariant();
                results.Add(normalized);

                var withoutPrefix = normalized
                    .Replace("cis - unidade de ", string.Empty)
                    .Replace("cis - ", string.Empty)
                    .Replace("unidade de ", string.Empty)
                    .Replace("unidade ", string.Empty)
                    .Replace("cis ", string.Empty)
                    .Trim();

                if (!string.IsNullOrWhiteSpace(withoutPrefix))
                {
                    results.Add(withoutPrefix);
                }
            }

            return results.ToList();
        }
    }
}
