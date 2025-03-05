import { db } from '../config/db.js';
import { mercadoDiario } from '../models/mercadoDiario.js';
import { eq } from 'drizzle-orm';

/**
 * Obtener las cartas especiales del día en el mercado
 */
export const obtenerCartasDiarias = async (req, res) => {
  try {
    const fechaHoy = new Date().toISOString().split('T')[0]; // Fecha actual sin hora
    const cartasDiarias = await db.select().from(mercadoDiario).where(eq(mercadoDiario.fecha_disponible, fechaHoy));

    res.json({ success: true, data: cartasDiarias });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las cartas diarias', error });
  }
};

/**
 * Comprar una carta especial del mercado diario
 */
export const comprarCartaDiaria = async (req, res) => {
  try {
    const { id } = req.params;
    const comprador_id = req.user.id;

    const carta = await db.select().from(mercadoDiario).where(eq(mercadoDiario.id, id)).and(eq(mercadoDiario.vendida, false));

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
