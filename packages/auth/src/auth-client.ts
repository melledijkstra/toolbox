import { ArcticFetchError, CodeChallengeMethod, OAuth2RequestError, generateCodeVerifier, generateState, Google, GitHub, Spotify, OAuth2Client, OAuth2Tokens } from 'arctic'
import { Logger } from '@melledijkstra/toolbox'
import { IStorage, MemoryCache } from '@melledijkstra/storage'
import type { ArcticClient, AuthConfig } from './providers'
export type { OauthProvider } from './providers'

type BadAuthReason = 'invalid_token'

class AuthError extends Error {
  provider: string
  reason: BadAuthReason

  constructor(message: string, reason: BadAuthReason, provider: string) {
    super(message)
    this.name = 'AuthError'
    this.reason = reason
    this.provider = provider
  }
}

const OAUTH2_STORAGE_KEY = 'oauth2'

type TokenStore = {
  access_token: string
  expires_at: number
  refresh_token: string
}

export class AuthClient {
  private _state: string | undefined
  private _codeVerifier: string | undefined
  private _authclient: ArcticClient
  private _storage: IStorage
  private _logger: Logger
  provider: AuthConfig

  constructor(provider: AuthConfig, redirectUrl: string, {
    storage = new MemoryCache(),
  }: {
    storage?: IStorage
  } = {}) {
    this.provider = provider
    this._logger = new Logger(`auth:${provider.name}`)
    this._storage = storage
    switch (provider.name) {
      case 'google':
        this._authclient = new Google(provider.clientId, provider.clientSecret, redirectUrl)
        break
      case 'spotify':
        this._authclient = new Spotify(provider.clientId, provider.clientSecret, redirectUrl)
        break
      case 'fitbit':
        this._authclient = new OAuth2Client(provider.clientId, provider.clientSecret, redirectUrl)
        break
      case 'github':
        this._authclient = new GitHub(provider.clientId, provider.clientSecret, redirectUrl)
        break
    }
  }

  get storageKey() {
    return `${OAUTH2_STORAGE_KEY}.${this.provider.name}`
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken()

      this._logger.log({ token })

      return !!token
    }
    catch {
      return false
    }
  }

  static isExpired(token: TokenStore) {
    return Date.now() > token.expires_at - 60_000
  }

  async authenticate(): Promise<boolean> {
    const token = await this.getAuthToken()
    return !!token
  }

  async deauthenticate(): Promise<boolean> {
    this._logger.log('deauthenticating')
    const token = await this._storage.get<OAuth2Tokens>(this.storageKey)
    if (token) {
      await this.revokeAuthToken(token.accessToken())
    }
    return true
  }

  async getAuthTokenFromStorage(): Promise<TokenStore | undefined> {
    const storeToken = this._storage.get<TokenStore>(this.storageKey)
    return storeToken
  }

  async revokeAuthToken(token: string) {
    try {
      if (this._authclient instanceof Google) {
        await this._authclient.revokeToken(token)
      }
      else {
        throw new Error('Not implemented for other providers!')
      }
    }
    catch (e) {
      if (e instanceof OAuth2RequestError) {
        // Invalid tokens, credentials, or redirect URI
        const code = e.code
        this._logger.warn('Could not revoke token', {
          code,
          token,
        })
      }
      else if (e instanceof ArcticFetchError) {
        // Failed to call `fetch()`
        this._logger.error('Failed to revoke token', {
          e,
          token,
        })
      }
      else {
        this._logger.error('Unknown error while revoking token', {
          e,
          token,
        })
      }
    }
    const storeToken = await this._storage.get<TokenStore>(this.storageKey)
    return storeToken
  }

  async removeAuthTokenFromStorage() {
    await this._storage.delete(this.storageKey)
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuth2Tokens | null> {
    let tokenData: OAuth2Tokens

    if (this._authclient instanceof Google
      || this._authclient instanceof GitHub
      || this._authclient instanceof Spotify
    ) {
      tokenData = await this._authclient.refreshAccessToken(refreshToken)
    }
    else {
      tokenData = await this._authclient.refreshAccessToken(this.provider.tokenEndpoint, refreshToken, this.provider.scopes)
    }

    return tokenData
  }

  async getTokenFromStoreOrRefreshToken(): Promise<string | undefined> {
    const storeToken = await this.getAuthTokenFromStorage()

    let { access_token } = storeToken ?? {}
    const { refresh_token, expires_at } = storeToken ?? {}

    this._logger.log('token in storage?', { storeToken })

    // Subtract some buffer (60 seconds) to ensure we refresh before actual expiry
    const isTokenExpired = !expires_at || Date.now() > expires_at - 60_000

    if (isTokenExpired && refresh_token) {
      try {
        this._logger.log('token expired, trying to refresh it')
        // Refresh the token
        const newTokens = await this.refreshAccessToken(refresh_token)

        if (!newTokens) {
          throw new Error(
            'Failed to refresh token - user must re-authenticate.',
          )
        }

        access_token = newTokens.accessToken()
        this._logger.log('refreshed new access token, storing it and continue')
        this.cacheAuthToken(
          newTokens.accessToken(),
          // if provider doesn’t return a new refresh token, keep the old one
          newTokens.refreshToken() ?? refresh_token,
          newTokens.accessTokenExpiresInSeconds(),
        )
      }
      catch (error) {
        if (error instanceof AuthError && error.reason === 'invalid_token') {
          // if the error is an AuthError, remove the stored token
          // so that the user can re-authenticate
          await this._storage.delete(this.storageKey)
        }
      }
    }

    return access_token
  }

  async cacheAuthToken(
    access_token: string,
    refresh_token: string,
    expires_in: number,
  ) {
    const tokenStore: TokenStore = {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    }

    this._storage.set(this.storageKey, tokenStore)
  }

  createAuthUrl(): URL {
    this._state = generateState()
    this._codeVerifier = generateCodeVerifier()
    const { scopes } = this.provider

    if (this._authclient instanceof OAuth2Client) {
      return this._authclient.createAuthorizationURLWithPKCE(
        this.provider.authEndpoint, this._state, CodeChallengeMethod.S256,
        this._codeVerifier, scopes,
      )
    }
    else if (this._authclient instanceof Google
      || this._authclient instanceof Spotify) {
      return this._authclient.createAuthorizationURL(this._state, this._codeVerifier, scopes)
    }
    else if (this._authclient instanceof GitHub) {
      return this._authclient.createAuthorizationURL(this._state, scopes)
    }
  }

  async validate(code: string, state: string): Promise<OAuth2Tokens> {
    if (!code || !this._state || state !== this._state || !this._codeVerifier) {
      throw new Error('Code or state mismatch')
    }

    this._logger.log({
      code,
      savedCode: this._codeVerifier,
    })

    if (this._authclient instanceof OAuth2Client) {
      return await this._authclient.validateAuthorizationCode(this.provider.tokenEndpoint, code, this._codeVerifier)
    }

    return await this._authclient.validateAuthorizationCode(code, this._codeVerifier)
  }

  getContext() {
    return {
      state: this._state,
      codeVerifier: this._codeVerifier,
    }
  }

  async getAuthToken(interactive = false): Promise<string | undefined> {
    const storedToken = await this.getTokenFromStoreOrRefreshToken()

    if (storedToken) {
      this._logger.log('we have a refreshed or stored token, lets use it', {
        storedToken,
      })
      return storedToken
    }
    else if (!interactive) {
      this._logger.log(
        'no token retrieved, but not interactive, so returning nothing',
      )
      return
    }

    this._logger.log(
      'no token retrieved in any way, continue with normal oauth2 flow...',
    )

    const url = this.createAuthUrl()
    this._logger.log('Generated Auth URL:', url.href)
  }
}
