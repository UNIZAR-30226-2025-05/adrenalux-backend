import { db } from '../../config/db.js';
import { expect } from 'chai';
import { sql } from 'drizzle-orm';

describe('Pruebas de conexión a la base de datos', () => {
  it('Debería conectarse a la base de datos de prueba', async () => {
    try {
      const result = await db.execute(sql`SELECT 1+1 AS result;`);
      console.log('Resultado de la consulta:', result);
      expect(result.rows[0].result).to.equal(2);
    } catch (error) {
      console.error('? Error en la conexión:', error);
      expect.fail('No se pudo conectar a la base de datos');
    }
  });
});
