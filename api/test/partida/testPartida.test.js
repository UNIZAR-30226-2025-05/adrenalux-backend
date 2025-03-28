import { expect } from 'chai';
import db from '../db.js'; // Asegúrate de importar la conexión a la base de datos
import { setupTestDB } from '../setupTestDB.js'; // Inicialización de base de datos


// Pendiente: test para pausar partida

describe('🎮 Crear una partida entre dos jugadores', () => {
    it('Debería crear una nueva partida con estado "parada"', async () => {
      // Crear jugadores
      await db.execute(`
        INSERT INTO user (username, email, name, lastname, friend_code, created_at)
        VALUES ('jugador1', 'jugador1@email.com', 'Luis', 'Martínez', 'ABC123', NOW())
      `);
      await db.execute(`
        INSERT INTO user (username, email, name, lastname, friend_code, created_at)
        VALUES ('jugador2', 'jugador2@email.com', 'Pedro', 'Sánchez', 'XYZ456', NOW())
      `);
  
      await db.execute(`
        INSERT INTO partida (turno, estado, user1_id, user2_id)
        VALUES (1, 'parada', 1, 2)
      `);
  
      // Comprobar que la partida se creó correctamente
      const partidas = await db.execute('SELECT * FROM partida WHERE user1_id = 1 AND user2_id = 2');
      expect(partidas.length).to.equal(1);
      expect(partidas[0].estado).to.equal('parada');
    });
  });

  describe('🎮 Realizar una jugada', () => {
    before(async () => {
      await setupTestDB();
    });
  
    it('Debería permitir realizar una jugada en una partida en curso', async () => {
      await db.execute(`
        INSERT INTO partida (turno, estado, user1_id, user2_id)
        VALUES (1, 'en curso', 1, 2)
      `);
  
      await db.execute(`
        UPDATE partida SET turno = turno + 1 WHERE id = 1
      `);
  
      // Verificar que el turno avanzó
      const partida = await db.execute('SELECT turno FROM partida WHERE id = 1');
      expect(partida[0].turno).to.equal(2);
    });
  });

  describe('🏆 Terminar una partida y asignar ganador', () => {
    before(async () => {
      await setupTestDB();
    });
  
    it('Debería registrar al ganador y actualizar los puntos de clasificación', async () => {
      await db.execute(`
        UPDATE partida SET estado = 'finalizada', ganador_id = 1 WHERE id = 1
      `);
  
      const partida = await db.execute('SELECT estado, ganador_id FROM partida WHERE id = 1');
      expect(partida[0].estado).to.equal('finalizada');
      expect(partida[0].ganador_id).to.equal(1);
    });
  });

  describe('🚪 Abandonar una partida', () => {
    before(async () => {
      await setupTestDB();
    });
  
    it('Debería declarar ganador al oponente si un jugador abandona', async () => {
      await db.execute(`
        UPDATE partida SET estado = 'finalizada', ganador_id = 2 WHERE id = 1
      `);
  
      const partida = await db.execute('SELECT estado, ganador_id FROM partida WHERE id = 1');
      expect(partida[0].estado).to.equal('finalizada');
      expect(partida[0].ganador_id).to.equal(2);
    });
  });

  describe('📊 Actualizar estadísticas tras una partida', () => {
    before(async () => {
      await setupTestDB();
    });
  
    it('Debería actualizar nivel, experiencia y puntos del jugador ganador', async () => {
      await db.execute(`
        UPDATE user SET experience = experience + 100, level = level + 1, puntosClasificacion = puntosClasificacion + 10
        WHERE id = 1
      `);
  
      // Verificar que las estadísticas del ganador cambiaron
      const user = await db.execute('SELECT experience, level, puntosClasificacion FROM user WHERE id = 1');
      expect(user[0].experience).to.be.at.least(100);
      expect(user[0].level).to.be.at.least(2);
      expect(user[0].puntosClasificacion).to.be.at.least(10);
    });
  });

    
  