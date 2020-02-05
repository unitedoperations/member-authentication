import * as React from 'react'
import { Card } from 'semantic-ui-react'
import AuthenticationPanel from './AuthenticationPanel'
import { AuthenticationProvider, AuthenticationAttempt } from '../../server/server'
import { emitter } from '../../pages/index'

export interface AuthenticationPanelListProps {
  socket: SocketIOClient.Socket
  enabled: boolean
}

export type AuthMethod = {
  name: string
  image: string
  enabled: boolean
  status: string
  link: string
}

export interface AuthenticationPanelListState {
  shouldSubscribe: boolean
  subscribed: boolean
  methods: Record<AuthenticationProvider, AuthMethod>
}

class AuthenticationPanelList extends React.Component<AuthenticationPanelListProps, AuthenticationPanelListState> {
  state = {
    shouldSubscribe: false,
    subscribed: false,
    methods: {
      discord: {
        name: 'Discord',
        image: 'Discord-Logo-Color.png',
        enabled: true,
        status: 'unstarted',
        link: 'https://discordapp.com/invite/0WqRco0nennZY05d'
      },
      forums: {
        name: 'Forums',
        image: 'uo-logo.png',
        enabled: false,
        status: 'unstarted',
        link: 'https://unitedoperations.net/forums'
      },
      teamspeak: {
        name: 'TeamSpeak',
        image: 'ts_stacked_blueblack.png',
        enabled: false,
        status: 'unstarted',
        link: 'http://www.teamspeak.com/invite/ts3.unitedoperations.net/'
      }
    }
  }

  static getDerivedStateFromProps(props: AuthenticationPanelListProps, state: AuthenticationPanelListState) {
    if (props.socket && !state.shouldSubscribe) return { shouldSubscribe: true }
    return null
  }

  subscribe = () => {
    if (this.state.shouldSubscribe && !this.state.subscribed) {
      this.props.socket.on('auth_attempt', this.handleAuthAttempt)
      this.props.socket.on('auth_error', this.handleAuthError)
      this.props.socket.on('auth_complete', this.handleAuthComplete)
      this.props.socket.on('group_transfers', this.handleGroupTransfers)
      this.setState({ subscribed: true })
    }
  }

  handleGroupTransfers = (groups: { will: string[]; wont: string[] }) => {
    emitter.emit('groups', groups)
  }

  handleAuthAttempt = ({ success, provider, next }: AuthenticationAttempt) => {
    if (!success) {
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

  handleAuthError = () => {
    alert(
      'You could not be found on the Teamspeak server. Ensure that you are logged into the server prior to running this authenticator.'
    )
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
    this.props.socket.off('auth_error', this.handleAuthError)
    this.props.socket.off('auth_complete', this.handleAuthComplete)
    this.props.socket.off('group_transfers', this.handleGroupTransfers)
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
            link={m.link}
          />
        ))}
      </Card.Group>
    )
  }
}

export default AuthenticationPanelList
