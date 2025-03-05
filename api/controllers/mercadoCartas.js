import { db } from '../config/db.js';
import { mercadoCartas } from '../models/mercadoCartas.js';
import { eq, like } from 'drizzle-orm';

/**
 * Obtener todas las cartas en venta en el mercado de jugadores
 */
export const obtenerCartasEnVenta = async (req, res) => {
  try {
    const cartasEnVenta = await db.select().from(mercadoCartas).where(eq(mercadoCartas.estado, 'En venta'));
    res.json({ success: true, data: cartasEnVenta });
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
    const { carta_id, precio } = req.body;
    const vendedor_id = req.user.id; // ID del usuario autenticado

    const nuevaPublicacion = await db.insert(mercadoCartas).values({
      carta_id,
      vendedor_id,
      precio,
      estado: 'En venta',
      fecha_publicacion: new Date(),
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
    const comprador_id = req.user.id;

    const carta = await db.select().from(mercadoCartas).where(eq(mercadoCartas.id, id)).and(eq(mercadoCartas.estado, 'En venta'));

    if (!carta.length) {
      return res.status(404).json({ success: false, message: 'Carta no disponible' });
    }

    // Actualizar estado de la carta
    await db.update(mercadoCartas).set({ comprador_id, estado: 'Vendida', fecha_venta: new Date() }).where(eq(mercadoCartas.id, id));

    res.json({ success: true, message: 'Carta comprada exitosamente' });
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
    const vendedor_id = req.user.id;

    const carta = await db.select().from(mercadoCartas).where(eq(mercadoCartas.id, id)).and(eq(mercadoCartas.vendedor_id, vendedor_id));

    if (!carta.length) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para retirar esta carta' });
    }

    await db.delete(mercadoCartas).where(eq(mercadoCartas.id, id));
    res.json({ success: true, message: 'Carta retirada del mercado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al retirar la carta', error });
  }
};
