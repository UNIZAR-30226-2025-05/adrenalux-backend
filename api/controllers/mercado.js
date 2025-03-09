import { db } from '../config/db.js';
import { mercadoCartas, mercadoDiario, cartaState } from '../db/schemas/mercado.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, like, and, gte, lte, inArray, not } from 'drizzle-orm';
import {carta} from '../db/schemas/carta.js';

/** 
 * 📌 MERCADO DIARIO 
 */

/**
 * Obtener las cartas especiales del día en el mercado
 */

export const obtenerCartasDiarias = async (req, res) => {
  try {
    const inicioDelDia = new Date();
    inicioDelDia.setUTCHours(0, 0, 0, 0);
    
    const finDelDia = new Date();
    finDelDia.setUTCHours(23, 59, 59, 999);

    const cartasMercado = await db
      .select()
      .from(mercadoDiario)
      .where(
        and(
          gte(mercadoDiario.fechaDisponible, inicioDelDia),
          lte(mercadoDiario.fechaDisponible, finDelDia)
        )
      );
    
    const cartaIds = [...new Set(cartasMercado.map(item => item.cartaId))];

    const cartas = await db
      .select()
      .from(carta)
      .where(inArray(carta.id, cartaIds));
      
    const cartasJson = cartas.map(card => {
      const cardJson = objectToJson(card);
      const marketRecord = cartasMercado.find(market => market.cartaId === card.id);
      return {
        ...cardJson,
        mercadoCartaId : marketRecord.id,
        precio: marketRecord ? marketRecord.precio : null
      };
    });
    
    
    res.json({ success: true, data: cartasJson });
  } catch (error) {
    console.error('Error en obtenerCartasDiarias:', error); 
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : null 
    });
  }
};

/**
 * Comprar una carta especial del mercado diario
 */
export const comprarCartaDiaria = async (req, res) => {
  try {
    const { id } = req.params;
    const comprador_id = req.user.id;

    const carta = await db.select().from(mercadoDiario).where(and(eq(mercadoDiario.id, id), eq(mercadoDiario.vendida, false)));

    if (!carta.length) {
      return res.status(404).json({ success: false, message: 'Carta no disponible en el mercado diario' });
    }

    // Actualizar estado de la carta
    await db.update(mercadoDiario).set({ vendida: true }).where(eq(mercadoDiario.id, id));

    res.json({ success: true, message: 'Carta comprada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al comprar la carta del mercado diario', error });
  }
};

/** 
 * 📌 MERCADO DE CARTAS (PUJAS)
 */

/**
 * Obtener todas las cartas en venta en el mercado de jugadores
 */
export const obtenerCartasEnVenta = async (req, res) => {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  try {
    // Obtener todas las cartas en venta que no han sido puestas por el usuario actual
    const cartasEnVenta = await db
      .select()
      .from(mercadoCartas)
      .where(
        and(
          eq(mercadoCartas.estado, cartaState.EN_VENTA),
          not(eq(mercadoCartas.vendedorId, userId)) // Excluir cartas del usuario
        )
      );

    if (cartasEnVenta.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const cartaIds = [...new Set(cartasEnVenta.map(item => item.cartaId))]; // Obtener IDs de cartas únicas

    // Obtener las cartas correspondientes
    const cartas = await db
      .select()
      .from(carta)
      .where(inArray(carta.id, cartaIds));
      
    // Crear un objeto de búsqueda para las cartas en venta
    const cartasEnVentaMap = cartasEnVenta.reduce((acc, marketRecord) => {
      acc[marketRecord.cartaId] = marketRecord;
      return acc;
    }, {});

    // Mapear las cartas con los detalles del mercado
    const cartasJson = cartas.map(card => {
      const marketRecord = cartasEnVentaMap[card.id];
      return {
        ...objectToJson(card),
        mercadoCartaId: marketRecord.id,
        precio: marketRecord ? marketRecord.precio : null,
      };
    });

    res.json({ success: true, data: cartasJson });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las cartas en venta', error });
  }
};


/**
 * Obtener una carta específica en venta por su nombre
 */
export const obtenerCartaPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const carta = await db.select().from(mercadoCartas).where(like(mercadoCartas.nombre, `%${nombre}%`));

    if (!carta.length) {
      return res.status(404).json({ success: false, message: 'Carta no encontrada en el mercado' });
    }

    res.json({ success: true, data: carta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la carta', error });
  }
};

/**
 * Publicar una carta en venta
 */
export const publicarCarta = async (req, res) => {
  try {
    const { cartaId, precio } = req.body;
    const vendedorId = req.user.id; // ID del usuario autenticado

    const nuevaPublicacion = await db.insert(mercadoCartas).values({
      cartaId,
      vendedorId,
      precio,
      estado: 'En venta',
      fechaPublicacion: new Date(),
    });

    res.status(201).json({ success: true, message: 'Carta puesta en venta', data: nuevaPublicacion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al publicar la carta', error });
  }
};

/**
 * Comprar una carta en el mercado
 */
export const comprarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    const compradorId = req.user.id;

    // Obtener la carta y su precio
    const carta = await db.select().from(mercadoCartas).where(and(eq(mercadoCartas.id, id), eq(mercadoCartas.estado, 'En venta')));

    if (!carta.length) {
      return res.status(404).json({ success: false, message: 'Carta no disponible' });
    }

    const cartaData = carta[0];
    const precioCarta = cartaData.precio;
    const vendedorId = cartaData.vendedorId;

    // Obtener las monedas del comprador
    const comprador = await db.select().from(usuarios).where(eq(usuarios.id, compradorId));

    if (!comprador.length) {
      return res.status(404).json({ success: false, message: 'Comprador no encontrado' });
    }

    const compradorMonedas = comprador[0].monedas;

    // Verificar si el comprador tiene suficientes monedas
    if (compradorMonedas < precioCarta) {
      return res.status(400).json({ success: false, message: 'No tienes suficientes monedas para comprar esta carta' });
    }

    // Obtener las monedas del vendedor
    const vendedor = await db.select().from(usuarios).where(eq(usuarios.id, vendedorId));

    if (!vendedor.length) {
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }

    const vendedorMonedas = vendedor[0].monedas;

    // Iniciar una transacción para actualizar las monedas, la carta y la colección
    await db.transaction(async (trx) => {
      // Restar monedas al comprador
      await trx.update(usuarios).set({ monedas: compradorMonedas - precioCarta }).where(eq(usuarios.id, compradorId));

      // Añadir monedas al vendedor
      await trx.update(usuarios).set({ monedas: vendedorMonedas + precioCarta }).where(eq(usuarios.id, vendedorId));

      // Actualizar el estado de la carta en el mercado
      await trx.update(mercadoCartas).set({ compradorId, estado: 'Vendida', fechaVenta: new Date() }).where(eq(mercadoCartas.id, id));

      // Verificar si el comprador ya tiene la carta en su colección
      const coleccionExistente = await trx.select().from(coleccion).where(and(eq(coleccion.user_id, compradorId), eq(coleccion.carta_id, cartaData.cartaId)));

      if (coleccionExistente.length > 0) {
        // Si la carta ya está en la colección del comprador, incrementar la cantidad
        const cantidadActual = coleccionExistente[0].cantidad;
        await trx.update(coleccion).set({ cantidad: cantidadActual + 1 }).where(eq(coleccion.id, coleccionExistente[0].id));
      } else {
        // Si la carta no está en la colección, agregarla con cantidad 1
        await trx.insertInto(coleccion).values({
          carta_id: cartaData.cartaId,
          user_id: compradorId,
          cantidad: 1,
        });
      }
    });

    res.json({ success: true, message: 'Carta comprada y añadida a tu colección exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al comprar la carta', error });
  }
};



/**
 * Retirar una carta del mercado (solo el vendedor puede hacerlo)
 */
export const retirarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const carta = await db.select().from(mercadoCartas).where(and(eq(mercadoCartas.id, id), eq(mercadoCartas.vendedorId, vendedorId)));

    if (!carta.length) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para retirar esta carta' });
    }

    await db.delete(mercadoCartas).where(eq(mercadoCartas.id, id));
    res.json({ success: true, message: 'Carta retirada del mercado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al retirar la carta', error });
  }
};
