import { db } from '../config/db.js';
import { mercadoCartas, mercadoDiario, cartaState } from '../db/schemas/mercado.js';
import { user } from '../db/schemas/user.js';
import { coleccion } from '../db/schemas/coleccion.js';
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
    const compradorId = req.user.id;

    const mercadoEntries = await db
      .select()
      .from(mercadoDiario)
      .where(and(eq(mercadoDiario.id, id), eq(mercadoDiario.vendida, false)));

    if (!mercadoEntries.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carta no disponible en el mercado diario' 
      });
    }

    const mercadoEntry = mercadoEntries[0];
    const { precio, cartaId } = mercadoEntry;

    // Verificar saldo del comprador
    const [comprador] = await db
      .select()
      .from(user)
      .where(eq(user.id, compradorId));

    if (!comprador) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    if (comprador.adrenacoins < precio) {
      return res.status(400).json({ 
        success: false, 
        message: 'No tienes suficientes adrenacoins' 
      });
    }

    // Transacción para compra
    await db.transaction(async (trx) => {
      // Actualizar monedas del comprador
      await trx.update(user)
        .set({ adrenacoins: comprador.adrenacoins - precio })
        .where(eq(user.id, compradorId));

      // Marcar carta como vendida
      await trx.update(mercadoDiario)
        .set({ vendida: true })
        .where(eq(mercadoDiario.id, id));

      // Añadir a colección
      const [coleccionExistente] = await trx
        .select()
        .from(coleccion)
        .where(and(
          eq(coleccion.user_id, compradorId),
          eq(coleccion.carta_id, cartaId)
        ));

      if (coleccionExistente) {
        await trx.update(coleccion)
          .set({ cantidad: coleccionExistente.cantidad + 1 })
          .where(eq(coleccion.id, coleccionExistente.id));
      } else {
        await trx.insert(coleccion)
          .values({
            user_id: compradorId,
            carta_id: cartaId,
            cantidad: 1
          });
      }
    });

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
    console.log("Comprando carta con id: ", id);
    const compradorId = req.user.id;

    // Obtener la carta y su precio
    const carta = await db.select().from(mercadoCartas).where(and(eq(mercadoCartas.id, id), eq(mercadoCartas.estado, cartaState.EN_VENTA)));
    const cartaId = carta[0].cartaId;
    if (!carta) {
      return res.status(404).json({ success: false, message: 'Carta no disponible' });
    }

    const precioCarta = carta[0].precio;
    const vendedorId = carta[0].vendedorId;

    // Obtener las monedas del comprador
    const comprador = await db.select().from(user).where(eq(user.id, compradorId));
    console.log("Comprador encontrado: ", comprador);
    if (!comprador) {
      console.log("Comprador no encontrado");
      return res.status(404).json({ success: false, message: 'Comprador no encontrado' });
    }

    const compradorMonedas = comprador[0].adrenacoins;

    // Verificar si el comprador tiene suficientes monedas
    if (compradorMonedas < precioCarta) {
      console.log("No tienes suficientes monedas para comprar esta carta");
      return res.status(400).json({ success: false, message: 'No tienes suficientes monedas para comprar esta carta' });
    }

    // Obtener las monedas del vendedor
    const vendedor = await db.select().from(user).where(eq(user.id, vendedorId));
    console.log("Vendedor encontrado: ", vendedor);

    if (!vendedor) {
      console.log("Vendedor no encontrado ", vendedorId);
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }

    const vendedorMonedas = vendedor[0].adrenacoins;
    console.log("Empieza la transacción para comprar la carta con monedas ", compradorMonedas, precioCarta);
    // Iniciar una transacción para actualizar las monedas, la carta y la colección
    await db.transaction(async (trx) => {
      // Restar monedas al comprador
      await trx.update(user).set({ adrenacoins: compradorMonedas - precioCarta }).where(eq(user.id, compradorId));
      console.log("Monedas restadas al comprador");
      // Añadir monedas al vendedor
      await trx.update(user).set({ adrenacoins: vendedorMonedas + precioCarta }).where(eq(user.id, vendedorId));
      console.log("Monedas añadidas al vendedor");
      // Actualizar el estado de la carta en el mercado
      await trx.update(mercadoCartas).set({ compradorId, estado: cartaState.VENDIDA, fechaVenta: new Date() }).where(eq(mercadoCartas.id, id));
      console.log("Actualizado el estado de la carta en el mercado");
      // Verificar si el comprador ya tiene la carta en su colección
      const coleccionExistente = await trx.select().from(coleccion).where(and(eq(coleccion.user_id, compradorId), eq(coleccion.carta_id, cartaId)));
      console.log("Coleccion existente: ", coleccionExistente);
      if (coleccionExistente.length > 0) {
        // Si la carta ya está en la colección del comprador, incrementar la cantidad
        const cantidadActual = coleccionExistente[0].cantidad;
        await trx.update(coleccion).set({ cantidad: cantidadActual + 1 }).where(eq(coleccion.id, coleccionExistente[0].id));
      } else {
        console.log("Añadiendo carta a la colección del usuario ", compradorId, cartaId);
        // Si la carta no está en la colección, agregarla con cantidad 1
        await trx.insert(coleccion).values({
          carta_id: cartaId,
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
