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
import clasificacionRoutes from './routes/clasificacion.js';  
import * as dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pinoHttp(loggerHttp)
dotenv.config();

export const app = express()

  
const allowedOrigins = [
    'https://adrenalux.duckdns.org', 
    'http://localhost:5173',
    'http://localhost:57176'
];

app.use(cors({
origin: allowedOrigins, 
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
credentials: true
}));


app.options('*', cors());

app.set('port', process.env.PORT || 3000)
app.set('trust proxy', true)

app.use((req, res, next) => {
    res.removeHeader("Origin-Agent-Cluster");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: false, 
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "https: data:"]
        }
    }
}));

app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'dev') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
});

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
app-use('/api/v1/clasificacion', clasificacionRoutes);


app.use('/public/swagger-ui', express.static(path.join(__dirname, 'public/swagger-ui')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/public/images/sobres', express.static(path.join(__dirname, 'public/images/sobres')));

app.use('/api-docs', 
swaggerUi.serve, 
    swaggerUi.setup(swaggerDocs, {
        customCssUrl: '/public/swagger-ui/swagger-ui.css',
        customJs: [
        '/public/swagger-ui/swagger-ui-bundle.js',
        '/public/swagger-ui/swagger-ui-standalone-preset.js'
        ],
        swaggerOptions: {
        url: '/api-docs.json' 
        }
    })
);

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
});

app.use(errorHandler)
