import { expect } from 'chai';
import { db } from '../db.js'; // Asegúrate de importar la conexión a la base de datos
import { setupTestDB } from '../setupTestDB.js'; // Inicialización de base de datos

describe('🃏 Pruebas de la tabla de cartas', () => {
  before(async () => {
    await setupTestDB();
  });

  describe('🔹 Agregar una nueva carta', () => {
    it('Debería agregar una nueva carta', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (1, 'Vinícius Júnior')`);
      const cartas = await db.execute(`SELECT * FROM carta WHERE id = 1`);
      expect(cartas.length).to.equal(1);
      expect(cartas[0].nombre).to.equal('Vinícius Júnior');
    });
  });

  describe('🔹 Obtener una carta por su ID', () => {
    it('Debería obtener una carta por su ID', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (2, 'Pedri')`);
      const cartas = await db.execute(`SELECT * FROM carta WHERE id = 2`);
      expect(cartas.length).to.equal(1);
      expect(cartas[0].nombre).to.equal('Pedri');
    });
  });

  describe('🔹 Evitar duplicados de cartas', () => {
    it('Debería evitar duplicados de cartas', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (3, 'Jude Bellingham')`);
      
      try {
        await db.execute(`INSERT INTO carta (id, nombre) VALUES (4, 'Jude Bellingham')`);
      } catch (error) {
        expect(error).to.exist;
      }

      const cartas = await db.execute(`SELECT * FROM carta WHERE nombre = 'Jude Bellingham'`);
      expect(cartas.length).to.equal(1);
    });
  });

  describe('🔹 Filtrar cartas por nombre', () => {
    it('Debería filtrar cartas por nombre', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (5, 'Antoine Griezmann')`);
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (6, 'Robert Lewandowski')`);
      
      const cartas = await db.execute(`SELECT * FROM carta WHERE nombre IN ('Antoine Griezmann', 'Robert Lewandowski')`);
      expect(cartas).to.be.an('array');
      expect(cartas.length).to.equal(2);
      expect(cartas.map(c => c.nombre)).to.include('Antoine Griezmann');
      expect(cartas.map(c => c.nombre)).to.include('Robert Lewandowski');
    });
  });

  describe('🔹 Eliminar todas las cartas de un jugador', () => {
    it('Debería eliminar todas las cartas de un jugador', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (7, 'João Félix')`);
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (8, 'João Félix')`);
      
      await db.execute(`DELETE FROM carta WHERE nombre = 'João Félix'`);
      
      const cartas = await db.execute(`SELECT * FROM carta WHERE nombre = 'João Félix'`);
      expect(cartas.length).to.equal(0);
    });
  });

  describe('🔹 Eliminar una carta por su ID', () => {
    it('Debería eliminar una carta por su ID', async () => {
      await db.execute(`INSERT INTO carta (id, nombre) VALUES (9, 'Federico Valverde')`);
      await db.execute(`DELETE FROM carta WHERE id = 9`);
      
      const cartas = await db.execute(`SELECT * FROM carta WHERE id = 9`);
      expect(cartas.length).to.equal(0);
    });
  });

});
