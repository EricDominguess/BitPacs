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
        [MaxLength(50)]
        public string ActionType { get; set; } = "VIEW";
        
        // ID do estudo no Orthanc (apenas para VIEW/DOWNLOAD)
        [MaxLength(512)] // Tamanho suficiente para IDs longos do Orthanc
        public string StudyId { get; set; } = string.Empty;
        
        // StudyInstanceUID para referência
        [MaxLength(512)]
        public string? StudyInstanceUID { get; set; }
        
        // Nome do paciente (para exibição rápida no histórico)
        [MaxLength(256)]
        public string? PatientName { get; set; }
        
        // Descrição do estudo
        [MaxLength(512)]
        public string? StudyDescription { get; set; }
        
        // Modalidade do estudo (CT, MR, etc)
        [MaxLength(50)]
        public string? Modality { get; set; }
        
        // Unidade de origem do estudo (Foz, Fazenda, etc)
        [MaxLength(100)]
        public string? UnidadeNome { get; set; }

        // Data e hora da ação (Horário de São Paulo - UTC-3)
        public DateTime Timestamp { get; set; } = DateTime.UtcNow.AddHours(-3);
        
        // IP do usuário (opcional, para auditoria)
        [MaxLength(45)]
        public string? IpAddress { get; set; }
        
        // ID do usuário alvo (para ações administrativas como criar/deletar usuário)
        public int? TargetUserId { get; set; }
        
        // Nome do usuário alvo (para exibição no histórico)
        [MaxLength(256)]
        public string? TargetUserName { get; set; }
        
        // Detalhes adicionais da ação (ex: formato do download, integração URL com patientId)
        // ⚠️ CRÍTICO: Campo pode conter URLs de integração com múltiplos parâmetros
        [MaxLength(1024)]
        public string? Details { get; set; }
    }
}
