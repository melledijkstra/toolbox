import * as browser from 'webextension-polyfill'
import { AuthConfig, AuthClient as BaseAuthClient } from '@melledijkstra/auth'
import { ExtensionStorage } from './storage'

export class AuthClient extends BaseAuthClient {
  constructor(provider: AuthConfig) {
    const redirectUrl = browser.identity.getRedirectURL()
    console.log({ redirectUrl })
    super(provider, redirectUrl, {
      storage: new ExtensionStorage(),
    })
  }

  async getAuthToken(interactive?: boolean): Promise<string | undefined> {
    const authUrl = this.createAuthUrl()

    console.log(authUrl.toString())

    const resultUrl = await browser.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive,
    })

    // "https://kaeibbjbbioodhkpgclmhdhnoggcikhi.chromiumapp.org/?code=6846e1a8a2923335166107ac273f815110879f58&state=g1wRIMSuJQ4DJXNAsKkNBo9CVShp9nLS61u3YoOZc8c#_=_"

    const url = new URL(resultUrl)

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    const tokenData = await this.validate(code, state)

    return tokenData.accessToken()
  }
}
