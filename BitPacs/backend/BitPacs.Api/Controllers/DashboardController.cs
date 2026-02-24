using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using BitPacs.API.Services; // Confirme se este é o namespace correto do seu Service

namespace BitPacs.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly OrthancDashboardService _orthancService;

        public DashboardController(OrthancDashboardService orthancService)
        {
            _orthancService = orthancService;
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