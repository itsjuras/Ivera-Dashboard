import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dashboardRoutes from './routes/dashboard'
import bookingRoutes from './routes/bookings'
import clientRoutes from './routes/clients'
import paymentRoutes from './routes/payments'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'

dotenv.config()

const app = express()

const allowedOrigins = [
  'https://ivera.ca',
  'https://www.ivera.ca',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Ensure OPTIONS preflight is handled for all routes
app.options('*', cors())

app.use(express.json())

app.use('/api/dashboard', dashboardRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
