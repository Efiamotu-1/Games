import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-4">
          <p className="text-lg font-semibold">Something went wrong.</p>
          <p className="text-sm text-neutral-500 max-w-md">{this.state.error.message}</p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 transition-colors text-white font-semibold text-sm"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
