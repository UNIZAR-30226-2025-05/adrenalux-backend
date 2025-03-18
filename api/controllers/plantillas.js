import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { plantilla } from '../db/schemas/plantilla.js';
import { carta } from '../db/schemas/carta.js';
import { carta_plantilla } from '../db/schemas/carta_plantilla.js';
import { obtenerCartasDeUsuario } from './coleccion.js';
import { getPosiciones } from './cartas.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { objectToJson } from '../lib/toJson.js';
import { eq } from 'drizzle-orm';

export async function crearPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { nombre } = req.body;
        if (!nombrePlantillaValido(nombre)) {
            return next(new BadRequest('Nombre de plantilla inválido'));
        }
        const plantillaInsertada = await db.insert(plantilla).values({ nombre, user_id: userId });
        const plantillaJson =  objectToJson(plantillaInsertada);

        return sendResponse(req, res, {plantillaJson});
    } catch (error) {
        return next(error);
    }
}

export async function obtenerPlantillas(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const plantillas = await db.select().from(plantilla).where(eq(plantilla.user_id, userId));
        plantillaJson = plantillas.map(plantilla => objectToJson(plantilla));

        return sendResponse(req, res, {plantillaJson});
    } catch (error) {
        return next(error);
    }
}

export async function actualizarPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, nuevoNombre } = req.params;
        if (!nombrePlantillaValido(nuevoNombre)) {
            return next(new BadRequest('Nombre de plantilla inválido'));
        }
        const plantillaActualizada = await db.update(plantilla).set({ nombre: nuevoNombre }).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
        const plantillaJson =  objectToJson(plantillaActualizada);
        return sendResponse(req, res, { plantillaJson});
    } catch (error) {
        return next(error);
    }
}

export async function eliminarPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId } = req.params;
        const plantillaResult = await db.select().from(plantilla).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
        if (plantillaResult.length === 0) {
            return next(new Unauthorized('No tienes permisos para eliminar esta plantilla'));
        }
        await db.delete(plantilla).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
        return sendResponse(req, res, { data: { message: 'Plantilla eliminada exitosamente' } });
    } catch (error) {
        return next(error);
    }
}

export async function devolverCartasPosicion(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { posicion } = req.params;
        if (posicionInvalida(posicion)) {
            return next(new BadRequest('Posición inválida'));
        }
        const { cartasUsuario } = await obtenerCartasDeUsuario(userId);
        const cartasFiltradas = cartasUsuario.filter(carta => carta.posicion === posicion);
        if (cartasFiltradas.length === 0) {
            return next( new Unauthorized({ message: 'No se encontraron cartas en esa posición' }));
        }
        cartasJson = cartasFiltradas.map(carta => objectToJson(carta));

        return sendResponse(req, res, { cartasJson});
    } catch (error) {
        return next(error);
    }
}

export async function agregarCartaAPlantilla  (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, cartaid, posicion } = req.params;

        const plantillaResult = await db.select().from(plantilla).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
        
        if (plantillaResult.length === 0) {   
            return next(new Unauthorized('No tienes permisos para modificar esta plantilla'));
        }

        if (posicionInvalida(posicion)) {
            return next(new BadRequest('Posición inválida'));
        }

        const cartaResult = await db.select().from(carta).where(eq(carta.id, cartaid).and(eq(carta.user_id, userId)));
        if (cartaResult.length === 0) {
            return next(new BadRequest('No tienes esta carta en tu colección'));
        }

        const cartaPlantillaInsertada = await db.insert(carta_plantilla).values({ plantilla_id: plantillaId, carta_id: cartaid });

        return sendResponse(req, res, { data: { message: 'Carta agregada exitosamente' } });
    } catch (error) {
        return next(error);
    }
}

export async function obtenerCartasDePlantilla  (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId } = req.params;
        const plantillaResult = await db.select().from(plantilla).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
        if (plantillaResult.length === 0) {
            return next(new Unauthorized('No tienes permisos para ver esta plantilla'));
        }
        const idcartas = await db.select({ carta_id: carta_plantilla.carta_id }).from(carta_plantilla).where(eq(carta_plantilla.plantilla_id, plantillaId));

        const cartas = [];
        for (let i = 0; i < idcartas.length; i++) {
            const cartaResult = await db.select().from(carta).where(eq(carta.id, idcartas[i].carta_id)); 
            if (cartaResult.length > 0) {
                cartas.push(cartaResult[0]); 
            }
        }
        if (cartas.length === 0) {
            return next(new BadRequest('No se encontraron cartas asociadas a esta plantilla'));
        }
        const jsonCartas = { cartas };

        return sendResponse(req, res, { data: jsonCartas });
    } catch (error) {
        return next(error);
    }
}

export async function eliminarCartaDePlantilla  (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, cartaid } = req.params;
        const plantillaResult = await db.select().from(plantilla).where(eq(plantilla.id, plantillaId).and(eq(plantilla.user_id, userId)));
    
        if (plantillaResult.length === 0) {
            return next(new Unauthorized('No tienes permisos para modificar esta plantilla'));
        }

        const cartaPlantillaResult = await db.select().from(carta_plantilla).where(eq(carta_plantilla.plantilla_id, plantillaId).and(eq(carta_plantilla.carta_id, cartaid)));
        if (cartaPlantillaResult.length === 0) {
            return next(new BadRequest('No tienes esta carta en esta plantilla'));
        }

        const cartaResult = await db.select().from(carta).where(eq(carta.id, cartaid).and(eq(carta.user_id, userId)));
        if (cartaResult.length === 0) {
            return next(new BadRequest('No tienes esta carta en tu colección'));
        }
        await db.delete(carta_plantilla).where(eq(carta_plantilla.plantilla_id, plantillaId).and(eq(carta_plantilla.carta_id, cartaid)));

        return sendResponse(req, res, { data: { message: 'Carta eliminada exitosamente' } });
    } catch (error) {
        return next(error);
    }
}

function nombrePlantillaValido(nombre) {
    return typeof nombre === 'string' && nombre.length > 3;
}

function posicionInvalida(posicion) {
    const posicionesValidas = getPosiciones();
    return !posicionesValidas.includes(posicion);
}