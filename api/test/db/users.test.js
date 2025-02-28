import { db } from '../../api/config/db.js';
import { setupTestDB } from '../setupTestDB.js';
import { expect } from 'chai';

describe('👤 Pruebas de la tabla de usuarios', () => {
  before(async () => {
    await setupTestDB();
  });

  it('Debería crear un nuevo usuario', async () => {
    await db.execute(`INSERT INTO users (id, username, email, name, lastname, salt, friend_code, adrenacoins, experience, level, puntosClasificacion, avatar) 
                      VALUES (5000, 'TestUser', 'test@example.com', 'Test', 'User', 'salt', 0, 0, 0, 1, 0, 'default')`);
    
    const result = await db.execute(`SELECT * FROM users WHERE id = 5000`); 

    expect(result.length).to.equal(1);
    expect(result[0].name).to.equal('Test');
    expect(result[0].lastname).to.equal('User');
    expect(result[0].email).to.equal('test@example.com');
});


  it('Debería obtener todos los usuarios', async () => {
    const users = await db.execute('SELECT * FROM users');
    expect(users).to.be.an('array');
    expect(users.length).to.be.greaterThan(0);
  });

  it('Debería eliminar un usuario', async () => {
    await db.execute('DELETE FROM users WHERE id = 5000');
    const result = await db.execute(`SELECT * FROM users WHERE id = 5000`);
    expect(result.length).to.equal(0);
  });
});
