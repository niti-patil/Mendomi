import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const MISSING_KEY_MESSAGE = 'Paste GROQ_API_KEY into .env and restart the dev server.'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function groqProxyPlugin(apiKey) {
  const key = (apiKey || '').trim()
  return {
    name: 'groq-proxy',
    configureServer(server) {
      server.middlewares.use('/api/groq/chat/completions', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const finish = (status, payload) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }

        if (!key) {
          finish(503, { error: { message: MISSING_KEY_MESSAGE } })
          return
        }

        readBody(req)
          .then((body) => fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body,
          }))
          .then(async (upstream) => {
            const text = await upstream.text()
            res.statusCode = upstream.status
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
            res.end(text)
          })
          .catch((err) => {
            if (res.writableEnded) return
            finish(502, { error: { message: err.message || 'Groq request failed' } })
          })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  return {
    plugins: [react(), groqProxyPlugin(env.GROQ_API_KEY)],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
  }
})
