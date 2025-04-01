import request from 'supertest';
import { app } from '../app.js'; 

describe('Rutas de Autenticación', () => {
  let token;

  // Test para sign-up
  describe('POST /auth/sign-up', () => {
    it('Debería registrar un nuevo usuario', async () => {
      const response = await request(app)
        .post('/auth/sign-up')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          username: 'testuser123',
          name: 'Juan',
          lastname: 'Pérez'
        });
      
      expect(response.status).toBe(201); // Verifica que la respuesta sea 201
      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
    });

    it('Debería devolver un error si los datos son inválidos', async () => {
      const response = await request(app)
        .post('/auth/sign-up')
        .send({
          email: 'invalid-email',
          password: '123',
          username: 'us',
          name: '',
          lastname: ''
        });
      
      expect(response.status).toBe(400); // Error por datos inválidos
      expect(response.body).toHaveProperty('error');
    });

    it('Debería devolver un error si el correo ya está registrado', async () => {
        // Intentamos registrar un usuario con un correo que ya existe
        const response = await request(app)
          .post('/auth/sign-up')
          .send({
            email: 'testuser@example.com', // Usamos el mismo correo registrado previamente
            password: 'password123',
            username: 'newuser123',
            name: 'Ana',
            lastname: 'García'
          });
      
        expect(response.status).toBe(409); // Debería devolver un error de conflicto (409)
        expect(response.body).toHaveProperty('error', 'El correo ya está registrado');
      });      
  });

  // Test para sign-in
  describe('POST /auth/sign-in', () => {
    it('Debería iniciar sesión correctamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/auth/sign-in')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token'); // Asegúrate de que devuelva un token
      token = response.body.token; // Guardamos el token para usarlo en otras pruebas
    });

    it('Debería devolver un error si las credenciales son inválidas', async () => {
      const response = await request(app)
        .post('/auth/sign-in')
        .send({
          email: 'wronguser@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401); // Error de autenticación
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test para sign-out
  describe('POST /auth/sign-out', () => {
    it('Debería cerrar sesión correctamente con un token válido', async () => {
      const response = await request(app)
        .post('/auth/sign-out')
        .set('Authorization', `Bearer ${token}`); // Agregamos el token en el encabezado

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Sesión cerrada correctamente');
    });

    it('Debería devolver un error si no se proporciona un token', async () => {
      const response = await request(app)
        .post('/auth/sign-out');
      
      expect(response.status).toBe(401); // Error de autenticación
      expect(response.body).toHaveProperty('error');
    });

    it('Debería devolver un error si el token es inválido o ha expirado', async () => {
        const response = await request(app)
          .post('/auth/sign-out')
          .set('Authorization', 'Bearer invalidOrExpiredToken'); // Usar un token inválido o expirado
      
        expect(response.status).toBe(401); // Error de autenticación
        expect(response.body).toHaveProperty('error', 'Token inválido o expirado');
      });
      
  });

  // Test para validate-token
  describe('POST /auth/validate-token', () => {
    it('Debería validar un token correctamente', async () => {
      const response = await request(app)
        .post('/auth/validate-token')
        .set('Authorization', `Bearer ${token}`); // Agregar el token

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isValid', true);
    });

    it('Debería devolver un error si el token es inválido', async () => {
      const response = await request(app)
        .post('/auth/validate-token')
        .set('Authorization', 'Bearer invalidToken');
      
      expect(response.status).toBe(401); // Error de autenticación
      expect(response.body).toHaveProperty('error');
    });

    it('Debería devolver un error si no se proporciona un token', async () => {
        const response = await request(app)
          .post('/auth/validate-token'); // No se proporciona token
      
        expect(response.status).toBe(401); // Error de autenticación
        expect(response.body).toHaveProperty('error', 'Token no proporcionado');
      });
      
  });
});
