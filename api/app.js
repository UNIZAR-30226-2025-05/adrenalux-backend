import { loggerHttp } from './config/logger.js'
import { errorHandler } from './middlewares/error.js'
import { timestamp } from './middlewares/timestamp.js'
import authRouter from './routes/auth.js'
import healthRouter from './routes/health.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './config/swagger.js'; 
import cartasRoutes from './routes/carta.js';
import coleccionRoutes from './routes/coleccion.js';
import profileRouter from './routes/profile.js'
import partidasRouter from './routes/partidas.js'
import jugadoresRouter from './routes/jugadores.js'
import mercadoRoutes from './routes/mercado.js';  
import * as dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pinoHttp(loggerHttp)
dotenv.config();

export const app = express()

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set('port', process.env.PORT || 3000)
app.set('trust proxy', true)

app.use(helmet())
app.use(cors())
app.use(logger)
app.use(cookieParser(process.env.SECRET_KEY))
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/', timestamp)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/cartas', cartasRoutes);
app.use('/api/v1/coleccion', coleccionRoutes);
app.use('/api/v1/profile', profileRouter)
app.use('/api/v1/partidas', partidasRouter)
app.use('/api/v1/jugadores', jugadoresRouter)
app.use('/api/v1/mercado', mercadoRoutes);  
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/public/images', express.static(path.join(__dirname, 'public', 'images')));

app.use(errorHandler)
