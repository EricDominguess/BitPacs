using System;

namespace BitPacs.Api.Models
{
    public class Report
    {
        public int Id { get; set; }
        
        // Identificação do estudo
        public string StudyId { get; set; } = string.Empty;
        public string StudyInstanceUID { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        
        // Informações do arquivo
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        
        // Unidade onde o laudo foi anexado
        public string UnidadeNome { get; set; } = string.Empty;
        
        // Rastreamento de quem fez o upload
        public int? UserId { get; set; }
        public User? User { get; set; }
        
        // Timestamps
        public DateTime UploadedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        
        // Para casos onde o laudo foi deletado, guardar quem deletou
        public int? DeletedByUserId { get; set; }
        public string? DeletedByUserName { get; set; }
        
        // Status: 'Active' ou 'Deleted'
        public string Status { get; set; } = "Active";
    }
}
