using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitPacs.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUnidadeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unidade",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unidade",
                table: "Users");
        }
    }
}
