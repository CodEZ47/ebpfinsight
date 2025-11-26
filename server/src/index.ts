import app from './app'
import prisma from './prisma'

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000

const start = async () => {
  try {
    await prisma.$connect()
    await app.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
