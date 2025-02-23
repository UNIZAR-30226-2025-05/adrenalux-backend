export const TIPOS_SOBRES = {
    ENERGIA_LUX: 'Sobre Energia Lux',
    ELITE_LUX: 'Sobre Elite Lux',
    MASTER_LUX: 'Sobre Master Lux'
  };
  
  export const JUGADORES_POR_SOBRE = 6;
  
  export const PROBABILIDADES_SOBRES_GRATUITOS = {
    [TIPOS_SOBRES.ENERGIA_LUX]: 90,
    [TIPOS_SOBRES.ELITE_LUX]: 8,
    [TIPOS_SOBRES.MASTER_LUX]: 2
  };
  
  export const TIPOS_FILTROS = {
    POSICION: 'posicion',
    RAREZA: 'rareza',
    EQUIPO: 'equipo'
  };
  
  export const PRECIOS_SOBRES = {
    [TIPOS_SOBRES.ENERGIA_LUX]: { precio: 750, maximo: 2, intervalo: 6 * 60 * 60 * 1000 },
    [TIPOS_SOBRES.ELITE_LUX]: { precio: 2000, maximo: 1, intervalo: 8 * 60 * 60 * 1000 },
    [TIPOS_SOBRES.MASTER_LUX]: { precio: 6000, maximo: 1, intervalo: 2 * 24 * 60 * 60 * 1000 }
  };
  
  export const PROBABILIDADES_CARTAS = {
    [TIPOS_SOBRES.ENERGIA_LUX]: { NORMAL: 98, LUXURY: 1.5, MEGALUXURY: 0.49, LUXURYXI: 0.01 },
    [TIPOS_SOBRES.ELITE_LUX]: { NORMAL: 94, LUXURY: 4, MEGALUXURY: 1.5, LUXURYXI: 0.5 },
    [TIPOS_SOBRES.MASTER_LUX]: { NORMAL: 90, LUXURY: 6, MEGALUXURY: 3, LUXURYXI: 1 }
  };
  export const TIPOS_CARTAS = {
    NORMAL: { nombre: 'Normal', MIN_ID: 1, MAX_ID: 550 },
    LUXURY: { nombre: 'Luxury', MIN_ID: 551, MAX_ID: 600 },
    MEGALUXURY: { nombre: 'Megaluxury', MIN_ID: 601, MAX_ID: 625 },
    LUXURYXI: { nombre: 'Luxury XI', MIN_ID: 626, MAX_ID: 640 }
  };
