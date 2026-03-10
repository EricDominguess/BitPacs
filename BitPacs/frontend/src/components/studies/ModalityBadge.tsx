const modalityColors: Record<string, string> = {
  CT: 'bg-nautico/20 text-nautico border-nautico/30',
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30',
  CR: 'bg-ultra/20 text-ultra border-ultra/30',
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30',
  DR: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  DX: 'bg-nautico',
  OT: 'bg-gray-400/20 text-gray-500 border-gray-400/30',
};

interface ModalityBadgeProps {
  modality: string;
  className?: string;
}

export function ModalityBadge({ modality, className = '' }: ModalityBadgeProps) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${modalityColors[modality] || modalityColors['OT']} ${className}`}>
      {modality}
    </span>
  );
}

export { modalityColors };
