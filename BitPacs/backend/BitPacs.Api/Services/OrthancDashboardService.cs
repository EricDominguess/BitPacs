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
                // Se não tiver, vai lá no Orthanc buscar (mas sem derrubar ele)
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"{orthancUrl}{endpoint}");
                
                if (response.IsSuccessStatusCode)
                {
                    cachedData = await response.Content.ReadAsStringAsync();
                    
                    // Salva a resposta no cache por 5 minutos
                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
                        
                    _cache.Set(cacheKey, cachedData, cacheOptions);
                }
                else
                {
                    return "[]"; // Retorna array vazio em caso de falha para não quebrar o React
                }
            }

            return cachedData;
        }
    }
}