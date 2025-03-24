# Usa una imagen base con Python 3.10
FROM python:3.10-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos del proyecto al contenedor
COPY . /app

# Instala las dependencias del proyecto
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y \
    wget \
    && wget https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz \
    && tar -xvzf geckodriver-v0.33.0-linux64.tar.gz \
    && mv geckodriver /usr/local/bin/

RUN apt-get update && apt-get install -y firefox-esr


# Expone el puerto que el contenedor utilizará
EXPOSE 8080

# Comando para ejecutar el script principal del proyecto
CMD ["python", "main.py", "-v"]
