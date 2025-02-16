import { db } from '../config/db.js';


// cuando se termine una partida siempre se debe actualizar el nivel de experiencia del usuario
// se debe actualizar la cantidad de partidas jugadas por el usuario
// se debe actualizar la cantidad de partidas ganadas por el usuario
// se debe actualizar los puntos del usuario 
// si es partida de torneo dar premios 

export async function matchmaking(req, res, next) {
  try {
    const userId = req.user.id;
    
    return sendResponse(req, res, { message: 'Partida encontrada exitosamente' });
  } catch (err) {
    next(err);
  }
}

export async function desafiarAmigo(req, res, next) {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    
    return sendResponse(req, res, { message: 'Desafío enviado exitosamente' });
  } catch (err) {
    next(err);
  }
}

export async function aceptarDesafio(req, res, next) {
  try {
    const userId = req.user.id;
    const { desafioId } = req.body;
    // Validar y aceptar desafío

    return sendResponse(req, res, { message: 'Desafío aceptado exitosamente' });
  } catch (err) {
    next(err);
  }
}

export async function realizarJugada(req, res, next) {
  try {
    const userId = req.user.id;
    const { partidaId, cartaId, estadistica } = req.body;
    // Validar y registrar la jugada
    
    return sendResponse(req, res, { message: 'Jugada realizada exitosamente' });
  } catch (err) {
    next(err);
  }
}

export async function abandonarPartida(req, res, next) {
  try {
    const userId = req.user.id;
    const { partidaId } = req.body;
    // Validar y abandonar la partida
    //

    return sendResponse(req, res, { message: 'Partida abandonada exitosamente' });
  } catch (err) {
    next(err);
  }
}
