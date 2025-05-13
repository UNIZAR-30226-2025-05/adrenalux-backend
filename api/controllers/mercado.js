import { db } from '../config/db.js';
import { mercadoCartas, mercadoDiario, cartaState } from '../db/schemas/mercado.js';
import { user } from '../db/schemas/user.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, like, and, gte, lte, inArray, not } from 'drizzle-orm';
import {carta} from '../db/schemas/carta.js';
import { TIPOS_CARTAS } from '../config/cartas.config.js';


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

    await db.transaction(async (trx) => {
      await trx.update(user)
        .set({ adrenacoins: comprador.adrenacoins - precio })
        .where(eq(user.id, compradorId));

      await trx.update(mercadoDiario)
        .set({ vendida: true })
        .where(eq(mercadoDiario.id, id));

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

export const obtenerCartasEnVenta = async (req, res) => {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  try {
    const cartasEnVenta = await db
      .select()
      .from(mercadoCartas)
      .where(
        and(
          eq(mercadoCartas.estado, cartaState.EN_VENTA),
          not(eq(mercadoCartas.vendedorId, userId)) 
        )
      );

    if (cartasEnVenta.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const cartaIds = [...new Set(cartasEnVenta.map(item => item.cartaId))]; // Obtener IDs de cartas únicas

    const cartas = await db
      .select()
      .from(carta)
      .where(inArray(carta.id, cartaIds));
      
    const cartasEnVentaMap = cartasEnVenta.reduce((acc, marketRecord) => {
      acc[marketRecord.cartaId] = marketRecord;
      return acc;
    }, {});

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
    })
    .returning();
    

    res.status(201).json({ success: true, message: 'Carta puesta en venta', data: nuevaPublicacion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al publicar la carta', error });
  }
};


export const comprarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    const compradorId = req.user.id;

    const carta = await db.select().from(mercadoCartas).where(and(eq(mercadoCartas.id, id), eq(mercadoCartas.estado, cartaState.EN_VENTA)));
    const cartaId = carta[0].cartaId;
    if (!carta) {
      return res.status(404).json({ success: false, message: 'Carta no disponible' });
    }

    const precioCarta = carta[0].precio;
    const vendedorId = carta[0].vendedorId;


    const comprador = await db.select().from(user).where(eq(user.id, compradorId));
    if (!comprador) {
      return res.status(404).json({ success: false, message: 'Comprador no encontrado' });
    }

    const compradorMonedas = comprador[0].adrenacoins;
    if (compradorMonedas < precioCarta) {
      console.log("No tienes suficientes monedas para comprar esta carta");
      return res.status(400).json({ success: false, message: 'No tienes suficientes monedas para comprar esta carta' });
    }

    const vendedor = await db.select().from(user).where(eq(user.id, vendedorId));

    if (!vendedor) {
      return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
    }

    const vendedorMonedas = vendedor[0].adrenacoins;

    await db.transaction(async (trx) => {
      await trx.update(user).set({ adrenacoins: compradorMonedas - precioCarta }).where(eq(user.id, compradorId));

      await trx.update(user).set({ adrenacoins: vendedorMonedas + precioCarta }).where(eq(user.id, vendedorId));

      await trx.update(mercadoCartas).set({ compradorId, estado: cartaState.VENDIDA, fechaVenta: new Date() }).where(eq(mercadoCartas.id, id));

      const coleccionComprador = await trx.select().from(coleccion).where(and(eq(coleccion.user_id, compradorId), eq(coleccion.carta_id, cartaId)));

      if (coleccionComprador.length > 0) {

        const cantidadActual = coleccionComprador[0].cantidad;
        await trx.update(coleccion).set({ cantidad: cantidadActual + 1 }).where(eq(coleccion.id, coleccionComprador[0].id));
      } else {
 
        await trx.insert(coleccion).values({
          carta_id: cartaId,
          user_id: compradorId,
          cantidad: 1,
        });
      }

      const coleccionVendedor = await trx.select().from(coleccion).where(and(eq(coleccion.user_id, vendedorId), eq(coleccion.carta_id, cartaId)));

      if (coleccionVendedor[0].cantidad > 1) {

        const cantidadActual = coleccionVendedor[0].cantidad;
        await trx.update(coleccion).set({ cantidad: cantidadActual - 1 }).where(eq(coleccion.id, coleccionVendedor[0].id));
      } else {
        await trx.delete(coleccion).where(and(eq(coleccion.user_id, vendedorId), eq(coleccion.carta_id, cartaId)));
      }
    });

    res.json({ success: true, message: 'Carta comprada y añadida a tu colección exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al comprar la carta', error });
  }
};



export const retirarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const carta = await db.select().from(mercadoCartas).where(and(and(eq(mercadoCartas.cartaId, id), eq(mercadoCartas.vendedorId, vendedorId)), 
                                                                      eq(mercadoCartas.estado, cartaState.EN_VENTA)));
    const cartaMercado = carta[0];

    if (!cartaMercado) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para retirar esta carta' });
    }
    
    await db.delete(mercadoCartas).where(and(eq(mercadoCartas.id, cartaMercado.id), eq(mercadoCartas.estado, cartaState.EN_VENTA)));
    res.json({ success: true, message: 'Carta retirada del mercado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al retirar la carta', error });
  }
};

export const generarCartasMercado = async (req, res) =>  {
  try {
    const cartasMegaluxury = await db
      .select()
      .from(carta)
      .where(eq(carta.tipo_carta, TIPOS_CARTAS.LUXURYXI.nombre)); 

    if (cartasMegaluxury.length < 3) {
      console.log('No hay suficientes cartas');
      return res.status(400).json({ error: "No hay suficientes cartas Megaluxury" });
    }

    const cartasAleatorias = [];
    while (cartasAleatorias.length < 3) {
      const cartaAleatoria = cartasMegaluxury[Math.floor(Math.random() * cartasMegaluxury.length)];
      if (!cartasAleatorias.includes(cartaAleatoria)) {
        cartasAleatorias.push(cartaAleatoria);
      }
    }

    for (const carta of cartasAleatorias) {
      await db.insert(mercadoDiario).values({
        cartaId: carta.id,
        fechaDisponible: new Date(), 
        precio: Math.floor(Math.random() * (50000 - 20000 + 1)) + 30000, 
      });
    }
    res.status(200).json({ message: "Cartas generadas exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}