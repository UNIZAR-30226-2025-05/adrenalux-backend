import { Server } from 'socket.io';
import {socketAuth} from '../middlewares/socket_auth.js';
import { db } from '../config/db.js'; 
import { eq, and, asc } from 'drizzle-orm';
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
const pausedMatches = new Map();
const activeMatchRequests = new Map();

export const getPlantilla = async (userId) => {
  const numericUserId = Number(userId);
  try {
    const [usuario] = await db.select()
      .from(user)
      .where(eq(user.id, numericUserId));

    if (!usuario || usuario.plantilla_activa_id === null) {
      console.log("Usuario sin plantilla activa");
      return { plantillaId: null, cartas: [] }; 
    }

    const plantillaId = usuario.plantilla_activa_id;

    const cartas = await db.select({
      id: carta.id,
      nombre: carta.nombre,
      position: carta.posicion,
      defensa: carta.defensa,
      control: carta.control,
      ataque: carta.ataque 
    })
    .from(carta_plantilla)
    .innerJoin(carta, eq(carta_plantilla.carta_id, carta.id))
    .where(eq(carta_plantilla.plantilla_id, plantillaId));

    return { plantillaId, cartas }; 
    
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    return { plantillaId: null, cartas: [] }; 
  }
};

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

    /*
     * Intercambios
     *
     */

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

    /*
     * Partidas
     *
     */
    
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

    socket.on('request_match', ({ receptorId, solicitanteUsername }) => {
      const solicitanteId = String(socket.data.userID);
      const matchRequestId = `${solicitanteId}-${receptorId}`;
    
      if (solicitanteId === receptorId) {
        return socket.emit('error', 'No puedes jugar contra ti mismo');
      }
    
      const receptorSocket = connectedUsers.get(String(receptorId));
      if (!receptorSocket) {
        return socket.emit('error', 'El usuario no está conectado');
      }
    
      activeMatchRequests.set(matchRequestId, {
        solicitanteId,
        receptorId,
        solicitanteUsername,
        timestamp: Date.now(),
        status: 'pending'
      });
    
      receptorSocket.emit('request_match_received', {
        matchRequestId,
        solicitanteId,
        solicitanteUsername,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('accept_match', async (matchRequestId) => {
      const userId = String(socket.data.userID);
      const request = activeMatchRequests.get(matchRequestId);
    
      if (!request || request.receptorId !== userId) {
        return socket.emit('error', 'Solicitud de partida no válida');
      }
    
      activeMatchRequests.delete(matchRequestId);
    
      const [player1Data] = await db.select().from(user).where(eq(user.id, request.solicitanteId));
      const [player2Data] = await db.select().from(user).where(eq(user.id, request.receptorId));
    
      const player1 = {
        socket: connectedUsers.get(request.solicitanteId),
        puntos: player1Data.puntosClasificacion,
        userId: request.solicitanteId
      };
    
      const player2 = {
        socket: connectedUsers.get(request.receptorId),
        puntos: player2Data.puntosClasificacion,
        userId: request.receptorId
      };
    
      createMatch(player1, player2);
    });

    socket.on('decline_match', (matchRequestId) => {
      const userId = String(socket.data.userID);
      const request = activeMatchRequests.get(matchRequestId);
    
      if (!request || request.receptorId !== userId) {
        return socket.emit('error', 'Solicitud de partida no válida');
      }
    
      activeMatchRequests.delete(matchRequestId);
      
      const solicitanteSocket = connectedUsers.get(request.solicitanteId);
      if (solicitanteSocket) {
        solicitanteSocket.emit('match_declined', {
          matchRequestId,
          message: 'La solicitud de partida fue rechazada'
        });
      }
    });

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

    socket.on('surrender', ({ matchId }) => {  
      const userId = String(socket.data.userID);
      console.log("Recibida rendicion de: ", userId);
      const match = activeMatches.get(Number(matchId));
      if (!match) {
        return socket.emit('error', 'Partida no encontrada o ya finalizada');
      }
    
      if (!match.players[userId]) {
        return socket.emit('error', 'No eres parte de esta partida');
      }
    
      const opponentId = Object.keys(match.players).find(id => id !== userId);
      
      finishMatch(matchId, opponentId);
    });

    socket.on('request_pause', async ({ matchId }) => {
      const userId = String(socket.data.userID);
      const match = activeMatches.get(Number(matchId));
      
      if (!match || match.status !== 'active') {
        return socket.emit('error', 'Partida no encontrada');
      }
    
      if (!match.pauseRequests) {
        match.pauseRequests = {[userId]: true};
      } else {
        match.pauseRequests[userId] = true;
      }
    
      if (Object.keys(match.pauseRequests).length === 2) {
        await db.update(partida)
          .set({ estado: 'pausada' })
          .where(eq(partida.id, Number(matchId)));
    
        io.to(match.roomId).emit('match_paused', {
          matchId,
        });
        
        activeMatches.delete(matchId);
      } else {
        const opponentId = Object.keys(match.players).find(id => id !== userId);
        const opponent = match.players[opponentId];
        opponent.socket.emit('pause_requested', { matchId });
      }
    });
    
    socket.on('request_resume', async ({ matchId }) => {
      const userId = String(socket.data.userID);
      
      const [dbMatch] = await db.select()
        .from(partida)
        .where(and(
          eq(partida.id, matchId),
          eq(partida.estado, 'pausada')
        ));
    
      if (!dbMatch) return socket.emit('error', 'Partida no encontrada o no está pausada');
    
      if (!pausedMatches.has(matchId)) {
        pausedMatches.set(matchId, {
          [dbMatch.user1_id]: false,
          [dbMatch.user2_id]: false
        });
      }
    
      const confirmations = pausedMatches.get(matchId);
      confirmations[userId] = true;
    
      if (Object.values(confirmations).every(Boolean)) {
        const usedCards = await getUsedCards(matchId);
        const scores = {
          user1: dbMatch.puntuacion1,
          user2: dbMatch.puntuacion2
        };
    
        const matchState = await rebuildMatchState(dbMatch);
        
        await db.update(partida)
          .set({ estado: 'activa' })
          .where(eq(partida.id, matchId));
    
        activeMatches.set(Number(matchId), matchState);
        pausedMatches.delete(matchId);

        Object.values(matchState.players).forEach(player => {
          if (player.socket) {
              player.socket.join(matchState.roomId);
          }
        });
    
        io.to(`match_${matchId}`).emit('match_resumed', {
          matchId,
          scores,
          usedCards,
          plantilla1: dbMatch.plantilla1_id,
          plantilla2: dbMatch.plantilla2_id,
          user1Id: dbMatch.user1_id,
          user2Id: dbMatch.user2_id,
        });

        startNewRound(Number(matchId));
      }else {
        const opponentId = Object.keys(confirmations).find(id => id !== userId);
        const opponentSocket = connectedUsers.get(String(opponentId));

        opponentSocket.emit('resume_confirmation', {
          confirmations,
          matchId
        });
      }
    });

    socket.on('cancel_request_resume', () => {
      const userId = String(socket.data.userID);
      removeFromPausedMatches(userId);
    });

    function removeFromPausedMatches(userId) {
      pausedMatches.forEach((confirmations, matchId) => {
        if (confirmations[userId]) {
          confirmations[userId] = false;
          if (Object.keys(confirmations).length === 0) {
            pausedMatches.delete(matchId);
          }
        }
      });
    }

    async function rebuildMatchState(dbMatch) {
  
      const [user1] = await db.select()
          .from(user)
          .where(eq(user.id, dbMatch.user1_id));
      
      const [user2] = await db.select()
          .from(user)
          .where(eq(user.id, dbMatch.user2_id));

      const player1Socket = connectedUsers.get(String(dbMatch.user1_id));
      const player2Socket = connectedUsers.get(String(dbMatch.user2_id));

      const cartas1 = await db.select({
        id: carta.id,
        nombre: carta.nombre,
        position: carta.posicion,
        defensa: carta.defensa,
        control: carta.control,
        tiro: carta.ataque 
      })
      .from(carta_plantilla)
      .innerJoin(carta, eq(carta_plantilla.carta_id, carta.id))
      .where(eq(carta_plantilla.plantilla_id, dbMatch.plantilla1_id));
      
      const cartas2 = await db.select({
        id: carta.id,
        nombre: carta.nombre,
        position: carta.posicion,
        defensa: carta.defensa,
        control: carta.control,
        ataque: carta.ataque 
      })
      .from(carta_plantilla)
      .innerJoin(carta, eq(carta_plantilla.carta_id, carta.id))
      .where(eq(carta_plantilla.plantilla_id, dbMatch.plantilla2_id));

      const rounds = await db.select()
          .from(ronda)
          .where(eq(ronda.partida_id, dbMatch.id))
          .orderBy(asc(ronda.numero_ronda));
      
      return {
          matchId: dbMatch.id,
          user1Id: dbMatch.user1_id, 
          user2Id: dbMatch.user1_id,  
          players: {
              [dbMatch.user1_id]: {
                  socket: player1Socket,
                  plantilla: cartas1,
                  puntosIniciales: user1.puntosClasificacion,
                  score: dbMatch.puntuacion1
              },
              [dbMatch.user2_id]: {
                  socket: player2Socket,
                  plantilla: cartas2,
                  puntosIniciales: user2.puntosClasificacion,
                  score: dbMatch.puntuacion2
              }
          },
          turno: dbMatch.turno,
          currentRound: rounds.length + 1,
          roomId: `match_${dbMatch.id}`,
          status: 'active',
          currentRoundData: {
              stage: 'selection',
              starter: dbMatch.turno,
              carta_j1: null,
              habilidad_j1: null,
              carta_j2: null,
              habilidad_j2: null
          }
      };
  }

  async function getUsedCards(matchId) {
    const roundsJ1 = await db.select({
      carta_j1: carta
    })
    .from(ronda)
    .leftJoin(carta, eq(ronda.carta_j1, carta.id))
    .where(eq(ronda.partida_id, matchId));
  
    const roundsJ2 = await db.select({
      carta_j2: carta
    })
    .from(ronda)
    .leftJoin(carta, eq(ronda.carta_j2, carta.id))
    .where(eq(ronda.partida_id, matchId));
  
    return {
      user1: roundsJ1.map(r => r.carta_j1),
      user2: roundsJ2.map(r => r.carta_j2)
    };
  }

    const createMatch = async (player1, player2) => {
      const user1_id = String(player1.userId);
      const user2_id = String(player2.userId);

      console.log(`Match creado entre ${player1.userId} y ${player2.userId}.`);

      const [plantilla1, plantilla2] = await Promise.all([
        getPlantilla(user1_id),
        getPlantilla(user2_id)
      ]);

      console.log("Plantilla1: ", plantilla1.plantillaId, " Plantilla2: ", plantilla2.plantillaId);

      const [newMatch] = await db.insert(partida)
        .values({
          turno: user1_id,
          user1_id: user1_id,
          user2_id: user2_id,
          plantilla1_id: plantilla1.plantillaId,
          plantilla2_id: plantilla2.plantillaId,
          estado: 'activa'
        }).returning();
    
      const matchId = newMatch.id;
      const roomId = `match_${matchId}`;

      const matchState = {
        matchId,
        user1Id: user1_id, 
        user2Id: user2_id,
        players: {
          [user1_id]: {
            socket: player1.socket,
            plantilla: plantilla1.cartas,
            puntosIniciales: player1.puntos,
            score: 0
          },
          [user2_id]: {
            socket: player2.socket,
            plantilla: plantilla2.cartas,
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
      console.log("Datos de partida: ", match);
      Object.values(match.players).forEach(player => {
        if (player.socket) {
          player.socket.removeAllListeners('select_card');
        }
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
    

      Object.values(match.players).forEach(player => {
        player.socket.once('select_card', async ({ cartaId, skill }) => {
          const userId = String(player.socket.data.userID);
          console.log("Llego evento select_card de usuario ", userId);
          if (userId !== match.currentRoundData.starter) return;
     
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
      
      const user1Id = match.user1Id;
      const user2Id = match.user2Id;

      let db_carta_j1, db_habilidad_j1, db_carta_j2, db_habilidad_j2;

      if (match.currentRoundData.starter === user1Id) {
        db_carta_j1 = carta_j1.id;
        db_habilidad_j1 = habilidad_j1;
        db_carta_j2 = carta_j2.id;
        db_habilidad_j2 = habilidad_j2;
      } else {
        db_carta_j1 = carta_j2.id; 
        db_habilidad_j1 = habilidad_j2;
        db_carta_j2 = carta_j1.id; 
        db_habilidad_j2 = habilidad_j1;
      }

      await db.insert(ronda).values({
        partida_id: matchId,
        numero_ronda: match.currentRound,
        carta_j1: db_carta_j1,
        habilidad_j1: db_habilidad_j1,
        carta_j2: db_carta_j2,
        habilidad_j2: db_habilidad_j2,
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

      const puntuacion1 = match.players[user1Id].score;
      const puntuacion2 = match.players[user2Id].score;

      await db.update(partida)
        .set({ puntuacion1, puntuacion2 })
        .where(eq(partida.id, matchId));
  
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
          const newPuntosJ1 = match.players[player1Id].puntosIniciales + puntosChange[player1Id];
          const puntosFinalesJ1 = newPuntosJ1 < 0 ? 0 : newPuntosJ1;
        
          const newPuntosJ2 = match.players[player2Id].puntosIniciales + puntosChange[player2Id];
          const puntosFinalesJ2 = newPuntosJ2 < 0 ? 0 : newPuntosJ2;
        
          await tx.update(user)
            .set({ puntosClasificacion: puntosFinalesJ1 })
            .where(eq(user.id, Number(player1Id)));
        
          await tx.update(user)
            .set({ puntosClasificacion: puntosFinalesJ2 })
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

      activeMatchRequests.forEach((request, key) => {
        if (request.solicitanteId === socket.data.userID || 
            request.receptorId === socket.data.userID) {
          activeMatchRequests.delete(key);
          const otherUserId = request.solicitanteId === socket.data.userID 
            ? request.receptorId 
            : request.solicitanteId;
          const otherUserSocket = connectedUsers.get(otherUserId);
          if (otherUserSocket) {
            otherUserSocket.emit('match_request_cancelled', { 
              matchRequestId: key 
            });
          }
        }
      });
      
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