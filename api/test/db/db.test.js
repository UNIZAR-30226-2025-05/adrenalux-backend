import { db } from '../../api/config/db.js';  // Tu archivo de configuración de base de datos
import { expect } from 'chai';  

describe('Database Tests', () => {
  before(async () => {
    // Conéctate a la base de datos de prueba (usa la configuración de .env.test)
    await db.connect();
  });

  after(async () => {
    // Cierra la conexión a la base de datos después de las pruebas
    await db.disconnect();
  });

  it('deberia mostrar todos los usuarios', async () => {
    const result = await db.select().from('user');
    expect(result).to.have.lengthOf.above(0);  // Verifica que haya resultados
  });

  it('deberia crear un nuevo usuario', async () => {
    const newUser = { name: 'Test User', email: 'test@example.com' };
    const result = await db.insert('user', newUser);
    expect(result).to.have.property('id');
  });

  // Otros tests relacionados con la base de datos
});
