export type OauthProvider = 'google' | 'spotify' | 'fitbit'

export interface AuthConfig {
  name: OauthProvider
  clientId: string
  scopes: string[]
  authEndpoint: string
  tokenEndpoint: string
}

export class GoogleAuthConfig implements AuthConfig {
  name: OauthProvider = 'google'
  clientId = process.env.GOOGLE_CLIENT_ID ?? ''
  scopes = ['openid', 'profile']
  authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth'
  tokenEndpoint = 'https://oauth2.googleapis.com/token'
}

export class SpotifyAuthConfig implements AuthConfig {
  name: OauthProvider = 'spotify'
  clientId = process.env.SPOTIFY_CLIENT_ID ?? ''
  scopes = []
  authEndpoint = 'https://accounts.spotify.com/authorize'
  tokenEndpoint = 'https://accounts.spotify.com/api/token'
}

export class FitbitAuthConfig implements AuthConfig {
  name: OauthProvider = 'fitbit'
  clientId = process.env.FITBIT_CLIENT_ID ?? ''
  scopes = []
  authEndpoint = 'https://www.fitbit.com/oauth2/authorize'
  tokenEndpoint = 'https://api.fitbit.com/oauth2/token'
}
