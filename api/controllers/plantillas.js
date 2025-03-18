import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { plantilla } from '../db/schemas/plantilla.js';
import { carta } from '../db/schemas/carta.js';
import { carta_plantilla } from '../db/schemas/carta_plantilla.js';
import { obtenerColeccion } from './coleccion.js';
import { getPosiciones } from './cartas.js';
import { objectToJson } from '../lib/toJson.js';
import { eq,and } from 'drizzle-orm';

export async function crearPlantilla(req, res, next) {
    try {
        console.log("Body recibido:", req.body);
        
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { nombre } = req.body;

        if (!nombrePlantillaValido(nombre)) {
            return next(new BadRequest('Nombre de plantilla inválido'));
        }

        const plantillaInsertada = await db.insert(plantilla).values({ nombre, user_id: userId });
        
        console.log("Plantilla insertada:", plantillaInsertada); 

        return sendResponse(req, res, { plantilla: plantillaInsertada });
    } catch (error) {
        console.error("Error en crearPlantilla:", error); 
        return next(error);
    }
}

export async function obtenerPlantillas(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const plantillas = await db.select().from(plantilla).where(eq(plantilla.user_id, userId));
        return sendResponse(req, res, { data: plantillas });
    } catch (error) {
        console.error('Error al obtener plantillas:', error); // Agrega un log para capturar el error
        return next(new InternalServerError('Error al obtener las plantillas')); // Maneja el error correctamente
    }
}

export async function actualizarPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaIdNum, nuevoNombre } = req.body;

       if (!nombrePlantillaValido(nuevoNombre)) {
          return next(new BadRequest('Nombre de plantilla inválido. Debe tener al menos un carácter.'));
        }

        const plantillaActualizada = await db.update(plantilla)
            .set({ nombre: nuevoNombre })
            .where(and(eq(plantilla.id, plantillaIdNum), eq(plantilla.user_id, userId)));

        if (!plantillaActualizada || plantillaActualizada.length === 0) {
            return next(new NotFound('Plantilla no encontrada o no tienes permisos para modificarla.'));
        }

        return sendResponse(req, res, {
            data: {
                message: 'Plantilla actualizada exitosamente',
                plantillaId: plantillaIdNum,
                nuevoNombre
            }
        });
    } catch (error) {
        return next(error);
    }
}

export async function eliminarPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const {plantillaIdNum} = req.body;

        console.log("Intentando eliminar plantilla con ID:", plantillaIdNum, "y userId:", userId);

        const plantillaResult = await db
            .select()
            .from(plantilla)
            .where(and(eq(plantilla.id, plantillaIdNum), eq(plantilla.user_id, userId)));

        if (plantillaResult.length === 0) {
            console.error("Plantilla no encontrada o sin permisos.");
            return next(new Unauthorized("No tienes permisos para eliminar esta plantilla"));
        }

        await db.delete(plantilla).where(and(eq(plantilla.id, plantillaIdNum), eq(plantilla.user_id, userId)));

        console.log("Plantilla eliminada correctamente.");
        return sendResponse(req, res, { data: { message: "Plantilla eliminada exitosamente" } });
    } catch (error) {
        console.error("Error al eliminar plantilla:", error);
        return next(error);
    }
}

export async function devolverCartasPosicion(req, res, next) {
    try {
        
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { posicion } = req.body;
        const { cartasUsuario } = await obtenerColeccion(userId);

        const cartasFiltradas = cartasUsuario.filter(carta => carta.posicion === posicion);

        if (cartasFiltradas.length === 0) {
            return next(new NotFound({ message: 'No se encontraron cartas en esa posición' }));
        }

        // Convertir las cartas a JSON
        const cartasJson = cartasFiltradas.map(carta => objectToJson(carta));

        // Devolver la respuesta
        return sendResponse(req, res, { data: cartasJson });
    } catch (error) {
        // Manejar errores
        console.error('Error en devolverCartasPosicion:', error);
        return next(new InternalServerError('Error al obtener las cartas por posición'));
    }
}

export async function obtenerCartasDePlantilla (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId } = req.body;
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

export async function eliminarCartaDePlantilla (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, cartaid } = req.body;
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