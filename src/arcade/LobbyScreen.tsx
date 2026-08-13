import { useEffect, useState } from 'react'
import type { GameDefinition } from '../games/registry'
import { getOrCreatePlayerId, savePlayerId, clearPlayerId, newPlayerId } from '../shared/identity'
import { createRoomOnServer, joinRoomOnServer, leaveRoom, setPlayerReady, setRoomMode, startRace } from '../shared/roomApi'
import { useRoom } from '../shared/useRoom'
import RoomLeaderboard from './RoomLeaderboard'

interface LobbyScreenProps {
  game: GameDefinition
  prefillRoomCode: string | null
  onRoomReady: (roomCode: string) => void
  onStart: (roomCode: string) => void
  onExit: () => void
}

export default function LobbyScreen({ game, prefillRoomCode, onRoomReady, onStart, onExit }: LobbyScreenProps) {
  const room = useRoom(prefillRoomCode)
  const selfId = prefillRoomCode ? getOrCreatePlayerId(prefillRoomCode) : null

  useEffect(() => {
    if (!selfId) return
    const currentSelfId = selfId
    function handleUnload() {
      leaveRoom(currentSelfId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [selfId])

  useEffect(() => {
    if (room?.status === 'in-game' && prefillRoomCode) {
      onStart(prefillRoomCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status])

  function handleExit() {
    if (selfId) {
      leaveRoom(selfId).catch(() => {})
      if (prefillRoomCode) clearPlayerId(prefillRoomCode)
    }
    onExit()
  }

  if (!prefillRoomCode || !room || !selfId) {
    return (
      <JoinScreen
        game={game}
        prefillRoomCode={prefillRoomCode}
        onExit={onExit}
        onCreateRoom={async (nickname) => {
          const id = newPlayerId()
          const created = await createRoomOnServer(game.id, id, nickname || 'Host')
          savePlayerId(created.code, id)
          onRoomReady(created.code)
        }}
        onJoinRoom={async (code, nickname) => {
          const upperCode = code.toUpperCase()
          const id = getOrCreatePlayerId(upperCode)
          await joinRoomOnServer(upperCode, id, nickname || 'Player')
          onRoomReady(upperCode)
        }}
      />
    )
  }

  const currentRoom = room
  const self = currentRoom.players.find((p) => p.id === selfId)
  const allReady = currentRoom.players.length >= game.minPlayers && currentRoom.players.every((p) => p.ready)
  const ModePicker = game.modePickerComponent
  const inviteUrl = `${window.location.origin}/play/${game.id}/lobby?room=${room.code}`

  async function toggleReady() {
    if (!self) return
    await setPlayerReady(self.id, !self.ready)
  }

  async function startGame() {
    const payload = game.getStartPayload?.() ?? ''
    await startRace(currentRoom.code, payload)
    onStart(currentRoom.code)
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-2xl flex items-center justify-between mb-6 sm:mb-10">
        <button onClick={handleExit} className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          {game.name}
        </button>
        <button onClick={handleExit} className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Leave room
        </button>
      </header>

      <main className="w-full max-w-2xl flex-1 space-y-5 sm:space-y-6 animate-pop-in">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Room code</p>
          <p className="text-4xl sm:text-5xl font-bold tracking-[0.2em] text-violet-300">{room.code}</p>
          <InviteLinkButton url={inviteUrl} />
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm font-medium text-neutral-300">
              Players ({room.players.length}/{game.maxPlayers})
            </p>
            <p className="text-xs text-neutral-500">
              {game.minPlayers}–{game.maxPlayers} players needed
            </p>
          </div>
          <div className="space-y-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 sm:px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color, boxShadow: `0 0 8px 1px ${p.color}66` }}
                  />
                  <span className="font-medium truncate">{p.nickname}</span>
                  {p.isHost && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-300/80 border border-amber-400/25 rounded-full px-2 py-0.5 shrink-0">
                      Host
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ml-2 ${p.ready ? 'text-emerald-400' : 'text-neutral-500'}`}
                >
                  {p.ready ? 'Ready' : 'Not ready'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {ModePicker && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="text-sm font-medium text-neutral-300 mb-3">
              Mode {!self?.isHost && <span className="text-neutral-500 font-normal">(set by host)</span>}
            </p>
            <ModePicker
              mode={room.mode}
              disabled={!self?.isHost}
              onChange={(mode) => setRoomMode(currentRoom.code, mode).catch(() => {})}
            />
          </div>
        )}

        {self && !self.isHost && (
          <button
            onClick={toggleReady}
            className={`w-full py-3 rounded-2xl font-semibold transition-colors ${
              self.ready
                ? 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                : 'bg-violet-500 hover:bg-violet-400 text-white'
            }`}
          >
            {self.ready ? 'Not ready' : "I'm ready"}
          </button>
        )}

        {self?.isHost && (
          <button
            onClick={startGame}
            disabled={!allReady}
            className="w-full py-4 rounded-2xl bg-violet-500 hover:bg-violet-400 active:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white font-semibold text-lg shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)]"
          >
            {room.players.length < game.minPlayers
              ? `Waiting for ${game.minPlayers - room.players.length} more player${
                  game.minPlayers - room.players.length === 1 ? '' : 's'
                }`
              : allReady
                ? 'Start Game'
                : 'Waiting for everyone to be ready'}
          </button>
        )}

        <RoomLeaderboard roomCode={room.code} />
      </main>
    </div>
  )
}

function InviteLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-700 hover:border-violet-400 hover:text-violet-300 transition-colors text-sm font-medium"
    >
      {copied ? 'Link copied!' : '🔗 Copy invite link'}
    </button>
  )
}

function JoinScreen({
  game,
  prefillRoomCode,
  onCreateRoom,
  onJoinRoom,
  onExit,
}: {
  game: GameDefinition
  prefillRoomCode: string | null
  onCreateRoom: (nickname: string) => Promise<void>
  onJoinRoom: (code: string, nickname: string) => Promise<void>
  onExit: () => void
}) {
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState(prefillRoomCode ?? '')
  const [joinMode, setJoinMode] = useState<'create' | 'join'>(prefillRoomCode ? 'join' : 'create')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setBusy(true)
    try {
      if (joinMode === 'create') {
        await onCreateRoom(nickname.trim())
      } else {
        if (joinCode.trim().length !== 4) {
          setError('Enter the 4-character room code.')
          return
        }
        await onJoinRoom(joinCode.trim(), nickname.trim())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-md flex items-center justify-between mb-6 sm:mb-10">
        <button onClick={onExit} className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          {game.name}
        </button>
        <button onClick={onExit} className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Back
        </button>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col justify-center space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{game.name}</h1>
          <p className="text-neutral-400 text-sm">{game.tagline}</p>
          {prefillRoomCode && (
            <p className="text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2 inline-block">
              You&apos;ve been invited to join room {prefillRoomCode}
            </p>
          )}
        </div>

        <div className="flex rounded-xl border border-neutral-800 p-1 bg-neutral-900/60">
          <button
            onClick={() => setJoinMode('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              joinMode === 'create' ? 'bg-violet-500/15 text-violet-300' : 'text-neutral-400'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setJoinMode('join')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              joinMode === 'join' ? 'bg-violet-500/15 text-violet-300' : 'text-neutral-400'
            }`}
          >
            Join Room
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">Your nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter a nickname"
              maxLength={20}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-violet-400 transition-colors"
            />
          </div>

          {joinMode === 'join' && (
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">Room code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm tracking-[0.3em] text-center uppercase outline-none focus:border-violet-400 transition-colors"
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 transition-colors text-white font-semibold"
          >
            {busy ? 'Please wait…' : joinMode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </div>
      </main>
    </div>
  )
}
