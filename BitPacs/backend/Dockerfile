 # Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar arquivos de projeto
COPY ["BitPacs.Api/BitPacs.Api.csproj", "BitPacs.Api/"]

# Restaurar dependencias
RUN dotnet restore "BitPacs.Api/BitPacs.Api.csproj"

# Copiar todo o codigo fonte
COPY . .

# Build da aplicacao
WORKDIR "src/BitPacs.Api"
RUN dotnet build "BitPacs.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "BitPacs.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Copiar arquivos publicados
COPY --from=publish /app/publish .

# Criar diretorio de logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Expor porta
EXPOSE 5151

# Variaveis de ambiente
ENV ASPNETCORE_URLS=http://+:5151
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5151/health || exit 1

# Comando de inicializacao
ENTRYPOINT ["dotnet", "BitPacs.Api.dll"]

