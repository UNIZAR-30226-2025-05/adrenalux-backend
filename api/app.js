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
import plantillasRoutes from './routes/plantillas.js';
import mercadoRoutes from './routes/mercado.js';  
import * as dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pinoHttp(loggerHttp)
dotenv.config();

export const app = express()

const host = '54.37.50.18:3000';

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.set('port', process.env.PORT || 3000)
app.set('trust proxy', true)

app.use((req, res, next) => {
    res.removeHeader("Origin-Agent-Cluster");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    next();
});

app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, 'https://' + req.get('host') + req.url);
    }
    next();
});

app.use(helmet());
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
app.use('/api/v1/plantillas', plantillasRoutes);  
app.use('/public/swagger-ui', express.static(path.join(__dirname, 'public/swagger-ui')));
app.use('/public', express.static(path.join(__dirname, 'public'))); 
app.use('/public/images', express.static(path.join(__dirname, 'public', 'images')));

app.use('/api-docs', 
    swaggerUi.serve, 
swaggerUi.setup(swaggerDocs, {
        customCssUrl: 'https://54.37.50.18:3000/public/swagger-ui/swagger-ui.css', 
        customJs: [
        'https://54.37.50.18:3000/public/swagger-ui/swagger-ui-bundle.js',
        'https://54.37.50.18:3000/public/swagger-ui/swagger-ui-standalone-preset.js'
        ],
        swaggerOptions: {
        requestInterceptor: (req) => {
            req.url = req.url.replace('http://', 'https://');
            return req;
        }
        }
    })
);
  

app.use(errorHandler)
