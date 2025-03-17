import { db } from '../../config/db.js';
import { setupTestDB } from '../setupTestDB.js';
import { expect } from 'chai';

describe('🃏 Pruebas de la tabla de cartas', () => {
  before(async () => {
    await setupTestDB();
  });

  it('Debería agregar una nueva carta', async () => {
    await db.execute(`INSERT INTO cartas (id, nombre, rareza) VALUES (1, 'Carta Test', 'Rara')`);
    const cartas = await db.execute(`SELECT * FROM cartas WHERE id = 1`);
    expect(cartas.length).to.equal(1);
    expect(cartas[0].nombre).to.equal('Carta Test');
  });

  it('Debería obtener todas las cartas', async () => {
    const cartas = await db.execute('SELECT * FROM cartas');
    expect(cartas).to.be.an('array');
    expect(cartas.length).to.be.greaterThan(0);
  });

  it('Debería eliminar una carta', async () => {
    await db.execute('DELETE FROM cartas WHERE id = 1');
    const cartas = await db.execute(`SELECT * FROM cartas WHERE id = 1`);
    expect(cartas.length).to.equal(0);
  });
});
