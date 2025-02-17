# Usa la imagen oficial de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código del proyecto al contenedor
COPY . .

# Expone el puerto 3000
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]
