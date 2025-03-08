#!/bin/bash

# Crea y ejecuta el contenedor con el scraper de python
cd /home/ubuntu/adrenalux-backend/api/scripts/scraper/
sudo docker-compose up -d

# Ejecuta el script que lee, calcula y actualiza los jugadores
cd /home/ubuntu/adrenalux-backend/api/scripts/
node loadPlayers.js
