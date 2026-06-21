"use client"

import { Component, type ReactNode } from "react"

interface Props {
  /** Human label for the section, shown in the fallback. */
  name: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render errors from a single dashboard section so one broken chart or
 * card can't blank the whole page. Each section gets its own boundary.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Surface in the console for debugging; no remote logging in v1.
    console.error(`[${this.props.name}] section failed to render`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-destructive">
            {this.props.name} couldn’t load
          </p>
          <p className="mt-1">
            Something went wrong rendering this section. The rest of your
            dashboard is unaffected.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
