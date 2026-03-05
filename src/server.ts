import { createApp } from "./app"
import { env } from "./config/env"

export const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const app = createApp()

    const server = app.listen(env.PORT, () => {
      console.log(`Nexo running on port ${env.PORT} in ${env.NODE_ENV} mode`)
      resolve()
    })

    server.on('error', reject)
  })
}