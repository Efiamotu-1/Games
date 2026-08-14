import { GAMES } from '../games/registry'

interface HomeScreenProps {
  onPlaySolo: (gameId: string) => void
  onPlayWithFriends: (gameId: string) => void
}

export default function HomeScreen({ onPlaySolo, onPlayWithFriends }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-4xl flex items-center justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Party Arcade
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">We&apos;re bored. Open Party Arcade.</h1>
          <p className="text-sm sm:text-base text-neutral-400">Pick a game, invite friends, and keep score.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className={`rounded-2xl border p-5 transition-all ${
                game.available
                  ? 'border-neutral-800 bg-neutral-900/60'
                  : 'border-neutral-900 bg-neutral-950/50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">{game.name}</h2>
                {!game.available && (
                  <span className="text-[10px] uppercase tracking-wide text-neutral-500 border border-neutral-800 rounded-full px-2 py-0.5">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 mb-3">{game.tagline}</p>
              <p className="text-xs text-neutral-500 mb-4">
                {game.minPlayers <= 1 ? 'Any number of players' : `${game.minPlayers}+ players`}
              </p>

              {game.available && (
                <div className="flex gap-2">
                  {game.supportsSolo && (
                    <button
                      onClick={() => onPlaySolo(game.id)}
                      className="flex-1 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 text-xs font-medium transition-colors"
                    >
                      Practice Solo
                    </button>
                  )}
                  <button
                    onClick={() => onPlayWithFriends(game.id)}
                    className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-colors"
                  >
                    Play with Friends
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="text-xs text-neutral-500 mt-10 sm:mt-16">
        Open → Join → Play.
      </footer>
    </div>
  )
}
