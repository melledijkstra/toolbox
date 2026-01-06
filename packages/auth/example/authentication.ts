import * as arctic from 'arctic'
import { createServer } from 'http'

const clientId = 'Ov23lioctam5x2hDw2bM'
const clientSecret = '24b0a4017da6bfead67affd9107f4d08a9c5e402'
const scopes = ['user']

const PORT = 8000
const redirectUrl = `http://localhost:${PORT}/oauth/callback`

const authClient = new arctic.GitHub(clientId, clientSecret, redirectUrl)

console.log('Trying to authenticate...')

const state = arctic.generateState()

const authUrl = authClient.createAuthorizationURL(state, scopes)

console.log(authUrl.href)

const server = createServer(async (req, res) => {
  const requestUrl = URL.parse(req.url!, `http://localhost:${PORT}`)

  // Filter for the callback route
  if (requestUrl?.pathname === '/oauth/callback') {
    const code = requestUrl.searchParams.get('code')!

    try {
      // 5. Exchange Code for Tokens
      const tokens = await authClient.validateAuthorizationCode(code)

      console.log('\nSUCCESS! Save these credentials safely:')
      console.log('-----------------------------------------')
      console.log(`ACCESS_TOKEN: ${tokens.accessToken()}`)
      console.log(`REFRESH_TOKEN: ${tokens.hasRefreshToken() ? tokens.refreshToken() : 'N/A'}`)
      console.log('-----------------------------------------')
      console.log('data: ', tokens.data)

      res.end('Authentication successful! You can close this tab.')
    }
    catch (e) {
      console.error(e)
      res.end('Authentication failed.')
    }
    finally {
      server.close()
      process.exit(0)
    }
  }

  res.statusCode = 404
  res.end('Not found!')
})

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}...`)
})
