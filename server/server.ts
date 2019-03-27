import * as http from 'http'
import * as express from 'express'
import * as session from 'express-session'
import * as cookieParser from 'cookie-parser'
import * as helmet from 'helmet'
import * as compression from 'compression'
import * as morgan from 'morgan'
import * as cors from 'cors'
import * as passport from 'passport'
import * as socketIO from 'socket.io'
import { Datastore } from '@google-cloud/datastore'
import * as ConnectDatastore from '@google-cloud/connect-datastore'
import { nextHandler } from './nextApp'
import * as controllers from './controllers'
import { validateAPIKey } from './lib/middleware'

export type AuthenticationProvider = 'discord' | 'forums' | 'teamspeak'
export interface AuthenticationAttempt {
  success: boolean
  provider: AuthenticationProvider
  next: AuthenticationProvider | null
}

export const expressApp: express.Express = express()
expressApp.set('port', process.env.PORT || 8080)
expressApp.use(morgan('dev'))
expressApp.use(helmet())
expressApp.use(compression())
expressApp.use(cookieParser())
expressApp.use(express.json())
expressApp.use(express.urlencoded({ extended: false }))

const SessionDataStore = ConnectDatastore(session)
expressApp.use(
  session({
    store: new SessionDataStore({
      dataset: new Datastore({
        namespace: 'sessions',
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: require('../keys/datastore-svc-key.json')
      })
    }),
    name: 'sessionId',
    secret: `${process.env.DISCORD_CLIENT_SECRET}${process.env.FORUMS_API_KEY}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 60 * 1000)
    }
  })
)

expressApp.use(passport.initialize())
expressApp.use(passport.session())

passport.use(controllers.DiscordAuth)
passport.serializeUser((user: unknown, done: any) => {
  done(null, user)
})
passport.deserializeUser((user: unknown, done: any) => {
  done(null, user)
})

expressApp.get('/api/oauth2/discord', passport.authenticate('oauth2'))
expressApp.get(
  '/api/oauth2/discord/callback',
  passport.authenticate('oauth2', {
    failureRedirect: '/api/oauth2/complete?ref=discord&status=fail'
  }),
  (_req: express.Request, res: express.Response) => {
    res.redirect('/api/oauth2/complete?ref=discord&status=success')
  }
)

expressApp.get('/api/oauth2/forums', controllers.verifyForums)
expressApp.get('/api/oauth2/teamspeak', controllers.verifyTeamspeak)
expressApp.get('/api/oauth2/complete', controllers.completeAuthProvider)
expressApp.put('/api/save', controllers.addAuthenticatedUser)
expressApp.post('/api/token', cors(), validateAPIKey, controllers.issueToken)
expressApp.get('/api/user', cors(), validateAPIKey, controllers.getUserInfo)
expressApp.get('*', (req, res) => {
  nextHandler(req, res)
})

export const server: http.Server = new http.Server(expressApp)
export const io: socketIO.Server = socketIO(server, {
  serveClient: false,
  cookie: 'ioId'
})

io.sockets.on('connection', socket => {
  console.log(`Socket: ${socket.id}`)
})
