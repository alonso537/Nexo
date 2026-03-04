import { createApp } from "./app"

export const startServer = () => {
    const app = createApp()

    const server = app.listen(8000, () => {
        console.log(`Nexo running on port 8000`)
    })

    return server;
}