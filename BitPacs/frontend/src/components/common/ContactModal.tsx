interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-theme-primary">Fale Conosco</h3>
          <button
            onClick={onClose}
            className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Telefone */}
          <a 
            href="tel:+554333364004"
            className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:border-nautico/50 hover:bg-nautico/5 transition-colors group"
          >
            <div className="p-3 bg-nautico/20 rounded-lg group-hover:bg-nautico/30 transition-colors">
              <svg className="w-5 h-5 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-theme-muted">Telefone</p>
              <p className="text-theme-primary font-medium">(43) 3336-4004</p>
            </div>
          </a>

          {/* Email */}
          <a 
            href="mailto:suporte6@bitfix.com.br"
            className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:border-ultra/50 hover:bg-ultra/5 transition-colors group"
          >
            <div className="p-3 bg-ultra/20 rounded-lg group-hover:bg-ultra/30 transition-colors">
              <svg className="w-5 h-5 text-ultra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-theme-muted">Email</p>
              <p className="text-theme-primary font-medium">suporte6@bitfix.com.br</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a 
            href="https://wa.me/554333364004"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition-colors group"
          >
            <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-theme-muted">WhatsApp</p>
              <p className="text-theme-primary font-medium">(43) 3336-4004</p>
            </div>
          </a>

          {/* Horário */}
          <div className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-xl">
            <div className="p-3 bg-purple/20 rounded-lg">
              <svg className="w-5 h-5 text-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-theme-muted">Horário de Atendimento</p>
              <p className="text-theme-primary font-medium">Seg - Sex: 08:00 - 18:00</p>
              <p className="text-theme-secondary text-sm">Sáb: 08:00 - 12:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
