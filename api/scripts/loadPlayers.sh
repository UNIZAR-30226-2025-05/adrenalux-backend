#!/bin/bash

cd /home/ubuntu/adrenalux-backend/api/scripts/laliga-data/

sudo docker-compose up --build --abort-on-container-exit

if [ $? -eq 0 ]; then
    cd /home/ubuntu/adrenalux-backend/api/scripts/
    node loadPlayers.js
else
    echo "El contenedor falló, no se ejecutará loadPlayers.js"
fi
