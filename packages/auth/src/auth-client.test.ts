import { AuthClient } from './auth-client'
import { GoogleAuthConfig } from './providers'

describe('AuthClient', () => {
  it('should generate auth URL correctly', async () => {
    const client = new AuthClient(new GoogleAuthConfig(), 'http://localhost:3000/callback')

    const authUrl = client.createAuthUrl()

    const { state } = client.getContext()

    expect(authUrl.search).toEqual(expect.stringContaining(`state=${state}`))
    expect(authUrl.origin).toEqual(expect.stringContaining(
      `https://accounts.google.com`,
    ))
  })
})
