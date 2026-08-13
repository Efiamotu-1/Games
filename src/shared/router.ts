import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'solo'; gameId: string }
  | { name: 'lobby'; gameId: string; roomCode: string | null }
  | { name: 'play'; gameId: string; roomCode: string }

function parseLocation(): Route {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)
  const roomCode = params.get('room')?.toUpperCase() || null

  const soloMatch = path.match(/^\/play\/([^/]+)\/solo\/?$/)
  if (soloMatch) return { name: 'solo', gameId: soloMatch[1] }

  const playMatch = path.match(/^\/play\/([^/]+)\/race\/?$/)
  if (playMatch && roomCode) return { name: 'play', gameId: playMatch[1], roomCode }

  const lobbyMatch = path.match(/^\/play\/([^/]+)\/lobby\/?$/)
  if (lobbyMatch) return { name: 'lobby', gameId: lobbyMatch[1], roomCode }

  return { name: 'home' }
}

function routeToUrl(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/'
    case 'solo':
      return `/play/${route.gameId}/solo`
    case 'lobby':
      return route.roomCode ? `/play/${route.gameId}/lobby?room=${route.roomCode}` : `/play/${route.gameId}/lobby`
    case 'play':
      return `/play/${route.gameId}/race?room=${route.roomCode}`
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseLocation())

  useEffect(() => {
    function handlePopState() {
      setRoute(parseLocation())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(next: Route, options?: { replace?: boolean }) {
    const url = routeToUrl(next)
    if (options?.replace) {
      window.history.replaceState(null, '', url)
    } else {
      window.history.pushState(null, '', url)
    }
    setRoute(next)
  }

  return { route, navigate }
}
