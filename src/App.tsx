import { useState } from 'react'
import HomeScreen from './arcade/HomeScreen'
import LobbyScreen from './arcade/LobbyScreen'
import { GAMES } from './games/registry'
import { useRoom } from './shared/useRoom'

type Stage = 'home' | 'solo' | 'lobby' | 'multiplayer'

function readInviteFromUrl(): { gameId: string; roomCode: string } | null {
  const params = new URLSearchParams(window.location.search)
  const gameId = params.get('game')
  const roomCode = params.get('room')
  if (!gameId || !roomCode) return null
  if (!GAMES.some((g) => g.id === gameId && g.available)) return null
  return { gameId, roomCode: roomCode.toUpperCase() }
}

export default function App() {
  const invite = useState(() => readInviteFromUrl())[0]
  const [stage, setStage] = useState<Stage>(invite ? 'lobby' : 'home')
  const [activeGameId, setActiveGameId] = useState<string | null>(invite?.gameId ?? null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [selfId, setSelfId] = useState<string | null>(null)

  const activeGame = GAMES.find((g) => g.id === activeGameId)
  const room = useRoom(stage === 'multiplayer' ? roomCode : null)

  function playSolo(gameId: string) {
    setActiveGameId(gameId)
    setStage('solo')
  }

  function playWithFriends(gameId: string) {
    setActiveGameId(gameId)
    setStage('lobby')
  }

  function exitToHome() {
    setActiveGameId(null)
    setRoomCode(null)
    setSelfId(null)
    setStage('home')
    window.history.replaceState(null, '', window.location.pathname)
  }

  if (stage === 'solo' && activeGame?.soloComponent) {
    const SoloComponent = activeGame.soloComponent
    return <SoloComponent onExit={exitToHome} />
  }

  if (stage === 'lobby' && activeGame) {
    return (
      <LobbyScreen
        game={activeGame}
        prefillRoomCode={invite?.gameId === activeGame.id ? invite.roomCode : null}
        onStart={(id) => {
          setSelfId(id)
          setStage('multiplayer')
        }}
        onExit={exitToHome}
        onRoomCreated={setRoomCode}
      />
    )
  }

  if (stage === 'multiplayer' && activeGame?.multiplayerComponent && room && selfId) {
    const MultiplayerComponent = activeGame.multiplayerComponent
    return <MultiplayerComponent room={room} selfId={selfId} onExit={exitToHome} />
  }

  return <HomeScreen onPlaySolo={playSolo} onPlayWithFriends={playWithFriends} />
}
