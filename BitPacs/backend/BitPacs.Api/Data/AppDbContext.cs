using Microsoft.EntityFrameworkCore;
using BitPacs.Api.Models; // Ajuste para o namespace correto do seu User

namespace BitPacs.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // O erro provavelmente estava aqui nesta linha:
        public DbSet<User> Users { get; set; } 
    }
}