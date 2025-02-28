-- Esquema para la tabla de usuarios
CREATE TABLE IF NOT EXISTS "user" (
  "id" SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  lastname VARCHAR(255),
  "password" VARCHAR(255),
  salt VARCHAR(255),
  friend_code VARCHAR(255),
  experience INT DEFAULT 0,
  adrenacoins INT DEFAULT 0,
  puntosClasificacion INT DEFAULT 0
);

-- Esquema para la tabla de amistades
CREATE TABLE IF NOT EXISTS "amistad" (
  "id" SERIAL PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  estado VARCHAR(255) DEFAULT 'pendiente',
  FOREIGN KEY (user1_id) REFERENCES "user" (id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES "user" (id) ON DELETE CASCADE
);

-- Insertar algunos datos iniciales (opcional)
INSERT INTO "user" (username, email, name, lastname, password, salt, friend_code)
VALUES
  ('user1', 'user1@example.com', 'User', 'One', 'hashed_password', 'random_salt', 'FRIEND123'),
  ('user2', 'user2@example.com', 'User', 'Two', 'hashed_password', 'random_salt', 'FRIEND456'),
  ('user3', 'user3@example.com', 'User', 'Three', 'hashed_password', 'random_salt', 'FRIEND789');

INSERT INTO "amistad" (user1_id, user2_id, estado)
VALUES
  (1, 2, 'aceptada');
