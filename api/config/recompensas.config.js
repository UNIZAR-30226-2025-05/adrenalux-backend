export const RECOMPENSAS = {
    DINERO: {
      GANAR_PARTIDA: 500,
      PERDER_PARTIDA: 200,
      GANAR_TORNEO: 5000,
      PARTICIPAR_TORNEO: 1000,
      SUBIR_NIVEL: 2000,
    },
    PUNTOS_CLASIFICACION: {
      GANAR_PARTIDA: 10,
      PERDER_PARTIDA: -5,
      GANAR_TORNEO: 50,
      PERDER_FINAL_TORNEO: 20,
    },
    EXPERIENCIA: {
      GANAR_PARTIDA: 50,
      CARTAS_CONSEGUIDAS: 500,
      ABRIR_SOBRE: 100,
      PERDER_PARTIDA: 20,
      GANAR_TORNEO: 500,
      PERDER_FINAL_TORNEO: 200,
    },
  };
  
  export const TIPOS_RANKING = {
    AMIGOS: 'Clasificación de Amigos',
    GENERAL: 'Clasificación General',
  };
  
  export const ESTADISTICAS_RANKING = {
    AMIGOS: ['partidas ganadas', 'partidas perdidas', 'puntos de clasificación'],
    GENERAL: ['puntos de clasificación'],
  };

  export const SISTEMA_NIVELES = {
    NIVEL_INICIAL: 1,
    EXP_POR_NIVEL: 1000,
    PROGRESION: (nivel) => nivel * 1000,
  };
  