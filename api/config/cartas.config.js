export const TIPOS_SOBRES = {
  ENERGIA_LUX: 'Sobre Energia Lux',
  ELITE_LUX: 'Sobre Elite Lux',
  MASTER_LUX: 'Sobre Master Lux'
};

export const JUGADORES_POR_SOBRE = 6;

export const INTERVALO_SOBRE_GRATIS = 4;  // Intervalo entre sobres gratis, en horas

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
  [TIPOS_SOBRES.ENERGIA_LUX]: { precio: 1200, maximo: 2, intervalo: 6 * 60 * 60 * 1000 },
  [TIPOS_SOBRES.ELITE_LUX]: { precio: 3500, maximo: 1, intervalo: 8 * 60 * 60 * 1000 },
  [TIPOS_SOBRES.MASTER_LUX]: { precio: 6000, maximo: 1, intervalo: 2 * 24 * 60 * 60 * 1000 }
};

export const PROBABILIDADES_CARTAS = {
  [TIPOS_SOBRES.ENERGIA_LUX]: { NORMAL: 99, LUXURY: 0.5, MEGALUXURY: 0.25, LUXURYXI: 0.01 },
  [TIPOS_SOBRES.ELITE_LUX]: { NORMAL: 90, LUXURY: 5, MEGALUXURY: 3.5, LUXURYXI: 1.5 },
  [TIPOS_SOBRES.MASTER_LUX]: { NORMAL: 85, LUXURY: 8, MEGALUXURY: 6, LUXURYXI: 2 }
};

export const TIPOS_CARTAS = {
  NORMAL: { nombre: 'Normal', rareza: 0 },
  LUXURY: { nombre: 'Luxury', rareza: 1 },
  MEGALUXURY: { nombre: 'Megaluxury', rareza: 2 },
  LUXURYXI: { nombre: 'Luxury XI', rareza: 3 }
};

export const CARTA_CONSTANTS = {
  NOMBRE_LENGTH: 25,
  ALIAS_LENGTH: 25,
  POSICION_LENGTH: 25,
  EQUIPO_LENGTH: 25,
  TIPO_CARTA_LENGTH: 25,
  PAIS_LENGTH: 25,

  INCREMENTOS: {
    LUXURYXI: { ataque: 15, medio: 5, defensa: 5 },
    MEGALUXURY: { ataque: 7, medio: 5, defensa: 5 },
    LUXURY: { ataque: 5, medio: 5, defensa: 5 },
    MAX: 100
  },
  
  NUMERO_CARTAS: {
    LUXURYXI: 11,
    MEGALUXURY: 25,
    LUXURY: 50
  }
};

export const DISTRIBUCION_POSICIONES = {
  LUXURYXI: {
    POR: 1,
    DEF: 4,
    MED: 3,
    DEL: 3
  },
  MEGALUXURY: {
    POR: 2,
    DEF: 8,
    MED: 7,
    DEL: 8
  },
  LUXURY: {
    POR: 4,
    DEF: 15,
    MED: 15,
    DEL: 16
  }
};
