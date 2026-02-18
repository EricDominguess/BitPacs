FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar apenas o .csproj primeiro
COPY BitPacs.Api/BitPacs.Api.csproj BitPacs.Api/
RUN dotnet restore "BitPacs.Api/BitPacs.Api.csproj"

# Copiar todo o resto
COPY . .

# Build
WORKDIR "/src/BitPacs.Api"
RUN dotnet build "BitPacs.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BitPacs.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

RUN mkdir -p /app/logs && chmod 777 /app/logs

EXPOSE 5151

ENV ASPNETCORE_URLS=http://+:5151
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:5151/health || exit 1

ENTRYPOINT ["dotnet", "BitPacs.Api.dll"]
