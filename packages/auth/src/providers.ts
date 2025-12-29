export type OauthProvider = 'google' | 'spotify' | 'fitbit'

export interface AuthProvider {
  name: OauthProvider
  clientId: string
  scopes: string[]
  authEndpoint: string
  tokenEndpoint: string
}

export class GoogleAuthProvider implements AuthProvider {
  name: OauthProvider = 'google'
  clientId = process.env.VITE_GOOGLE_CLIENT_ID ?? ''
  scopes = []
  authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth'
  tokenEndpoint = 'https://oauth2.googleapis.com/token'
}

export class SpotifyAuthProvider implements AuthProvider {
  name: OauthProvider = 'spotify'
  clientId = process.env.VITE_SPOTIFY_CLIENT_ID ?? ''
  scopes = []
  authEndpoint = 'https://accounts.spotify.com/authorize'
  tokenEndpoint = 'https://accounts.spotify.com/api/token'
}

export class FitbitAuthProvider implements AuthProvider {
  name: OauthProvider = 'fitbit'
  clientId = process.env.VITE_FITBIT_CLIENT_ID ?? ''
  scopes = []
  authEndpoint = 'https://www.fitbit.com/oauth2/authorize'
  tokenEndpoint = 'https://api.fitbit.com/oauth2/token'
}

