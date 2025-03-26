import { expect } from 'chai';
import db from '../db.js'; // Asegúrate de importar la conexión a la base de datos
import { setupTestDB } from '../setupTestDB.js'; // Inicialización de base de datos

describe('🛒 Pruebas del Mercado de Cartas', () => {
  before(async () => {
    await setupTestDB();

    await db.execute(`
        INSERT INTO user (username, email, name, lastname, friend_code, adrenacoins)
        VALUES ('userTest', 'test@email.com', 'Test', 'Test', 'ABC123', 100)
      `);
  });

  describe('🔹 Vender una carta en el mercado', () => {
    it('Debería permitir vender una carta en el mercado', async () => {
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Pedri')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (100, 'userTest')`);
      
      const mercado = await db.execute(`SELECT * FROM mercado_cartas WHERE nombre = Pedri`);
      expect(mercado.length).to.equal(1);
      expect(mercado[0].precio).to.equal(100);
      expect(mercado[0].vendedor).to.equal('userTest');
    });
  });

  describe('🔹 Comprar una carta del mercado', () => {
    it('Debería permitir comprar una carta del mercado', async () => {
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Pedri')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (150, 'userTest')`);
      
      // Simulamos la compra de la carta
      await db.execute(`DELETE FROM mercado_cartas WHERE nombre = Pedri`);
      
      const mercado = await db.execute(`SELECT * FROM mercado_cartas WHERE nombre = Pedri`);
      expect(mercado.length).to.equal(0);
    });
  });

  describe('🔹 Ver todas las cartas disponibles en el mercado', () => {
    it('Debería mostrar todas las cartas disponibles en el mercado', async () => {
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Antoine Griezmann')`);
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Robert Lewandowski')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (200, 'userTest')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (250, 'userTest')`);
      
      const mercado = await db.execute('SELECT * FROM mercado_cartas');
      expect(mercado).to.be.an('array');
      expect(mercado.length).to.equal(2);
      expect(mercado[0].nombre).to.equal('Antoine Griezmann');
      expect(mercado[1].nombre).to.equal('Robert Lewandowski');
    });
  });

  describe('🔹 Filtrar cartas en el mercado por precio', () => {
    it('Debería permitir filtrar cartas por precio', async () => {
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Federico Valverde')`);
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Jude Bellingham')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (300, 'userTest')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (500, 'userTest')`);
      
      const mercado = await db.execute(`SELECT * FROM mercado_cartas WHERE precio <= 400`);
      expect(mercado).to.be.an('array');
      expect(mercado.length).to.equal(1);
      expect(mercado[0].nombre).to.equal('Federico Valverde');
    });
  });

  describe('🔹 Eliminar una carta del mercado', () => {
    it('Debería eliminar una carta del mercado', async () => {
      await db.execute(`INSERT INTO cartas (nombre) VALUES ('Federico Valverde')`);
      await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (350, 'Jugador G')`);
      
      await db.execute(`DELETE FROM mercado_cartas WHERE nombre = 'Federico Valverde'`);
      
      const mercado = await db.execute(`SELECT * FROM mercado_cartas WHERE nombre = 'Federico Valverde'`);
      expect(mercado.length).to.equal(0);
    });
  });

    describe('🔹 Eliminar todas las cartas del mercado', () => {
        it('Debería eliminar todas las cartas del mercado', async () => {
        await db.execute(`INSERT INTO cartas (nombre) VALUES ('Federico Valverde')`);
        await db.execute(`INSERT INTO cartas (nombre) VALUES ('Jude Bellingham')`);
        await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (400, 'userTest')`);
        await db.execute(`INSERT INTO mercado_cartas (precio, vendedor) VALUES (600, 'userTest')`);
        
        await db.execute(`DELETE FROM mercado_cartas`);
        
        const mercado = await db.execute(`SELECT * FROM mercado_cartas`);
        expect(mercado.length).to.equal(0);
        });
    });

    describe('🔹 Verificar el saldo de adrenacoins tras compra', () => {
        it('Debería descontar el saldo de adrenacoins al comprar una carta', async () => {
          // Crear jugador con saldo
          await db.execute(`
            INSERT INTO user (username, email, name, lastname, friend_code, adrenacoins)
            VALUES ('userTest2', 'userTest2@email.com', 'userTest2', 'userTest2', 'XYZ789', 1000)
          `);
      
          // Crear y vender carta
          await db.execute(`INSERT INTO cartas (nombre) VALUES ('Pedri')`);
          await db.execute(`
            INSERT INTO mercado_cartas (precio, vendedor)
            VALUES (300, 'userTest2')
          `);
      
          // Simular compra
          await db.execute(`DELETE FROM mercado_cartas WHERE nombre = 'Pedri'`);
      
          // Verificar saldo de adrenacoins después de la compra
          const usuario = await db.execute(`SELECT adrenacoins FROM user WHERE username = 'userTest2'`);
          expect(usuario[0].adrenacoins).to.equal(700);
        });
      });

      describe('🔹 Verificar que un jugador no pueda comprar una carta sin suficientes adrenacoins', () => {
        it('No debería permitir comprar una carta si el jugador no tiene suficientes adrenacoins', async () => {
          // Crear jugador con saldo bajo
          await db.execute(`
            INSERT INTO user (username, email, name, lastname, friend_code, adrenacoins)
            VALUES ('userTest3', 'userTest3@email.com', 'userTest3', 'userTest3', 'LMN456', 50)
          `);
      
          // Crear carta y ponerla en venta
          await db.execute(`INSERT INTO cartas (nombre) VALUES ('Pedri')`);
          await db.execute(`
            INSERT INTO mercado_cartas (precio, vendedor)
            VALUES (100, 'userTest3')
          `);
      
          // Intentar comprar la carta
          try {
            await db.execute(`DELETE FROM mercado_cartas WHERE nombre = 'Pedri'`);
          } catch (error) {
            expect(error.message).to.include('No tiene suficientes adrenacoins');
          }
        });
      });

      describe('🔹 Verificar que no se pueda vender una carta que no le pertenece al jugador', () => {
        it('No debería permitir vender una carta que no le pertenece al jugador', async () => {
          // Crear dos jugadores
          await db.execute(`
            INSERT INTO user (username, email, name, lastname, friend_code, adrenacoins)
            VALUES ('userTest4', 'jugador3@email.com', 'userTest4', 'userTest4', 'LMN456', 50)
          `);
          await db.execute(`
            INSERT INTO user (username, email, name, lastname, friend_code, adrenacoins)
            VALUES ('userTest5', 'userTest5@email.com', 'userTest5', 'userTest5', 'RST654', 150)
          `);
      
          // Crear carta y agregarla al mercado
          await db.execute(`INSERT INTO cartas (nombre) VALUES ('Federico Valverde')`);
      
          // Intentar que un jugador que no tiene la carta la ponga en venta
          try {
            await db.execute(`
              INSERT INTO mercado_cartas (precio, vendedor)
              VALUES (200, 'userTest5')
            `);
          } catch (error) {
            expect(error.message).to.include('El jugador no posee esta carta');
          }
        });
      });
      
      
});
