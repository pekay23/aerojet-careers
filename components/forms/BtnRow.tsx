import { ArrowLeft, ArrowRight } from 'lucide-react'

interface BtnRowProps {
  onBack?: () => void
  onNext: () => void
  disabled?: boolean
  nextLabel?: string
  nextStyle?: React.CSSProperties
  onSaveDraft?: () => void
}

export function BtnRow({ onBack, onNext, disabled, nextLabel = 'Continue', nextStyle, onSaveDraft }: BtnRowProps) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        {onBack ? (
          <button onClick={onBack} className="btn btn-outline"><ArrowLeft size={16} /> Back</button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onSaveDraft && (
            <button type="button" onClick={onSaveDraft} className="btn btn-outline" style={{ fontSize: 13, padding: '0.5rem 1rem' }}>
              Save Draft
            </button>
          )}
          <button
            onClick={onNext}
            className="btn btn-blue"
            disabled={disabled}
            style={nextStyle ?? (disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {})}
          >
            {nextLabel} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
