import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dashboardRoutes from './routes/dashboard'
import bookingRoutes from './routes/bookings'
import clientRoutes from './routes/clients'
import paymentRoutes from './routes/payments'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api/dashboard', dashboardRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/payments', paymentRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
