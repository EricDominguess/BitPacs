using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace BitPacs.API.Services 
{
    public class OrthancDashboardService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        public OrthancDashboardService(IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        // Função genérica e segura com Cache de 5 minutos
        public async Task<string> GetDataWithCacheAsync(string orthancUrl, string endpoint, string cacheKey)
        {
            // Verifica se os dados já estão salvos na memória RAM do C#
            if (!_cache.TryGetValue(cacheKey, out string cachedData))
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();

                    client.Timeout = TimeSpan.FromSeconds(15); // Timeout de 15 segundos para evitar travar o React

                    var authString = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes("admin:@BitFix123"));
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);

                    var response = await client.GetAsync($"{orthancUrl}{endpoint}");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        cachedData = await response.Content.ReadAsStringAsync();
                        
                        // Salva a resposta no cache por 5 minutos
                        _cache.Set(cacheKey, cachedData, new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(5)));
                    }
                    else
                    {
                        return $"[{{\"ParentStudy\": \"ERRO_ORTHANC\", \"error_status\": \"{response.StatusCode}\"}}]";
                        // Se não tiver, vai lá no Orthanc buscar (mas sem derrubar ele)
                    }
                }
                catch (Exception ex)
                {
                    // Em caso de erro (ex: timeout, Orthanc offline), retorna um JSON indicando o erro
                    return $"[{{\"ParentStudy\": \"ERRO_ORTHANC\", \"error_message\": \"{ex.Message}\"}}]";
                }               
            }

            return cachedData;
        }
    }
}