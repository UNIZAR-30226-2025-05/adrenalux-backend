// Librerías necesarias
import fs from 'fs';
import readline from 'readline';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const API_KEY = process.env.CURRENT_API_KEY;

const currentDir = path.dirname(new URL(import.meta.url).pathname);

//const inputFile = path.join(currentDir, 'playersData', 'S2425-laliga-players.json');

const inputFile = path.join(currentDir, 'playersData', 'S2425-laliga-players.json');
const outputFile = path.join(currentDir, 'playersMetrics', '${getOutputFileName(inputFile)}');
// Asegurar que el archivo existe o crearlo vacío
if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, '[]');
}

// File system para leer el archivo json
const fileStream = fs.createReadStream(inputFile);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
});

const players = [];

// Potenciador de valoraciones por equipo
const teamTiers = {
    "Real Madrid": 1.5,
    "FC Barcelona": 1.5,
    "Atlético de Madrid": 1.3,
    "Sevilla FC": 1.2,
    "Real Sociedad": 1.2,
    "Villarreal CF": 1.2,
    "Real Betis": 1.2,
    "Athletic Club": 1.2,
    "Valencia CF": 1.1,
    "RC Celta": 1.1,
    "RCD Espanyol de Barcelona": 1.0,
    "Getafe CF": 1.0,
    "Rayo Vallecano": 1.0,
    "CA Osasuna": 1.0,
    "RCD Mallorca": 0.9,
    "Girona FC": 0.9,
    "UD Las Palmas": 0.9,
    "Deportivo Alavés": 0.8,
    "Real Valladolid CF": 0.8,
    "CD Leganés": 0.8
};

// Valores minimos, maximos y peso del rating por posicion 
const ratingRanges = {
    forward: { 
        ataque: [60, 90], 
        medio: [60, 85],  
        defensa: [50, 65],
        weight: { ataque: 1.2, medio: 0.8, defensa: 0.6 } 
    },
    midfielder: { 
        ataque: [60, 80],  
        medio: [60, 90], 
        defensa: [60, 80], 
        weight: { ataque: 1.0, medio: 1.2, defensa: 0.8 } 
    },
    defender: { 
        ataque: [30, 60],  
        medio: [60, 85],   
        defensa: [60, 90], 
        weight: { ataque: 0.7, medio: 0.8, defensa: 1.2 } 
    },
    goalkeeper: { 
        ataque: [30, 50], 
        medio: [40, 70],  
        defensa: [60, 90], 
        weight: { ataque: 0.3, medio: 0.7, defensa: 1.5 } 
    }
};

function getOutputFileName(inputFileName) {
    const fileBaseName = path.basename(inputFileName, '.json');
    const timestamp = Math.floor(Date.now() / 1000);
    console.log(`fileBaseName: ${fileBaseName}`)
    console.log(`timestamp: ${timestamp}`)
    console.log(`${fileBaseName}-metrics-${timestamp}.json: ${`${fileBaseName}-metrics-${timestamp}.json`}`)
    return `${fileBaseName}-metrics-${timestamp}.json`;
}

function normalize(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

async function sendDataToAPI() {
    try {
        const playersData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

        const response = await axios.post('http://54.37.50.18:3000/api/v1/jugadores/insertar', playersData, {
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            }
        });

        console.log('Datos enviados con éxito:', response.status);
        
        const endpoints = [
            '/api/v1/jugadores/generar-luxuryxi',
            '/api/v1/jugadores/generar-megaluxury',
            '/api/v1/jugadores/generar-luxury'
        ];

        for (let endpoint of endpoints) {
            try {
                const response = await axios.post(
                    `http://54.37.50.18:3000${endpoint}`, 
                    {}, 
                    { 
                        headers: {
                            'x-api-key': API_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(`${endpoint} exitoso:`, response.status);
            } catch (error) {
                console.error(`Error en ${endpoint}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Error al enviar los datos:', error.message);
        if (error.response) {
            console.error('Estado HTTP:', error.response.status);
            console.error('Datos de respuesta:', error.response.data);
            console.error('Headers de respuesta:', error.response.headers);
        } else if (error.request) {
            console.error('No hubo respuesta del servidor:', error.request);
        } else {
            console.error('Error en la configuración de la solicitud:', error.message);
        }
    }
}


function calculateRating(player) {
    let rating = 0;

    const starts = player.starts || 0;
    const appearances = player.appearances || 1;
    const minutesPlayed = player.time_played || 0;
    const goals = player.goals || 0;
    const goalsPerMatch = goals / appearances;
    const assists = player.goal_assists || 0;
    const duelsWon = player.duels_won || 0;
    const duelsLost = player.duels_lost || 0;
    const groundDuelsWon = player.ground_duels_won || 0;
    const groundDuelsLost = player.ground_duels_lost || 0;
    const aerialDuelsWon = player.aerial_duels_won || 0;
    const aerialDuelsLost = player.aerial_duels_lost || 0;
    const tacklesWon = player.tackles_won || 0;
    const tacklesLost = player.tackles_lost || 0;
    const substituteOff = player.substitute_off || 0;

    rating += 5 * (minutesPlayed / (90 * appearances)) // Hasta 5 puntos por tiempo jugado
    rating += 5 * (starts / appearances);   // Hasta 5 puntos por titularidad
    rating += 0.5 * goals;                  // + 0.5 por gol
    rating += goalsPerMatch * 10;           // Goles por partido * 10
    rating += 0.3 * assists;                // + 0.3 por asistencia
    rating += (duelsWon / ((duelsWon + duelsLost) || 1)); // Porcentaje de duelos ganados
    rating += (groundDuelsWon / ((groundDuelsWon + groundDuelsLost) || 1)); // Porcentaje de duelos de suelo ganados
    rating += (aerialDuelsWon / ((aerialDuelsWon + aerialDuelsLost) || 1)); // Porcentaje de duelos aereos ganados
    rating += (tacklesWon / ((tacklesWon + tacklesLost) || 1)); // Porcentaje de tackles exitosos
    rating -= 0.1 * substituteOff; // - 0.1 por cada partido cambiado

    return rating;
}

function evaluatePlayer(player) {
    const position = player.position && typeof player.position === 'string' ? player.position.toLowerCase() : null;
    if (!position || !ratingRanges[position]) {
        console.error(`Posición no reconocida para: ${player.name}`);
        return null;
    }

    const team = player.team && typeof player.team === 'string' ? player.team : null;
    if (!team || !teamTiers[team]) {
        console.error(`Equipo no reconocido para: ${player.name} (${player.team})`);
        return null;
    }

    const photo = player.photo && typeof player.photo === 'string' ? player.photo : null;
    if (!photo) {
        console.error(`Foto no reconocida para: ${player.name}`);
        return null;
    }

    const country = player.country && typeof player.country === 'string' ? player.country : null;
    if (!country) {
        console.error(`País no reconocido para: ${player.name}`);
        return null;
    }

    const teamFactor = teamTiers[player.team] || 1;
    const weights = ratingRanges[position].weight;
    const ranges = ratingRanges[position];

    let ataque = Math.round(normalize(ranges.ataque[0] + calculateRating(player) * weights.ataque * teamFactor, ranges.ataque[0], ranges.ataque[1]));
    let medio = Math.round(normalize(ranges.medio[0] + calculateRating(player) * weights.medio * teamFactor, ranges.medio[0], ranges.medio[1]));
    let defensa = Math.round(normalize(ranges.defensa[0] + calculateRating(player) * weights.defensa * teamFactor, ranges.defensa[0], ranges.defensa[1]));

    const birthdate = new Date(player.date_of_birth).getTime() / 1000;

    return {
        name: player.name,
        alias: player.nickname,
        //number: player.shirt_number,
        position: player.position.toLowerCase(),
        team: player.team,
        //team_shortname: player["team.shortname"],
        team_shield: player["team.shield"],
        country: player.country,
        //weight: player.weight,
        //height: player.height,
        //birthdate: birthdate,
        photo: player.photo,
        ratings: { ataque, medio, defensa }
    };
}

rl.on('line', (line) => {
    try {
        const data = JSON.parse(line.trim());
        const result = evaluatePlayer(data);
        if (result) {
            players.push(result); 
        }
    } catch (error) {
        console.error(`Error al parsear línea: ${line}\n${error.message}`);
    }
});

rl.on('close', () => {
    console.log(players.length)
    fs.writeFileSync(outputFile, JSON.stringify(players, null, 2));
    console.log('Lectura del archivo finalizada. Resultados guardados.');

    sendDataToAPI();
});