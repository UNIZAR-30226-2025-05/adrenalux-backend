import request from 'supertest';
import { app } from '../../app.js';
import { clearAllTables } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js'; 

afterAll(async () => {
  await clearAllTables();
  await pool.end(); 
});


describe('Rutas de Autenticación', () => {
  let token;

  // Test para sign-up
  describe('POST /auth/sign-up', () => {
    it('Debería registrar un nuevo usuario', async () => {
      const response = await request(app)
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          username: 'testuser123',
          name: 'Juan',
          lastname: 'Pérez'
        });
        
      console.log('Respuesta del servidor:', response.body);
      expect(response.body.status).toBeDefined();
      expect(response.body.status.error_code).toBe(0);
      expect(response.body.status.error_message).toBe('');
    });

    it('Debería devolver un error si los datos son inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'invalid-email',
          password: '123',
          username: 'us',
          name: '',
          lastname: ''
        });
      
      expect(response.status).toBe(400); 
      expect(response.body).toHaveProperty('status.error_message');
      expect(response.body.status.error_message).toBe('email with invalid format'); 

    });

    it('Debería devolver un error si el correo ya está registrado', async () => {
        // Intentamos registrar un usuario con un correo que ya existe
        const response = await request(app)
          .post('/api/v1/auth/sign-up')
          .send({
            email: 'testuser@example.com', // Usamos el mismo correo registrado previamente
            password: 'password123',
            username: 'newuser123',
            name: 'Ana',
            lastname: 'García'
          });
          
        console.log(response.body);
      
        expect(response.status).toBe(400); 
        expect(response.body.status).toHaveProperty('error_message', 'Este correo ya está en uso.');
      });      
  });

  // Test para sign-in
  describe('POST /auth/sign-in', () => {
    it('Debería iniciar sesión correctamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/v1/auth/sign-in')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          username: 'testuser123',
          name: 'Juan',
          lastname: 'Pérez'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data.token'); // Asegúrate de que devuelva un token
      token = response.body.data.token; // Guardamos el token para usarlo en otras pruebas
    });

    it('Debería devolver un error si las credenciales son inválidas', async () => {
      const response = await request(app)
        .post('/api/v1/auth/sign-in')
        .send({
          email: 'wronguser@example.com',
          password: 'wrongpassword'
        });
        
      console.log(response.body);
      
      expect(response.status).toBe(404); // Error de autenticación
      expect(response.body.status).toHaveProperty('error_message');
      expect(response.body.status.error_message).toBe('Not Found');
    });
  });

  // Test para sign-out 
  describe('POST /auth/sign-out', () => {
    it('Debería cerrar sesión correctamente con un token válido', async () => {
      const response = await request(app)
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${token}`) // Agregamos el token en el encabezado
      .set('x-api-key', process.env.CURRENT_API_KEY);

      console.log(response.body);  // Verifica qué estructura tiene la respuesta
      expect(response.status).toBe(200);  // Verifica que el código de estado es 200
      expect(response.body).toHaveProperty('status');  // Verifica que exista el objeto "status"
      expect(response.body.status).toHaveProperty('error_code', 0);  // El código de error debe ser 0
      expect(response.body.status).toHaveProperty('error_message', '');  // El mensaje de error debe ser vacío
});



    it('Debería devolver un error si no se proporciona un token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/sign-out');
      
      console.log(response.body);
      expect(response.status).toBe(401);  // Verifica que el código de estado sea 401 (Unauthorized)
      expect(response.body).toHaveProperty('status');  // Verifica que exista el objeto "status"
      expect(response.body.status).toHaveProperty('error_code');  // Verifica que el código de error esté presente
      expect(response.body.status.error_code).toBeGreaterThan(0);  // El código de error debe ser mayor que 0
      expect(response.body.status).toHaveProperty('error_message', 'Invalid or missing token');  // Verifica el mensaje de error

    });

    it('Debería devolver un error si el token es inválido o ha expirado', async () => {
        const response = await request(app)
          .post('/api/v1/auth/sign-out')
          .set('Authorization', 'Bearer invalidOrExpiredToken'); // Usar un token inválido o expirado
      
      console.log(response.body);
      expect(response.status).toBe(401); // Error de autenticación
      expect(response.body.status).toHaveProperty('error_message', 'Invalid or missing token');
      });
      
  });

  // Test para validate-token
  describe('POST /auth/validate-token', () => {
    it('Debería validar un token correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .set('Authorization', `Bearer ${token}`);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('isValid', true);
    });

    it('Debería devolver un error si el token es inválido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .set('Authorization', 'Bearer invalidToken');
      
      console.log(response.body);
      expect(response.status).toBe(401); // Verifica que el código de estado sea 401 (Unauthorized)
      expect(response.body).toHaveProperty('status'); // Verifica que exista el objeto "status"
      expect(response.body.status).toHaveProperty('error_code', 1000); // Verifica el código de error
      expect(response.body.status).toHaveProperty('error_message', 'Unauthorized'); // Verifica el mensaje de error
    });

    it('Debería devolver un error si no se proporciona un token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/validate-token'); // No se proporciona token
      
      console.log(response.body);
      expect(response.status).toBe(401); // Verifica que el código de estado sea 401 (Unauthorized)
      expect(response.body).toHaveProperty('status'); // Verifica que exista el objeto "status"
      expect(response.body.status).toHaveProperty('error_code', 1000); // Verifica el código de error
      expect(response.body.status).toHaveProperty('error_message', 'Unauthorized'); // Verifica el mensaje de error
      });
      
  });
});
