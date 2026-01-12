import { Google, GitHub, OAuth2Client, Spotify } from 'arctic'

export type ArcticClient = Google | GitHub | Spotify | OAuth2Client

export type OauthProvider = 'google' | 'spotify' | 'fitbit' | 'github'

export interface AuthConfig {
  name: OauthProvider
  clientId: string
  clientSecret?: string
  scopes: string[]
  authEndpoint?: string
  tokenEndpoint?: string
}

export class GoogleAuthConfig implements AuthConfig {
  name: OauthProvider = 'google'
  clientId = process.env.GOOGLE_CLIENT_ID!
  clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  scopes = ['openid', 'profile']
}

export class GithubAuthConfig implements AuthConfig {
  name: OauthProvider = 'github'
  clientId = process.env.GITHUB_CLIENT_ID!
  clientSecret = process.env.GITHUB_CLIENT_SECRET!
  scopes = ['user']
}

export class SpotifyAuthConfig implements AuthConfig {
  name: OauthProvider = 'spotify'
  clientId = process.env.SPOTIFY_CLIENT_ID!
  scopes = []
}

export class FitbitAuthConfig implements AuthConfig {
  name: OauthProvider = 'fitbit'
  clientId = process.env.FITBIT_CLIENT_ID!
  scopes = []
  authEndpoint = 'https://www.fitbit.com/oauth2/authorize'
  tokenEndpoint = 'https://api.fitbit.com/oauth2/token'
}
