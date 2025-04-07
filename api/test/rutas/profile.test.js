import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken } from '../utils/dbHelper.js';

describe('Perfil de Usuario - Rutas', () => {
  let token;

  // Antes de cada test, obtener un token válido para el usuario autenticado
  beforeAll(() => {
    token = getAuthToken(); 
  });

  // Test para obtener el perfil
  it('Debería obtener el perfil del usuario', async () => {
    const response = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('email');
  });

  // Test para actualizar el perfil
  it('Debería actualizar el perfil del usuario', async () => {
    const updatedData = {
      username: 'newUsername',
      name: 'New Name',
      lastname: 'New Lastname',
    };

    const response = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe(updatedData.username);
    expect(response.body.data.name).toBe(updatedData.name);
  });

  // Test para obtener nivel y experiencia
  it('Debería obtener el nivel y la experiencia del usuario', async () => {
    const response = await request(app)
      .get('/profile/levelxp')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('level');
    expect(response.body.data).toHaveProperty('experience');
  });

  // Test para obtener clasificación
  it('Debería obtener la clasificación del usuario', async () => {
    const response = await request(app)
      .get('/profile/clasificacion')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('puntosClasificacion');
  });

  // Test para cambiar la contraseña
  it('Debería cambiar la contraseña del usuario', async () => {
    const passwordData = {
      oldPassword: 'oldpassword123',
      newPassword: 'newpassword123',
    };

    const response = await request(app)
      .put('/profile/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Contraseña cambiada correctamente');
  });

  // Test para eliminar la cuenta del usuario
  it('Debería eliminar la cuenta del usuario', async () => {
    const response = await request(app)
      .delete('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cuenta eliminada correctamente');
  });

  // Test para obtener amigos
  it('Debería obtener la lista de amigos del usuario', async () => {
    const response = await request(app)
      .get('/profile/friends')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
