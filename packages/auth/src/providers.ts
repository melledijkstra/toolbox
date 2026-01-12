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
  clientId: string
  scopes = ['openid', 'profile']
  authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth'
  tokenEndpoint = 'https://oauth2.googleapis.com/token'

  constructor(clientId: string) {
    this.clientId = clientId
  }
}

export class SpotifyAuthConfig implements AuthConfig {
  name: OauthProvider = 'spotify'
  clientId: string
  scopes = []
  authEndpoint = 'https://accounts.spotify.com/authorize'
  tokenEndpoint = 'https://accounts.spotify.com/api/token'

  constructor(clientId: string) {
    this.clientId = clientId
  }
}

export class FitbitAuthConfig implements AuthConfig {
  name: OauthProvider = 'fitbit'
  clientId: string
  scopes = []
  authEndpoint = 'https://www.fitbit.com/oauth2/authorize'
  tokenEndpoint = 'https://api.fitbit.com/oauth2/token'

  constructor(clientId: string) {
    this.clientId = clientId
  }
}
