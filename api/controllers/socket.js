import { Server } from 'socket.io';
import {socketAuth} from '../middlewares/socket_auth.js';
import { db } from '../config/db.js'; 
import { eq, and, inArray } from 'drizzle-orm';
import { objectToJson } from '../lib/toJson.js';
import { carta } from '../db/schemas/carta.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { user } from '../db/schemas/user.js';
import { carta_plantilla } from '../db/schemas/carta_plantilla.js';
import { plantilla } from '../db/schemas/plantilla.js';
import { partida } from '../db/schemas/partida.js';
import { ronda } from '../db/schemas/ronda.js';

const connectedUsers = new Map();
const activeExchanges = new Map();
const matchmakingQueue = new Map(); 
const activeMatches = new Map();

export function configureWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "https://adrenalux.duckdns.org",
      methods: ["GET", "POST"]
    },
    path: "/socket.io", 
    transports: ['websocket'], 
    allowEIO3: true 
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const { username } = socket.handshake.query; 
    socket.data.username = username; 
    
    connectedUsers.set(String(socket.data.userID), socket);

    console.log(`Usuario conectado: ${socket.data.userID}`);

    socket.on('request_exchange', ({ receptorId, solicitanteUsername }) => {
      const solicitanteId = String(socket.data.userID);
      const exchangeId = `${solicitanteId}-${receptorId}`;
  
      if (solicitanteId === receptorId) {
        return socket.emit('error', 'No puedes intercambiar contigo mismo');
      }

      const receptorSocket = connectedUsers.get(String(receptorId));
      
      if (!receptorSocket) {
          return socket.emit('error', 'El usuario no está conectado');
      }

      console.log("Enviando invitacion de intercambio con id ", exchangeId);

      activeExchanges.set(exchangeId, {
          roomId: `exchange_${exchangeId}`,
          participants: [String(solicitanteId), String(receptorId)],
          estado: 'pendiente',
          selectedCards: {},
          confirmations: {},
      });

      receptorSocket.emit('request_exchange_received', {
          exchangeId,
          solicitanteId,
          solicitanteUsername,
          timestamp: new Date().toISOString()
      });
    });

    socket.on('accept_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const intercambio = activeExchanges.get(exchangeId);
  
      if (!intercambio || intercambio.participants[1] !== userId) {
        return socket.emit('error', 'Intercambio no válido');
      }
      const solicitanteId = intercambio.participants[0];
      const receptorId = intercambio.participants[1];

      const solicitanteSocket = connectedUsers.get(intercambio.participants[0]);
      const receptorSocket = connectedUsers.get(intercambio.participants[1]);

      const solicitanteUsername = solicitanteSocket?.data.username || 'Usuario';
      const receptorUsername = receptorSocket?.data.username || 'Usuario';
  
      intercambio.estado = 'activo';
      intercambio.selectedCard = {
        [solicitanteId]: [],
        [receptorId]: []
      };
      intercambio.confirmations = {
        [solicitanteId]: false,
        [receptorId]: false
      };

      if (!solicitanteSocket.rooms.has(intercambio.roomId)) {
        solicitanteSocket.join(intercambio.roomId);
      }
      
      if (!receptorSocket.rooms.has(intercambio.roomId)) {
        receptorSocket.join(intercambio.roomId);
      }

      io.to(intercambio.roomId).emit('exchange_accepted', {
        exchangeId,
        roomId: intercambio.roomId,
        solicitanteUsername: solicitanteUsername,
        receptorUsername: receptorUsername, 
      });
    });

    socket.on('select_cards', async ({ exchangeId, cardId }) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      const cards = await db.select().from(carta).where(eq(carta.id, cardId));
      const card = cards[0];  

      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }

      if (!exchange.participants.includes(userId)) {
        return socket.emit('error', 'No eres parte de este intercambio');
      }

      exchange.selectedCard[userId] = card;
      exchange.confirmations[userId] = false;

      io.to(exchange.roomId).emit('cards_selected', {
        exchangeId,
        userId,
        card : objectToJson(card),
      });
    });

    socket.on('confirm_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }

      exchange.confirmations[userId] = !exchange.confirmations[userId];
      
      io.to(exchange.roomId).emit('confirmation_updated', {
        exchangeId,
        confirmations: exchange.confirmations
      });

      const bothConfirmed = exchange.participants.every(
        participant => exchange.confirmations[participant]
      );

      if (bothConfirmed) {
        const [user1, user2] = exchange.participants;
        const user1Card = exchange.selectedCard[user1];
        const user2Card = exchange.selectedCard[user2];

        handleCardExchange(io, exchangeId, user1, user2, user1Card.id, user2Card.id);
      }
    });

    socket.on('cancel_confirmation', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);
    
      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }
    
      exchange.confirmations[userId] = false;
      
      io.to(exchange.roomId).emit('confirmation_updated', {
        exchangeId,
        confirmations: exchange.confirmations
      });
    });

    socket.on('cancel_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      if (!exchange || !exchange.participants.includes(userId)) {
        return socket.emit('error', 'Intercambio no válido');
      }

      io.to(exchange.roomId).emit('exchange_cancelled', {
        exchangeId,
        message: 'Intercambio cancelado'
      });

      activeExchanges.delete(exchangeId);
      exchange.participants.forEach(participantId => {
        connectedUsers.get(participantId)?.leave(exchange.roomId);
      });
    });

    const getPlantilla = async (userId) => {
      const numericUserId = Number(userId);
      try {
        const userPlantillas = await db.select()
          .from(plantilla)
          .where(eq(plantilla.user_id, numericUserId));
        
        if (userPlantillas.length === 0) {
          console.log("No hay plantillas del usuario");
          return [];
        }
    
        const plantillaId = userPlantillas[0].id;

        const cartas = await db.select({
          id: carta.id,
          nombre: carta.nombre,
          position: carta.posicion,
          defensa: carta.defensa,
          control: carta.control,
          tiro: carta.ataque 
        })
        .from(carta_plantilla)
        .innerJoin(carta, eq(carta_plantilla.carta_id, carta.id))
        .where(eq(carta_plantilla.plantilla_id, plantillaId),);

        return cartas;
        
      } catch (error) {
        console.error('Error obteniendo plantilla:', error);
        return [];
      }
    };

    
    function getMaxRatingDifference(queueTime) {
      const baseDifference = 100;
      const timeMultiplier = Math.floor(queueTime / 10000); 
      return baseDifference + (timeMultiplier * 100);
    }

    setInterval(() => {
      const now = Date.now();
      const queueArray = Array.from(matchmakingQueue.values());
      
      for (let i = 0; i < queueArray.length; i++) {
        const player1 = queueArray[i];
        if (!player1) continue;

        for (let j = i + 1; j < queueArray.length; j++) {
          const player2 = queueArray[j];
          if (!player2) continue;

          const ratingDifference = Math.abs(player1.puntos - player2.puntos);
          const maxAllowedDifference = getMaxRatingDifference(now - player1.timestamp);

          console.log(`Comparando jugador ${player1.userId} (puntos: ${player1.puntos}) y jugador ${player2.userId} (puntos: ${player2.puntos}). Diferencia: ${ratingDifference}, Máximo permitido: ${maxAllowedDifference}`);

          if (ratingDifference <= maxAllowedDifference) {
            createMatch(player1, player2);

            matchmakingQueue.delete(player1.userId);
            matchmakingQueue.delete(player2.userId);
            break;
          }
        }
      }
    }, 5000);

    socket.on('join_matchmaking', async () => {
      const userId = String(socket.data.userID);
      
      const [userData] = await db.select().from(user).where(eq(user.id, userId));
      const puntos = userData.puntosClasificacion;

      console.log(`Jugador ${userId} ingresó al matchmaking con ${puntos} puntos a las ${new Date().toISOString()}`);
  
      matchmakingQueue.set(userId, {
        socket,
        puntos,
        timestamp: Date.now(),
        userId
      });
  
      socket.emit('matchmaking_status', { inQueue: true });
    });
  
    socket.on('leave_matchmaking', () => {
      const userId = String(socket.data.userID);

      console.log(`Jugador ${userId} salió del matchmaking`);

      matchmakingQueue.delete(userId);
      socket.emit('matchmaking_status', { inQueue: false });
    });

    const createMatch = async (player1, player2) => {
      const user1_id = String(player1.userId);
      const user2_id = String(player2.userId);

      console.log(`Match creado entre ${player1.userId} y ${player2.userId}.`);

      const [newMatch] = await db.insert(partida)
        .values({
          turno: user1_id,
          user1_id: user1_id,
          user2_id: user2_id,
          estado: 'activa'
        }).returning();
    
      const [plantilla1, plantilla2] = await Promise.all([
        getPlantilla(user1_id),
        getPlantilla(user2_id)
      ]);
      const matchId = newMatch.id;
      const roomId = `match_${matchId}`;

      const matchState = {
        matchId,
        players: {
          [user1_id]: {
            id : user1_id,
            socket: player1.socket,
            plantilla: plantilla1,
            puntosIniciales: player1.puntos,
            score: 0
          },
          [user2_id]: {
            id : user2_id,
            socket: player2.socket,
            plantilla: plantilla2,
            puntosIniciales: player2.puntos,
            score: 0
          }
        },
        turno : user1_id,
        currentRound: 1,
        roomId: `match_${matchId}`,
        status: 'active'
      };
    
      activeMatches.set(matchId, matchState);
  
      player1.socket.join(roomId);
      player2.socket.join(roomId);
  
      io.to(roomId).emit('match_found', {
        matchId,
        opponentPuntos: {
          [user1_id]: player1.puntos,
          [user2_id]: player2.puntos
        }
      });

      startNewRound(matchId);
    };  

    const getOpponentId = (players, turno) => {
      const playerIds = Object.keys(players);
      return playerIds.find(playerId => playerId !== turno);
    };

    const startNewRound = (matchId) => {
      const match = activeMatches.get(matchId);
      if (!match) return;

      Object.values(match.players).forEach(player => {
        player.socket.removeAllListeners('select_card');
      });

      let turnoId = match.turno;

      if(match.currentRoundData != null) {
        turnoId = getOpponentId(match.players, match.currentRoundData.starter);
      }

      match.currentRoundData = {
        stage: 'selection',
        starter: turnoId,
        carta_j1: null,
        habilidad_j1: null,
        carta_j2: null,
        habilidad_j2: null
      };

      console.log("Starter: ", match.currentRoundData.starter);

      Object.keys(match.players).forEach(playerId => {
        match.players[playerId].socket.emit('round_start', {
          roundNumber: match.currentRound,
          starter: match.currentRoundData.starter,
          phase: 'selection'
        });
      });
    
      const selectionTimer = setTimeout(() => {
        //handleTimeout(matchId);
      }, 30000); 
    
      Object.values(match.players).forEach(player => {
        player.socket.once('select_card', async ({ cartaId, skill }) => {
          const userId = String(player.socket.data.userID);
          console.log("Llego evento select_card de usuario ", userId);
          if (userId !== match.currentRoundData.starter) return;
    
          clearTimeout(selectionTimer);
    
          const cartaValida = match.players[userId].plantilla.some(c => String(c.id) === String(cartaId));

          console.log("Skill, ", skill);
          if (!cartaValida || !['ataque', 'control', 'defensa'].includes(skill)) {
            console.log("La carta elegida no es valida, Id: ", cartaId);
            return match.starter.socket.emit('error', 'Selección inválida');
          }
    
          const [cartaData] = await db.select().from(carta).where(eq(carta.id, cartaId));
          
          match.currentRoundData.carta_j1 = cartaData;
          match.currentRoundData.habilidad_j1 = skill;

          const opponentId = Object.keys(match.players).find(id => id !== userId);
          const opponent = match.players[opponentId];
          
          console.log("Enviando mensaje a adversario ",opponentId,  " Eleccion carta: ", cartaData.posicion);
          opponent.socket.emit('opponent_selection', {
            skill,
            carta: objectToJson(cartaData),
            timer: 30
          });
    
          startResponsePhase(matchId);
        });
      });
    };
    
    const startResponsePhase = (matchId) => {
      const match = activeMatches.get(matchId);
      const responderId = Object.keys(match.players).find(id => id !== match.currentRoundData.starter);
      const responder = match.players[responderId];
    
      const responseTimer = setTimeout(() => {
        //handleTimeout(matchId);
      }, 30000);
    
      responder.socket.once('select_response', async ({ cartaId, skill }) => {
        clearTimeout(responseTimer);
        
        const [cartaData] = await db.select().from(carta).where(eq(carta.id, cartaId));
        match.currentRoundData.carta_j2 = cartaData;
        match.currentRoundData.habilidad_j2 = skill;

        resolveRound(matchId);
      });
    };
    
    const resolveRound = async (matchId) => {
      const match = activeMatches.get(matchId);
      const { carta_j1, habilidad_j1, carta_j2, habilidad_j2 } = match.currentRoundData;

      await db.insert(ronda).values({
        partida_id: matchId,
        numero_ronda: match.currentRound,
        carta_j1: carta_j1.id,
        habilidad_j1,
        carta_j2: carta_j2.id,
        habilidad_j2,
        ganador_id: null 
      });
      
      const valor_j1 = carta_j1[habilidad_j1];
      const valor_j2 = carta_j2[habilidad_j2];
      
      let ganador;
      if (valor_j1 === valor_j2) {
          ganador = 'draw';
      } else if (valor_j1 > valor_j2) {
          ganador = match.currentRoundData.starter;
      } else {
          ganador = Object.keys(match.players).find(id => id !== match.currentRoundData.starter);
      }

      match.players[ganador].score++;  
    
      await db.update(ronda)
      .set({ ganador_id : ganador })
      .where(and(
        eq(ronda.partida_id, matchId),
        eq(ronda.numero_ronda, match.currentRound)
      ));
    
      io.to(match.roomId).emit('round_result', {
        ganador,
        scores: Object.keys(match.players).reduce((acc, id) => {
          acc[id] = match.players[id].score;  
          return acc;
        }, {}),
        detalles: {
          jugador1: match.currentRoundData.starter,
          carta_j1: objectToJson(carta_j1),
          skill_j1: habilidad_j1,
          carta_j2: objectToJson(carta_j2),
          skill_j2: habilidad_j2
        }
      });

      const playerIds = Object.keys(match.players);
      
      if (playerIds.some(id => match.players[id].score >= 6) || match.currentRound >= 11) {
        const ganadorId = playerIds.reduce((maxId, id) =>
          match.players[id].score > match.players[maxId].score ? id : maxId,
          playerIds[0]
        );
        finishMatch(match.matchId, ganadorId);
      } else {
        match.currentRound++;
        console.log("Empezando nueva ronda, ha ganado ", ganador);
        startNewRound(matchId);
      }
    };
  
    const finishMatch = async (matchId, winnerId) => {
      const match = activeMatches.get(matchId);
      if (!match) return;
    
      try {
        const [dbMatch] = await db.select().from(partida).where(eq(partida.id, matchId));
        
        const player1Id = String(dbMatch.user1_id);
        const player2Id = String(dbMatch.user2_id);

        if (!match.players[player1Id] || !match.players[player2Id]) {
            throw new Error('Jugadores no encontrados en el match state');
        }

        const puntuacion1 = match.players[player1Id].score || 0;
        const puntuacion2 = match.players[player2Id].score || 0;

        await db.update(partida)
        .set({ 
            estado: 'finalizada',
            puntuacion1: puntuacion1,
            puntuacion2: puntuacion2,
            ganador_id: winnerId === 'draw' ? null : Number(winnerId)
        })
        .where(eq(partida.id, matchId));
    
        const isDraw = winnerId === 'draw';
        const puntosChange = calculateRatingChange(
          player1Id,
          player2Id,
          match.players[player1Id].puntosIniciales,
          match.players[player2Id].puntosIniciales,
          isDraw ? null : (winnerId === player1Id)
        );

        await db.transaction(async (tx) => {
          await tx.update(user)
              .set({ puntosClasificacion: match.players[player1Id].puntosIniciales + puntosChange[player1Id] })
              .where(eq(user.id, Number(player1Id)));

          await tx.update(user)
              .set({ puntosClasificacion: match.players[player2Id].puntosIniciales + puntosChange[player2Id] })
              .where(eq(user.id, Number(player2Id)));
        });
        
        io.to(match.roomId).emit('match_ended', {
          winnerId: isDraw ? null : winnerId,
          isDraw,
          scores: {
              [player1Id]: puntuacion1,
              [player2Id]: puntuacion2
          },
          puntosChange
        });
    
      } catch (error) {
        console.error('Error finalizando partida:', error);
        io.to(match.roomId).emit('match_error', {
          message: 'Error al finalizar la partida'
        });
      } finally {
        activeMatches.delete(matchId);
        if (match?.players) {
            Object.values(match.players).forEach(player => {
                player.socket?.leave(match.roomId);
            });
        }
      }
    };
  
    const calculateRatingChange = (player1Id, player2Id, puntos1, puntos2, isPlayer1Winner) => {
      const K = 32;
      const expected1 = 1 / (1 + 10 ** ((puntos2 - puntos1) / 400));
      const expected2 = 1 - expected1;
  
      let score1, score2;
      if (isPlayer1Winner === null) { 
        score1 = score2 = 0.5;
      } else {
        score1 = isPlayer1Winner ? 1 : 0;
        score2 = 1 - score1;
      }
  
      return {
        [player1Id]: Math.round(K * (score1 - expected1)),
        [player2Id]: Math.round(K * (score2 - expected2))
      };
    };

    
    socket.on('disconnect', () => {
      socket.rooms.forEach(room => socket.leave(room));
      connectedUsers.delete(String(socket.data.userID));
      console.log(`Usuario desconectado: ${socket.data.userID}`);
    });    
  });

  return io;
}

export function sendNotification(toUserId, type, data) {
  const targetSocket = connectedUsers.get(String(toUserId));
  if (targetSocket) {
    targetSocket.emit('notification', {
      message: data['message'],
      data: {
          requestId: data['id'],
          type: type,
          timestamp: new Date().toISOString()
      }
  });
  } 
}

export function isConnected(userId) {
  return connectedUsers.has(String(userId));
}

async function handleCardExchange(io, exchangeId, user1, user2, user1Card, user2Card) {
  const exchange = activeExchanges.get(exchangeId);
  try {
    const [user1Collection] = await db.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user1), eq(coleccion.carta_id, user1Card)));

    const [user2Collection] = await db.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));

    if (!user1Collection || !user2Collection) {
      console.log("Una o ambas cartas no están disponibles para intercambio");
      throw new Error('Una o ambas cartas no están disponibles para intercambio');
    }

    await db.transaction(async (tx) => {
        // Quitar cartas a los usuarios
        if (user1Collection.cantidad === 1) {
          console.log("Borrando carta de ", user1);
          await tx.delete(coleccion)
              .where(and(eq(coleccion.user_id, user1), eq(coleccion.carta_id, user1Card)));
  
        } else {
          console.log("Restando uno a carta de ", user1);
          await tx.update(coleccion)
              .set({ cantidad: user1Collection.cantidad - 1 })
              .where(and(eq(coleccion.user_id, user1),eq(coleccion.carta_id, user1Card)));
        }

        if (user2Collection.cantidad === 1) {
          console.log("Borrando carta de ", user2);
          await tx.delete(coleccion)
              .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));
        } else {
          console.log("Restando uno a carta de ", user2);
          await tx.update(coleccion)
              .set({ cantidad: user2Collection.cantidad - 1 })
              .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));
        }

        // Añadir cartas a los usuarios
        const [user1NewCard] = await tx.select()
            .from(coleccion)
            .where(and(eq(coleccion.user_id, user1) , eq(coleccion.carta_id, user2Card)));

        const [user2NewCard] = await tx.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user2) , eq(coleccion.carta_id, user1Card)));

        if (user1NewCard) {
          console.log("Sumando uno a carta de usuario1 ", user1, user1NewCard);
          await tx.update(coleccion)
              .set({ cantidad: user1NewCard.cantidad + 1 })
              .where(and(eq(coleccion.user_id, user1) , eq(coleccion.carta_id, user2Card)));
        } else {
          console.log("Insertando carta a usuario1 ", user1);
          await tx.insert(coleccion).values({
              user_id: user1,
              carta_id: user2Card,
              cantidad: 1
          });
        }
        
        if (user2NewCard) {
          console.log("Sumando uno a carta a usuario 2 ", user2, user2NewCard);
          await tx.update(coleccion)
              .set({ cantidad: user2NewCard.cantidad + 1 })
              .where(and(eq(coleccion.user_id, user2) , eq(coleccion.carta_id, user1Card)));
        } else {
          console.log("Insertando carta a usuario 2 ", user2);
          await tx.insert(coleccion).values({
              user_id: user2,
              carta_id: user1Card,
              cantidad: 1
          });
        }
    });

    io.to(exchange.roomId).emit('exchange_completed', {
        exchangeId,
        message: 'Intercambio realizado con éxito',
        user1Card,
        user2Card
    });

  } catch (error) {
    io.to(exchange.roomId).emit('exchange_error', {
        exchangeId,
        message: 'Error en el intercambio: ' + error.message
    });
  } finally {
    activeExchanges.delete(exchangeId);
    exchange.participants.forEach(participantId => {
        connectedUsers.get(participantId)?.leave(exchange.roomId);
    });
  }
}