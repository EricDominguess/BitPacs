using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BitPacs.Api.Models
{
    public class StudyLog
    {
        public int Id { get; set; }
        
        // Relacionamento com o usuário que fez a ação
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        // Tipo de ação: "VIEW", "DOWNLOAD", "USER_CREATE", "USER_DELETE", "PASSWORD_CHANGE", "PASSWORD_CHANGE_OTHER"
        public string ActionType { get; set; } = "VIEW";
        
        // ID do estudo no Orthanc (apenas para VIEW/DOWNLOAD)
        public string StudyId { get; set; } = string.Empty;
        
        // StudyInstanceUID para referência
        public string? StudyInstanceUID { get; set; }
        
        // Nome do paciente (para exibição rápida no histórico)
        public string? PatientName { get; set; }
        
        // Descrição do estudo
        public string? StudyDescription { get; set; }
        
        // Modalidade do estudo (CT, MR, etc)
        public string? Modality { get; set; }
        
        // Unidade de origem do estudo (Foz, Fazenda, etc)
        public string? UnidadeNome { get; set; }

        // Data e hora da ação (Horário de São Paulo - UTC-3)
        public DateTime Timestamp { get; set; } = DateTime.UtcNow.AddHours(-3);
        
        // IP do usuário (opcional, para auditoria)
        public string? IpAddress { get; set; }
        
        // ID do usuário alvo (para ações administrativas como criar/deletar usuário)
        public int? TargetUserId { get; set; }
        
        // Nome do usuário alvo (para exibição no histórico)
        public string? TargetUserName { get; set; }
        
        // Detalhes adicionais da ação
        public string? Details { get; set; }
    }
}
