using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using BitPacs.API.Services; // Confirme se este é o namespace correto do seu Service
using BitPacs.Api.Data;
using BitPacs.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BitPacs.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly OrthancDashboardService _orthancService;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(OrthancDashboardService orthancService, AppDbContext dbContext, ILogger<DashboardController> logger)
        {
            _orthancService = orthancService;
            _dbContext = dbContext;
            _logger = logger;
        }

        [HttpGet("series/{unidade}")]
        public async Task<IActionResult> GetSeries(string unidade)
        {
            // 1. Descobre a URL do Orthanc baseado na unidade
            string orthancUrl = GetOrthancUrl(unidade);
            
            // 2. Cria uma chave única para o Cache (ex: "series_foziguacu")
            string cacheKey = $"series_{unidade.ToLower()}";

            // 3. Pede para o nosso Serviço buscar (ele vai olhar no cache primeiro)
            // Se não tiver no cache, ele vai no Orthanc, pega e guarda por 5 minutos
            var data = await _orthancService.GetDataWithCacheAsync(orthancUrl, "/series?expand", cacheKey);

            // 4. Devolve para o React
            return Content(data, "application/json");
        }

        // ✅ NOVO: Endpoint para deletar um estudo (apenas Master)
        [HttpDelete("study/{unidade}/{studyId}")]
        public async Task<IActionResult> DeleteStudy(string unidade, string studyId)
        {
            try
            {
                // 1. Descobre a URL do Orthanc baseado na unidade
                string orthancUrl = GetOrthancUrl(unidade);
                
                // 2. Faz a requisição DELETE ao Orthanc
                var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(15);
                
                var authString = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes("admin:@BitFix123"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);
                
                var response = await client.DeleteAsync($"{orthancUrl}/studies/{studyId}");
                
                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { message = "Estudo deletado com sucesso", studyId = studyId });
                }
                else
                {
                    return BadRequest(new { message = $"Erro ao deletar estudo: {response.StatusCode}", statusCode = response.StatusCode });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao deletar estudo", error = ex.Message });
            }
        }

        // ✅ NOVO: Endpoint para anexar laudo (upload)
        [HttpPost("reports/{unidade}")]
        public async Task<IActionResult> UploadReport(string unidade, [FromForm] IFormFile file, [FromForm] string studyId, [FromForm] string patientName)
        {
            try
            {
                // 1. Validar arquivo
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "Nenhum arquivo foi enviado." });
                }

                if (file.ContentType != "application/pdf")
                {
                    return BadRequest(new { message = "Apenas arquivos PDF são permitidos." });
                }

                const long maxFileSize = 50 * 1024 * 1024; // 50 MB
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { message = "Arquivo muito grande. Máximo: 50 MB." });
                }

                // 2. Criar diretório para laudos se não existir
                var reportsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "reports", unidade.ToLower());
                if (!Directory.Exists(reportsFolder))
                {
                    Directory.CreateDirectory(reportsFolder);
                }

                // 3. Gerar nome de arquivo único
                var fileName = $"{studyId}_{DateTime.Now:yyyyMMddHHmmss}_{Path.GetFileNameWithoutExtension(file.FileName)}.pdf";
                var filePath = Path.Combine(reportsFolder, fileName);

                // 4. Salvar arquivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // 5. Salvar registro no banco de dados
                var report = new Report
                {
                    StudyId = studyId,
                    StudyInstanceUID = studyId, // Pode ser obtido de outro lugar se necessário
                    PatientName = patientName,
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    UnidadeNome = unidade,
                    UserId = null, // Será preenchido pelo middleware de autenticação se necessário
                    UploadedAt = DateTime.UtcNow,
                    Status = "Active"
                };

                _dbContext.Reports.Add(report);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"Laudo anexado: StudyId={studyId}, PatientName={patientName}, FileName={file.FileName}, Unidade={unidade}");

                return Ok(new 
                { 
                    message = "Laudo anexado com sucesso!", 
                    reportId = report.Id,
                    fileName = file.FileName,
                    uploadedAt = report.UploadedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao fazer upload de laudo para StudyId={studyId}");
                return StatusCode(500, new { message = "Erro ao anexar laudo", error = ex.Message });
            }
        }

        // ✅ NOVO: Endpoint para deletar laudo
        [HttpDelete("reports/{unidade}/{studyId}")]
        public async Task<IActionResult> DeleteReport(string unidade, string studyId)
        {
            try
            {
                // 1. Buscar laudo no banco
                var report = await _dbContext.Reports
                    .FirstOrDefaultAsync(r => r.StudyId == studyId && r.Status == "Active" && r.UnidadeNome == unidade);

                if (report == null)
                {
                    return NotFound(new { message = "Laudo não encontrado." });
                }

                // 2. Deletar arquivo do disco
                if (System.IO.File.Exists(report.FilePath))
                {
                    System.IO.File.Delete(report.FilePath);
                }

                // 3. Marcar como deletado no banco
                report.Status = "Deleted";
                report.DeletedAt = DateTime.UtcNow;
                // Você pode extrair o nome do usuário do token/claims se necessário
                report.DeletedByUserName = User.Identity?.Name ?? "Sistema";

                _dbContext.Reports.Update(report);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"Laudo deletado: StudyId={studyId}, ReportId={report.Id}, DeletedBy={report.DeletedByUserName}, Unidade={unidade}");

                return Ok(new 
                { 
                    message = "Laudo deletado com sucesso!", 
                    reportId = report.Id,
                    deletedAt = report.DeletedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao deletar laudo para StudyId={studyId}");
                return StatusCode(500, new { message = "Erro ao deletar laudo", error = ex.Message });
            }
        }

        // ✅ NOVO: Endpoint para listar laudos de um estudo
        [HttpGet("reports/{unidade}/{studyId}")]
        public async Task<IActionResult> GetReports(string unidade, string studyId)
        {
            try
            {
                var reports = await _dbContext.Reports
                    .Where(r => r.StudyId == studyId && r.Status == "Active" && r.UnidadeNome == unidade)
                    .Select(r => new
                    {
                        r.Id,
                        r.FileName,
                        r.UploadedAt,
                        r.FileSize,
                        r.PatientName
                    })
                    .ToListAsync();

                return Ok(reports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao buscar laudos para StudyId={studyId}");
                return StatusCode(500, new { message = "Erro ao buscar laudos", error = ex.Message });
            }
        }

        // Função auxiliar para mapear o nome da unidade para o IP/URL real
        private string GetOrthancUrl(string unidade)
        {
            // Ajuste os IPs abaixo para os IPs reais dos seus containers/servidores Orthanc!
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
                _ => "http://localhost:8042" // Padrão
            };
        }
    }
}