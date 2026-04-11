using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitPacs.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReportTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudyId = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false),
                    StudyInstanceUID = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false),
                    PatientName = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: false),
                    FileName = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false),
                    FilePath = table.Column<string>(type: "varchar(1024)", maxLength: 1024, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UnidadeNome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "int", nullable: true),
                    DeletedByUserName = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_StudyId",
                table: "Reports",
                column: "StudyId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UnidadeNome",
                table: "Reports",
                column: "UnidadeNome");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status",
                table: "Reports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId",
                table: "Reports",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reports");
        }
    }
}