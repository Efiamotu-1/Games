import { useRoomLeaderboard } from '../shared/roomLeaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

function scoreFor(entry: ReturnType<typeof useRoomLeaderboard>[number]): number {
  if (entry.entryType === 'tournament' || entry.entryType === 'categories') {
    // Lower placement (1st) should sort first; give it a large synthetic
    // score so placement-based entries rank alongside/above strong race WPMs.
    return 1000 - (entry.placement ?? 999)
  }
  return entry.wpm ?? 0
}

export default function RoomLeaderboard({ roomCode }: { roomCode: string }) {
  const entries = useRoomLeaderboard(roomCode)

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-500">
        No results yet for this room.
      </div>
    )
  }

  const ranked = [...entries].sort((a, b) => scoreFor(b) - scoreFor(a))

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      <p className="text-sm font-medium text-neutral-300 mb-3">Room Leaderboard</p>
      <div className="space-y-2">
        {ranked.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 rounded-xl border px-3 sm:px-4 py-2.5 ${
              i < 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
            }`}
          >
            <span className="w-6 text-center text-xs font-semibold text-neutral-500 shrink-0">
              {MEDALS[i] ?? i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{entry.nickname}</p>
              <p className="text-xs text-neutral-500">
                {entry.entryType === 'tournament'
                  ? `🏆 Tournament — ${placementLabel(entry.placement)} · ${entry.roundsPlayed ?? '?'} rounds`
                  : entry.entryType === 'categories'
                    ? `Categories — ${placementLabel(entry.placement)} · ${entry.roundsPlayed ?? '?'} rounds`
                    : `${entry.wpm} WPM · ${entry.accuracyChar}% accuracy`}
              </p>
            </div>
            <span className="text-[10px] text-neutral-600 shrink-0">
              {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function placementLabel(placement: number | null): string {
  if (placement === 1) return 'Champion'
  if (placement === 2) return 'Runner-up'
  if (placement === null) return 'Placed'
  return `#${placement}`
}
