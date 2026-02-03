using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BitPacs.Api.Models
{
    public class StudyLog
    {
        public int Id { get; set; }
        
        // Relacionamento com o usuário
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        // Tipo de ação: "VIEW" ou "DOWNLOAD"
        public string ActionType { get; set; } = "VIEW";
        
        // ID do estudo no Orthanc
        public string StudyId { get; set; } = string.Empty;
        
        // StudyInstanceUID para referência
        public string? StudyInstanceUID { get; set; }
        
        // Nome do paciente (para exibição rápida no histórico)
        public string? PatientName { get; set; }
        
        // Descrição do estudo
        public string? StudyDescription { get; set; }
        
        // Modalidade do estudo (CT, MR, etc)
        public string? Modality { get; set; }
        
        // Data e hora da ação
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        // IP do usuário (opcional, para auditoria)
        public string? IpAddress { get; set; }
    }
}
