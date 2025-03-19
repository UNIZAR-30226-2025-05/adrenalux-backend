import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest, InternalServer } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { plantilla } from '../db/schemas/plantilla.js';
import { carta } from '../db/schemas/carta.js';
import { carta_plantilla } from '../db/schemas/carta_plantilla.js';
import { obtenerColeccion } from './coleccion.js';
import { getPosiciones } from './cartas.js';
import { objectToJson } from '../lib/toJson.js';
import { eq,and } from 'drizzle-orm';
import { coleccion } from '../db/schemas/coleccion.js';
import { obtenerTodasLasCartas } from './coleccion.js';

export async function crearPlantilla(req, res, next) {
    try {
        console.log("Body recibido:", req.body);
        
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { nombre } = req.body;

        if (!nombrePlantillaValido(nombre)) {
            return next(new BadRequest('Nombre de plantilla inválido'));
        }
        
        const [plantillaInsertada] = await db.insert(plantilla)
        .values({
            nombre,
            user_id: userId
        })
        .returning({
            id: plantilla.id,
            nombre: plantilla.nombre,
            user_id: plantilla.user_id
        });

        console.log("Plantilla insertada:", plantillaInsertada); 

        return res.status(201).json({
            plantilla: plantillaInsertada
        });
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

        console.error('Error al obtener plantillas:', error); // Agrega un log para capturar el 
        return next(new InternalServer('Error al obtener las plantillas')); // Maneja el error 
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

        await db.delete(carta_plantilla)
            .where(eq(carta_plantilla.plantilla_id, plantillaIdNum));

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
export async function agregarCartasPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, cartasid, posiciones } = req.body;

        if (!plantillaId || !cartasid || !posiciones) {
            return next(new BadRequest('Faltan parámetros requeridos'));
        }

        const [plantillaExistente] = await db.select()
            .from(plantilla)
            .where(and(
                eq(plantilla.id, plantillaId),
                eq(plantilla.user_id, userId)
            ));

        if (!plantillaExistente) {
            return next(new Unauthorized('No tienes permisos para esta plantilla'));
        }

        if (cartasid.length !== posiciones.length) {
            return next(new BadRequest('Cantidad de cartas y posiciones no coincide'));
        }

        await db.delete(carta_plantilla)
            .where(eq(carta_plantilla.plantilla_id, plantillaId));

        const inserts = [];

        const cartasIdsNumeros = cartasid.map(id => Number(id));
        if (cartasIdsNumeros.some(isNaN)) {
            return next(new BadRequest('IDs de cartas deben ser números'));
        }
        
        for (let i = 0; i < cartasIdsNumeros.length; i++) {
            const cartaId = cartasIdsNumeros[i];
            const posicion = posiciones[i];

            if (await posicionInvalida(posicion)) {
                console.error(`Posición inválida detectada: ${posicion}`);
                return next(new BadRequest(`Posición inválida: ${posicion}`));
            }
            
            const [cartaEnColeccion] = await db.select()
                .from(coleccion)
                .where(and(
                    eq(coleccion.carta_id, cartaId),
                    eq(coleccion.user_id, userId)
                ));

            if (!cartaEnColeccion) {
                return next(new BadRequest(`No posees la carta ${cartaId}`));
            }

            inserts.push({
                plantilla_id: plantillaId,
                carta_id: cartaId,
                posicion: posicion 
            });
        }

        if (inserts.length > 0) {
            await db.insert(carta_plantilla).values(inserts);
        }

        return res.status(200).json({
            success: true,
            message: `Plantilla actualizada con ${inserts.length} cartas`
        });

    } catch (error) {
        console.error('Error actualizando plantilla:', error);
        return next(new InternalServer('Error al procesar la actualización'));
    }
}

export async function obtenerCartasDePlantilla (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { id: plantillaId } = req.params; 

        if (!plantillaId) {
            return res.status(400).json({ error: 'plantillaId es requerido' });
        }
        
        const plantillaResult = await db.select()
            .from(plantilla)
            .where(and(eq(plantilla.id, plantillaId), eq(plantilla.user_id, userId)));
        console.log("Resultado: ", plantillaResult);
      
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
        const jsonCartas = objectToJson(cartas);

        return sendResponse(req, res, { data: jsonCartas });
    } catch (error) {
        return next(error);
    }
}

export async function actualizarCarta(req, res, next) {
    try {

        const token = await getDecodedToken(req);
        const userId = token?.id;
        if (!userId) {
            return next(new Unauthorized('Token inválido o usuario no encontrado'));
        }
        const { plantillaId, cartaidActual, cartaidNueva } = req.body;
        const plantillaResult = await db.select()
            .from(plantilla)
            .where(and(eq(plantilla.id, plantillaId), eq(plantilla.user_id, userId)));

        if (plantillaResult.length === 0) {
            return next(new Unauthorized('No tienes permisos para modificar esta plantilla'));
        }
        const cartaPlantillaResult = await db.select()
            .from(carta_plantilla)
            .where(
                and(eq(carta_plantilla.plantilla_id, plantillaId), eq(carta_plantilla.carta_id, cartaidActual))
            );

        if (cartaPlantillaResult.length === 0) {
            return next(new BadRequest('No tienes esta carta en esta plantilla'));
        }

        await db.update(carta_plantilla)
            .set({ carta_id: cartaidNueva }) 
            .where(and(eq(carta_plantilla.plantilla_id, plantillaId), eq(carta_plantilla.carta_id, cartaidActual)));

        return sendResponse(req, res, { data: { message: 'Carta actualizada exitosamente' } });

    } catch (error) {
        console.error(" Error en actualizarCarta:", error);
        return next(error);
    }
}

function nombrePlantillaValido(nombre) {
    return typeof nombre === 'string' && nombre.length > 3;
}

async function getPosicionesUnicas() {
  const cartas = await obtenerTodasLasCartas(); 
  const posicionesSet = new Set();

  for (const carta of cartas) {
    posicionesSet.add(carta.posicion);
  }

  return Array.from(posicionesSet);
}
 
async function posicionInvalida(posicion) {
    const posicionesValidas = await getPosicionesUnicas();
    console.log("Posiciones válidas:", posicionesValidas);
    console.log("Posición recibida:", posicion);
    return !posicionesValidas.includes(posicion);
}
