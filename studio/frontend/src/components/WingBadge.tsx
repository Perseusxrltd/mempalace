import { wingColor } from '../types'

interface Props {
  wing: string
  room?: string
  size?: 'sm' | 'md'
}

export default function WingBadge({ wing, room, size = 'sm' }: Props) {
  const color = wingColor(wing)
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 rounded font-medium ${px}`}
      style={{ background: color + '22', color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {wing}{room ? ` / ${room}` : ''}
    </span>
  )
}
