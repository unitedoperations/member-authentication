import * as React from 'react'
import { Card } from 'semantic-ui-react'
import AuthenticationPanel from './AuthenticationPanel'
import { AuthenticationProvider, AuthenticationAttempt } from '../server/server'
import { emitter } from '../pages/index'

export interface AuthenticationPanelListProps {
  socket: SocketIOClient.Socket
  enabled: boolean
}

export type AuthMethod = {
  name: string
  image: string
  enabled: boolean
  status: string
}

export interface AuthenticationPanelListState {
  shouldSubscribe: boolean
  subscribed: boolean
  methods: Record<AuthenticationProvider, AuthMethod>
}

class AuthenticationPanelList extends React.Component<
  AuthenticationPanelListProps,
  AuthenticationPanelListState
> {
  state = {
    shouldSubscribe: false,
    subscribed: false,
    methods: {
      discord: {
        name: 'Discord',
        image: 'Discord-Logo-Color.png',
        enabled: true,
        status: 'unstarted'
      },
      forums: {
        name: 'Forums',
        image: 'uo-logo.png',
        enabled: false,
        status: 'unstarted'
      },
      teamspeak: {
        name: 'TeamSpeak',
        image: 'ts_stacked_blueblack.png',
        enabled: false,
        status: 'unstarted'
      }
    }
  }

  static getDerivedStateFromProps(
    props: AuthenticationPanelListProps,
    state: AuthenticationPanelListState
  ) {
    if (props.socket && !state.shouldSubscribe) return { shouldSubscribe: true }
    return null
  }

  subscribe = () => {
    if (this.state.shouldSubscribe && !this.state.subscribed) {
      this.props.socket.on('auth_attempt', this.handleAuthAttempt)
      this.props.socket.on('auth_error', this.handleAuthError)
      this.props.socket.on('auth_complete', this.handleAuthComplete)
      this.setState({ subscribed: true })
    }
  }

  handleAuthAttempt = (data: AuthenticationAttempt) => {
    const { provider, next } = data
    if (!data.success) {
      this.setState(prev => ({
        methods: {
          ...prev.methods,
          [provider]: { ...prev.methods[provider], status: 'failed' }
        }
      }))
    } else {
      this.setState(
        prev => ({
          methods: {
            ...prev.methods,
            [provider]: { ...prev.methods[provider], status: 'success' }
          }
        }),
        () => {
          if (next)
            this.setState(prev => ({
              methods: {
                ...prev.methods,
                [next]: {
                  ...prev.methods[next],
                  enabled: true
                }
              }
            }))
        }
      )
    }
  }

  handleAuthError = (data: unknown) => {
    alert(JSON.stringify(data))
  }

  handleAuthComplete = (username: string) => {
    emitter.emit('done', username)
  }

  componentDidMount() {
    this.props.socket.connect()
    this.subscribe()
  }

  componentDidUpdate() {
    this.subscribe()
  }

  componentWillUnmount() {
    this.props.socket.disconnect()
    this.props.socket.off('auth_attempt', this.handleAuthAttempt)
  }

  render() {
    return (
      <Card.Group className="auth-method--group" itemsPerRow={3}>
        {Object.values(this.state.methods).map((m: AuthMethod, i: number) => (
          <AuthenticationPanel
            key={i}
            enabled={m.enabled && m.status !== 'success'}
            status={m.status}
            name={m.name}
            image={m.image}
          />
        ))}
      </Card.Group>
    )
  }
}

export default AuthenticationPanelList
