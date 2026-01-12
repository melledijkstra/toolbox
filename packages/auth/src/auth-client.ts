import { ArcticFetchError, CodeChallengeMethod, OAuth2Client, OAuth2RequestError, generateCodeVerifier, generateState } from 'arctic'
import { Logger } from '@melledijkstra/toolbox'
import { IStorage, MemoryCache } from '@melledijkstra/storage'
import type { AuthConfig } from './providers'
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

type TokenResponse = {
  access_token: string
  expires_in: number
  id_token: string
  refresh_token?: string
  scope?: string
  token_type?: string
}

type TokenStore = {
  access_token: string
  expires_at: number
  refresh_token: string
}

export class AuthClient {
  private _state: string | undefined
  private _codeVerifier: string | undefined
  private _authclient: OAuth2Client
  private _storage: IStorage
  private _logger: Logger
  provider: AuthConfig

  constructor(provider: AuthConfig, redirectUrl: string, clientSecret: string, {
    client,
    storage = new MemoryCache(),
  }: {
    client?: OAuth2Client
    storage?: IStorage
  } = {}) {
    this.provider = provider
    this._logger = new Logger(`auth:${provider.name}`)
    this._storage = storage
    if (client) {
      this._authclient = client
    }
    else {
      // clientSecret is passed but might be empty for public clients (like browser extensions)
      // if arctic requires it, it should be provided.
      this._authclient = new OAuth2Client(this.provider.clientId, clientSecret, redirectUrl)
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
    const token = this._storage.get<TokenStore>(this.storageKey)
    if (token) {
      await this.revokeAuthToken(token.access_token)
    }
    return true
  }

  async getAuthTokenFromStorage(): Promise<TokenStore | undefined> {
    const storeToken = this._storage.get<TokenStore>(this.storageKey)
    return storeToken
  }

  async revokeAuthToken(token: string) {
    try {
      await this._authclient.revokeToken(this.provider.tokenEndpoint, token)
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
    await this._storage.remove(this.storageKey)
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<TokenResponse | null> {
    const config = this.provider

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      this._logger.error('Refresh token request failed:', errorBody)
      if (errorBody.includes('invalid_grant')) {
        throw new AuthError(
          `Failed to refresh token: ${errorBody}`,
          'invalid_token',
          this.provider.name,
        )
      }
      return null
    }

    const tokenData = (await response.json()) as TokenResponse
    this._logger.log('refreshed token data', tokenData)

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

        access_token = newTokens.access_token
        this._logger.log('refreshed new access token, storing it and continue')
        this.cacheAuthToken(
          newTokens.access_token,
          // if provider doesn’t return a new refresh token, keep the old one
          newTokens.refresh_token ?? refresh_token,
          newTokens.expires_in,
        )
      }
      catch (error) {
        if (error instanceof AuthError && error.reason === 'invalid_token') {
          // if the error is an AuthError, remove the stored token
          // so that the user can re-authenticate
          await this._storage.remove(this.storageKey)
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

  createAuthUrl() {
    this._state = generateState()
    this._codeVerifier = generateCodeVerifier()
    const { scopes } = this.provider

    return this._authclient.createAuthorizationURLWithPKCE(
      this.provider.authEndpoint,
      this._state,
      CodeChallengeMethod.S256,
      this._codeVerifier,
      scopes,
    )
  }

  async validate(code: string, state: string) {
    if (!code || !this._state || state !== this._state || !this._codeVerifier) {
      throw new Error('Code or state mismatch')
    }

    this._logger.log({
      code,
      savedCode: this._codeVerifier,
    })

    return await this._authclient.validateAuthorizationCode(this.provider.tokenEndpoint, code, this._codeVerifier)
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
