import { loggerHttp } from './config/logger.js'
import { carta } from './db/schemas/carta.js'
import { errorHandler } from './middlewares/error.js'
import { timestamp } from './middlewares/timestamp.js'
import authRouter from './routes/auth.js'
import healthRouter from './routes/health.js'
import cartaRouter from './routes/carta.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './config/swagger.js'; 

const logger = pinoHttp(loggerHttp)

export const app = express()

app.set('port', process.env.PORT || 3000)
app.set('trust proxy', true)

app.use(helmet())
app.use(cors())
app.use(logger)
app.use(cookieParser(process.env.SECRET_KEY))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/api/v1/', timestamp)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/carta', cartaRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
//app.use('/api/v1/profile', profileRouter)

app.use(errorHandler)