import HomeScreen from './arcade/HomeScreen'
import LobbyScreen from './arcade/LobbyScreen'
import { GAMES } from './games/registry'
import { useRoom } from './shared/useRoom'
import { useRouter } from './shared/router'
import { getOrCreatePlayerId } from './shared/identity'

export default function App() {
  const { route, navigate } = useRouter()

  function goHome() {
    navigate({ name: 'home' })
  }

  if (route.name === 'solo') {
    const game = GAMES.find((g) => g.id === route.gameId)
    if (game?.soloComponent) {
      const SoloComponent = game.soloComponent
      return <SoloComponent onExit={goHome} />
    }
    goHome()
    return null
  }

  if (route.name === 'lobby') {
    const game = GAMES.find((g) => g.id === route.gameId)
    if (!game) {
      goHome()
      return null
    }
    return (
      <LobbyScreen
        game={game}
        prefillRoomCode={route.roomCode}
        onRoomReady={(roomCode) =>
          navigate({ name: 'lobby', gameId: game.id, roomCode }, { replace: true })
        }
        onStart={(roomCode) => navigate({ name: 'play', gameId: game.id, roomCode })}
        onExit={goHome}
      />
    )
  }

  if (route.name === 'play') {
    return <PlayScreen gameId={route.gameId} roomCode={route.roomCode} onExit={goHome} />
  }

  return (
    <HomeScreen
      onPlaySolo={(gameId) => navigate({ name: 'solo', gameId })}
      onPlayWithFriends={(gameId) => navigate({ name: 'lobby', gameId, roomCode: null })}
    />
  )
}

function PlayScreen({ gameId, roomCode, onExit }: { gameId: string; roomCode: string; onExit: () => void }) {
  const game = GAMES.find((g) => g.id === gameId)
  const room = useRoom(roomCode)
  const selfId = getOrCreatePlayerId(roomCode)

  if (!game?.multiplayerComponent || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Loading…</p>
      </div>
    )
  }

  const MultiplayerComponent = game.multiplayerComponent
  return <MultiplayerComponent room={room} selfId={selfId} onExit={onExit} />
}
