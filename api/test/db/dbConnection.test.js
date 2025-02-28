import { db } from '../../api/config/db.js';
import { expect } from 'chai';

describe('🛠️ Pruebas de conexión a la base de datos', () => {
  it('Debería conectarse a la base de datos de prueba', async () => {
    try {
      const result = await db.execute('SELECT 1+1 AS result');
      expect(result[0].result).to.equal(2);
    } catch (error) {
      expect.fail('No se pudo conectar a la base de datos');
    }
  });
});
