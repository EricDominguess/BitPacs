using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BitPacs.Api.Data;
using System.Security.Claims;
using BitPacs.API.Services;

namespace BitPacs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly OrthancDashboardService _orthancService;
        private readonly IHttpClientFactory _httpClientFactory;

        public ReportsController(AppDbContext context, OrthancDashboardService orthancService, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _orthancService = orthancService;
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/reports/statistics
        // Retorna estatísticas gerais para o dashboard de relatórios
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics([FromQuery] string period = "today", [FromQuery] string? startDate = null, [FromQuery] string? endDate = null, [FromQuery] string unidade = "all")
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserUnidade = User.FindFirst("UnidadeId")?.Value;

            if (currentUserRole != "Master" && currentUserRole != "Admin")
                return Forbid("Apenas administradores podem acessar relatórios.");

            // Admin só pode ver sua própria unidade
            if (currentUserRole == "Admin" && !string.IsNullOrEmpty(currentUserUnidade))
            {
                unidade = currentUserUnidade;
            }

            // Define o intervalo de datas baseado no período
            DateTime startDateTime, endDateTime;
            var brazilTime = DateTime.UtcNow.AddHours(-3);

            switch (period.ToLower())
            {
                case "today":
                    startDateTime = brazilTime.Date;
                    endDateTime = brazilTime.Date.AddDays(1).AddTicks(-1);
                    break;
                case "week":
                    startDateTime = brazilTime.Date.AddDays(-7);
                    endDateTime = brazilTime.Date.AddDays(1).AddTicks(-1);
                    break;
                case "month":
                    startDateTime = brazilTime.Date.AddDays(-30);
                    endDateTime = brazilTime.Date.AddDays(1).AddTicks(-1);
                    break;
                case "custom":
                    if (!DateTime.TryParse(startDate, out startDateTime) || !DateTime.TryParse(endDate, out endDateTime))
                        return BadRequest("Datas inválidas para período personalizado.");
                    endDateTime = endDateTime.Date.AddDays(1).AddTicks(-1);
                    break;
                default:
                    startDateTime = brazilTime.Date;
                    endDateTime = brazilTime.Date.AddDays(1).AddTicks(-1);
                    break;
            }

            // Buscar logs no período (filtrado por unidade se não for 'all')
            var logsQuery = _context.StudyLogs
                .Where(l => l.Timestamp >= startDateTime && l.Timestamp <= endDateTime);
            
            // Filtrar por unidade se especificado
            if (!string.IsNullOrEmpty(unidade) && unidade.ToLower() != "all")
            {
                logsQuery = logsQuery.Where(l => l.UnidadeNome != null && l.UnidadeNome.ToLower() == unidade.ToLower());
            }

            var logsInPeriod = await logsQuery.ToListAsync();

            // Estatísticas por Modalidade (apenas VIEW e DOWNLOAD)
            var studyLogs = logsInPeriod.Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD").ToList();
            var modalityStats = studyLogs
                .Where(l => !string.IsNullOrEmpty(l.Modality))
                .GroupBy(l => l.Modality)
                .Select(g => new
                {
                    modality = g.Key,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList();

            var totalStudyActions = studyLogs.Count;
            var modalityData = modalityStats.Select(m => new
            {
                name = GetModalityName(m.modality!),
                shortName = m.modality,
                count = m.count,
                percentage = totalStudyActions > 0 ? Math.Round((double)m.count / totalStudyActions * 100) : 0,
                color = GetModalityColor(m.modality!)
            }).ToList();

            // Estatísticas por Ação de Usuário
            var actionStats = logsInPeriod
                .GroupBy(l => l.ActionType)
                .Select(g => new
                {
                    actionType = g.Key,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList();

            var totalActions = logsInPeriod.Count;
            var userActionData = actionStats.Select(a => new
            {
                name = GetActionName(a.actionType),
                actionType = a.actionType,
                count = a.count,
                percentage = totalActions > 0 ? Math.Round((double)a.count / totalActions * 100) : 0,
                color = GetActionColor(a.actionType)
            }).ToList();

            // Volume por hora (apenas para "today")
            var hourlyVolume = new int[24];
            if (period.ToLower() == "today")
            {
                var todayLogs = logsInPeriod.Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD");
                foreach (var log in todayLogs)
                {
                    var hour = log.Timestamp.Hour;
                    if (hour >= 0 && hour < 24)
                        hourlyVolume[hour]++;
                }
            }
            else
            {
                // Para outros períodos, agrupa por dia
                var dailyVolume = studyLogs
                    .GroupBy(l => l.Timestamp.Date)
                    .Select(g => new { date = g.Key, count = g.Count() })
                    .OrderBy(x => x.date)
                    .ToList();
            }

            // Total de instâncias (estimativa baseada nos logs)
            var totalInstances = studyLogs.Count * 15; // Média estimada de 15 instâncias por estudo

            // Buscar armazenamento (filtrado por unidade se necessário)
            var storageData = await GetTotalStorageAsync(unidade);

            return Ok(new
            {
                period = new { start = startDateTime, end = endDateTime },
                unidade = unidade,
                summary = new
                {
                    totalStudies = studyLogs.Count,
                    totalInstances,
                    activeModalities = modalityStats.Count,
                    totalUserActions = totalActions
                },
                modalityData,
                userActionData,
                hourlyVolume,
                storage = storageData
            });
        }

        // GET: api/reports/hourly-volume
        // Retorna volume de estudos por hora
        [HttpGet("hourly-volume")]
        public async Task<IActionResult> GetHourlyVolume([FromQuery] string date = "today")
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole != "Master" && currentUserRole != "Admin")
                return Forbid("Apenas administradores podem acessar relatórios.");

            var brazilTime = DateTime.UtcNow.AddHours(-3);
            DateTime targetDate;

            if (date == "today")
                targetDate = brazilTime.Date;
            else if (!DateTime.TryParse(date, out targetDate))
                return BadRequest("Data inválida.");

            var startOfDay = targetDate;
            var endOfDay = targetDate.AddDays(1).AddTicks(-1);

            var logs = await _context.StudyLogs
                .Where(l => l.Timestamp >= startOfDay && l.Timestamp <= endOfDay)
                .Where(l => l.ActionType == "VIEW" || l.ActionType == "DOWNLOAD")
                .ToListAsync();

            var hourlyVolume = new int[24];
            foreach (var log in logs)
            {
                var hour = log.Timestamp.Hour;
                if (hour >= 0 && hour < 24)
                    hourlyVolume[hour]++;
            }

            return Ok(new { date = targetDate.ToString("yyyy-MM-dd"), hourlyVolume });
        }

        // GET: api/reports/storage
        // Retorna informações de armazenamento de todas as unidades
        [HttpGet("storage")]
        public async Task<IActionResult> GetStorage([FromQuery] string unidade = "all")
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserUnidade = User.FindFirst("UnidadeId")?.Value;

            if (currentUserRole != "Master" && currentUserRole != "Admin")
                return Forbid("Apenas administradores podem acessar relatórios.");

            // Admin só pode ver sua própria unidade
            if (currentUserRole == "Admin" && !string.IsNullOrEmpty(currentUserUnidade))
            {
                unidade = currentUserUnidade;
            }

            var storageData = await GetTotalStorageAsync(unidade);
            return Ok(storageData);
        }

        // Método auxiliar para buscar armazenamento total
        private async Task<object> GetTotalStorageAsync(string filtroUnidade = "all")
        {
            var todasUnidades = new[] { "foziguacu", "fazenda", "riobranco", "faxinal", "santamariana", "guarapuava", "carlopolis", "arapoti" };
            
            // Se filtro específico, usar apenas essa unidade
            var unidadesParaBuscar = filtroUnidade.ToLower() == "all" 
                ? todasUnidades 
                : new[] { filtroUnidade.ToLower() };
            
            long totalUsed = 0;
            long totalCapacity = 500L * 1024 * 1024 * 1024; // 500 GB default por unidade
            var unidadeStorage = new List<object>();

            foreach (var unidade in unidadesParaBuscar)
            {
                try
                {
                    var orthancUrl = GetOrthancUrl(unidade);
                    var client = _httpClientFactory.CreateClient();
                    client.Timeout = TimeSpan.FromSeconds(5);

                    var authString = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes("admin:@BitFix123"));
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);

                    var response = await client.GetAsync($"{orthancUrl}/statistics");
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        var stats = System.Text.Json.JsonSerializer.Deserialize<OrthancStatistics>(content);
                        if (stats != null)
                        {
                            totalUsed += stats.TotalDiskSizeMB * 1024 * 1024;
                            unidadeStorage.Add(new
                            {
                                unidade,
                                usedMB = stats.TotalDiskSizeMB,
                                studies = stats.CountStudies,
                                series = stats.CountSeries,
                                instances = stats.CountInstances
                            });
                        }
                    }
                }
                catch
                {
                    // Unidade offline, ignora
                }
            }

            var totalCapacityGB = (totalCapacity / 1024 / 1024 / 1024) * unidadesParaBuscar.Length;
            var usedGB = totalUsed / 1024 / 1024 / 1024;
            var availableGB = totalCapacityGB - usedGB;

            return new
            {
                usedGB,
                availableGB,
                totalGB = totalCapacityGB,
                usedPercentage = totalCapacityGB > 0 ? Math.Round((double)usedGB / totalCapacityGB * 100, 1) : 0,
                unidades = unidadeStorage
            };
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

        private static string GetModalityName(string modality)
        {
            return modality.ToUpper() switch
            {
                "CR" or "DX" => "Raio-X",
                "CT" => "Tomografia",
                "MR" => "Ressonância",
                "US" => "Ultrassom",
                "MG" => "Mamografia",
                "NM" => "Medicina Nuclear",
                "PT" => "PET Scan",
                "XA" => "Angiografia",
                "RF" => "Fluoroscopia",
                "OT" => "Outros",
                _ => modality
            };
        }

        private static string GetModalityColor(string modality)
        {
            return modality.ToUpper() switch
            {
                "CR" or "DX" => "#3B82F6",
                "CT" => "#A855F7",
                "MR" => "#EC4899",
                "US" => "#10B981",
                "MG" => "#F59E0B",
                "NM" => "#6366F1",
                "PT" => "#14B8A6",
                "XA" => "#F97316",
                "RF" => "#8B5CF6",
                _ => "#94A3B8"
            };
        }

        private static string GetActionName(string actionType)
        {
            return actionType switch
            {
                "VIEW" => "Visualização de Estudos",
                "DOWNLOAD" => "Download de Estudos",
                "USER_CREATE" => "Criação de Usuários",
                "USER_DELETE" => "Exclusão de Usuários",
                "PASSWORD_CHANGE" => "Alteração de Senha",
                "PASSWORD_CHANGE_OTHER" => "Reset de Senha",
                _ => actionType
            };
        }

        private static string GetActionColor(string actionType)
        {
            return actionType switch
            {
                "VIEW" => "#3B82F6",
                "DOWNLOAD" => "#F59E0B",
                "USER_CREATE" => "#10B981",
                "USER_DELETE" => "#EF4444",
                "PASSWORD_CHANGE" => "#A855F7",
                "PASSWORD_CHANGE_OTHER" => "#6366F1",
                _ => "#94A3B8"
            };
        }
    }

    // Classe para deserializar estatísticas do Orthanc
    public class OrthancStatistics
    {
        public long TotalDiskSizeMB { get; set; }
        public int CountStudies { get; set; }
        public int CountSeries { get; set; }
        public int CountInstances { get; set; }
    }
}
