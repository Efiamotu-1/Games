import ModeInfoButton from './ModeInfoButton'

interface ModeBadgeProps {
  label: string
  description: string
  colorClass: string
}

export default function ModeBadge({ label, description, colorClass }: ModeBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-medium ${colorClass}`}>
      {label}
      <ModeInfoButton title={label} description={description} />
    </span>
  )
}
