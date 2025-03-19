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
<<<<<<< HEAD
        console.error('Error al obtener plantillas:', error);
        return next(new InternalServer('Error al obtener las plantillas')); 
=======
        console.error('Error al obtener plantillas:', error); // Agrega un log para capturar el error
        return next(new InternalServer('Error al obtener las plantillas')); // Maneja el error correctamente
>>>>>>> 085c372f809298ff25d8c6b94d9c5e5a164d40b0
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

        const cartasJson = cartasFiltradas.map(carta => objectToJson(carta));

        return sendResponse(req, res, { data: cartasJson });
    } catch (error) {
        console.error('Error en devolverCartasPosicion:', error);
        return next(new InternalServer('Error al obtener las cartas por posición'));
<<<<<<< HEAD
    }
}

export async function agregarCartasPlantilla(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId, cartasid, posiciones } = req.body;

        console.log("userId", userId, "plantillaId:", plantillaId, "cartasid:", cartasid, "posiciones:", posiciones);

        const plantillaResult = await db.select()
            .from(plantilla)
            .where(and(eq(plantilla.id, plantillaId), eq(plantilla.user_id, userId)));
        console.log("Resultado: ", plantillaResult);
        if (plantillaResult.length === 0) {
            return next(new Unauthorized('No tienes permisos para modificar esta plantilla'));
        }

        if (cartasid.length !== posiciones.length)  {
            return next(new BadRequest('El número de cartas y posiciones no coincide'));
        }

        for (let i = 0; i < cartasid.length; i++) {
            const cartaid = cartasid[i];
            const posicion = posiciones[i];

            if (await posicionInvalida(posicion)) {
                return next(new BadRequest(`Posición inválida: ${posicion}`));
            }
            const cartaEnColeccion = await db.select()
                .from(coleccion)
                .where(and(eq(coleccion.carta_id, cartaid), eq(coleccion.user_id, userId)));

            if (cartaEnColeccion.length === 0) {
                return next(new BadRequest(`No tienes la carta con ID ${cartaid} en tu colección`));
            }
            const cartaInfo = await db.select()
                .from(carta)
                .where(and(eq(carta.id, cartaid), eq(carta.posicion, posicion)));

            if (cartaInfo.length === 0) {
                return next(new BadRequest(`La carta con ID ${cartaid} no tiene la posición ${posicion}`));
            }
            await db.insert(carta_plantilla)
                .values({ plantilla_id: plantillaId, carta_id: cartaid });
        }
        return sendResponse(req, res, { data: { message: 'Cartas agregadas exitosamente a la plantilla' } });
    } catch (error) {
        console.error('Error en agregarCartaAPlantilla:', error);
        return next(new InternalServer('Error al agregar cartas a la plantilla'));
=======
>>>>>>> 085c372f809298ff25d8c6b94d9c5e5a164d40b0
    }
}

export async function obtenerCartasDePlantilla (req, res, next)  {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { plantillaId } = req.body;
        
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
        const jsonCartas = { cartas };

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
