import { db } from '../../../config/db.js';
import { expect } from 'chai';

describe('ðŸ‘¤ Pruebas de la tabla de usuarios', () => {

  it('Debería crear un nuevo usuario', async () => {
    await db.execute(`INSERT INTO "user" (id, username, email, name, lastname, salt, friend_code, adrenacoins, experience, level, "puntosClasificacion", avatar) 
                      VALUES (5000, 'TestUser', 'test@example.com', 'Test', 'User', 'salt', 0, 0, 0, 1, 0, 'default')`);
    
    const result = await db.execute(`SELECT * FROM "user" WHERE id = 5000`); 

    expect(result.rows).to.be.an('array');
    expect(result.rows.length).to.equal(1);
    expect(result.rows[0].name).to.equal('Test');
});


  it('Debería obtener todos los usuarios', async () => {
    const users = await db.execute('SELECT * FROM "user"');
    expect(users.rows).to.be.an('array');
    expect(users.rows.length).to.be.greaterThan(0);
  });

  it('Debería eliminar un usuario', async () => {
    await db.execute('DELETE FROM "user" WHERE id = 5000');
    const result = await db.execute(`SELECT * FROM "user" WHERE id = 5000`);
    expect(result.rows.length).to.equal(0);
  });
});
