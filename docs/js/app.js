
    const schema = {
  "asyncapi": "3.0.0",
  "info": {
    "title": "Adrenalux WebSocket API",
    "version": "1.0.0",
    "description": "API para manejar eventos de WebSocket en Adrenalux.",
    "contact": {
      "name": "Equipo de Adrenalux",
      "email": "soporte@adrenalux.com",
      "url": "https://adrenalux.com"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "servers": {
    "production": {
      "host": "adrenalux.duckdns.org",
      "protocol": "wss",
      "pathname": "/socket.io",
      "description": "Servidor WebSocket de producción."
    },
    "local": {
      "host": "localhost",
      "protocol": "ws",
      "pathname": "/socket.io",
      "description": "Servidor WebSocket local."
    }
  },
  "channels": {
    "/request_exchange": {
      "address": "/request_exchange",
      "description": "Canal para solicitud de intercambio de cartas",
      "messages": {
        "RequestExchange": {
          "name": "RequestExchange",
          "title": "Solicitud de intercambio",
          "summary": "Mensaje para solicitar un intercambio de cartas",
          "payload": {
            "type": "object",
            "properties": {
              "receptorId": {
                "type": "string",
                "description": "ID del usuario receptor",
                "x-parser-schema-id": "<anonymous-schema-2>"
              },
              "solicitanteUsername": {
                "type": "string",
                "description": "Nombre de usuario del solicitante",
                "x-parser-schema-id": "<anonymous-schema-3>"
              }
            },
            "required": [
              "receptorId",
              "solicitanteUsername"
            ],
            "x-parser-schema-id": "<anonymous-schema-1>"
          },
          "x-parser-unique-object-id": "RequestExchange"
        },
        "RequestExchangeResponse": {
          "name": "RequestExchangeResponse",
          "title": "Respuesta de solicitud de intercambio",
          "summary": "Mensaje de respuesta a solicitud de intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-5>"
              },
              "solicitanteId": {
                "type": "string",
                "description": "ID del solicitante",
                "x-parser-schema-id": "<anonymous-schema-6>"
              },
              "solicitanteUsername": {
                "type": "string",
                "description": "Nombre de usuario del solicitante",
                "x-parser-schema-id": "<anonymous-schema-7>"
              },
              "timestamp": {
                "type": "string",
                "format": "date-time",
                "description": "Marca de tiempo del evento",
                "x-parser-schema-id": "<anonymous-schema-8>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-4>"
          },
          "x-parser-unique-object-id": "RequestExchangeResponse"
        }
      },
      "x-parser-unique-object-id": "/request_exchange"
    },
    "/accept_exchange": {
      "address": "/accept_exchange",
      "description": "Canal para aceptación de intercambio",
      "messages": {
        "AcceptExchange": {
          "name": "AcceptExchange",
          "title": "Aceptación de intercambio",
          "summary": "Mensaje para aceptar un intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-10>"
              }
            },
            "required": [
              "exchangeId"
            ],
            "x-parser-schema-id": "<anonymous-schema-9>"
          },
          "x-parser-unique-object-id": "AcceptExchange"
        },
        "AcceptExchangeResponse": {
          "name": "AcceptExchangeResponse",
          "title": "Respuesta de aceptación de intercambio",
          "summary": "Mensaje de respuesta a aceptación de intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-12>"
              },
              "roomId": {
                "type": "string",
                "description": "ID de la sala de intercambio",
                "x-parser-schema-id": "<anonymous-schema-13>"
              },
              "solicitanteUsername": {
                "type": "string",
                "description": "Nombre de usuario del solicitante",
                "x-parser-schema-id": "<anonymous-schema-14>"
              },
              "receptorUsername": {
                "type": "string",
                "description": "Nombre de usuario del receptor",
                "x-parser-schema-id": "<anonymous-schema-15>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-11>"
          },
          "x-parser-unique-object-id": "AcceptExchangeResponse"
        }
      },
      "x-parser-unique-object-id": "/accept_exchange"
    },
    "/select_cards": {
      "address": "/select_cards",
      "description": "Canal para selección de cartas",
      "messages": {
        "SelectCards": {
          "name": "SelectCards",
          "title": "Selección de cartas",
          "summary": "Mensaje para seleccionar cartas en un intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-17>"
              },
              "cardId": {
                "type": "string",
                "description": "ID de la carta seleccionada",
                "x-parser-schema-id": "<anonymous-schema-18>"
              }
            },
            "required": [
              "exchangeId",
              "cardId"
            ],
            "x-parser-schema-id": "<anonymous-schema-16>"
          },
          "x-parser-unique-object-id": "SelectCards"
        },
        "SelectCardsResponse": {
          "name": "SelectCardsResponse",
          "title": "Respuesta de selección de cartas",
          "summary": "Mensaje de respuesta a selección de cartas",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-20>"
              },
              "userId": {
                "type": "string",
                "description": "ID del usuario que seleccionó la carta",
                "x-parser-schema-id": "<anonymous-schema-21>"
              },
              "card": {
                "type": "object",
                "description": "Detalles de la carta seleccionada",
                "x-parser-schema-id": "<anonymous-schema-22>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-19>"
          },
          "x-parser-unique-object-id": "SelectCardsResponse"
        }
      },
      "x-parser-unique-object-id": "/select_cards"
    },
    "/confirm_exchange": {
      "address": "/confirm_exchange",
      "description": "Canal para confirmación de intercambio",
      "messages": {
        "ConfirmExchange": {
          "name": "ConfirmExchange",
          "title": "Confirmación de intercambio",
          "summary": "Mensaje para confirmar un intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-24>"
              }
            },
            "required": [
              "exchangeId"
            ],
            "x-parser-schema-id": "<anonymous-schema-23>"
          },
          "x-parser-unique-object-id": "ConfirmExchange"
        },
        "ConfirmExchangeResponse": {
          "name": "ConfirmExchangeResponse",
          "title": "Respuesta de confirmación de intercambio",
          "summary": "Mensaje de respuesta a confirmación de intercambio",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-26>"
              },
              "confirmations": {
                "type": "object",
                "additionalProperties": {
                  "type": "boolean",
                  "x-parser-schema-id": "<anonymous-schema-28>"
                },
                "description": "Estado de las confirmaciones de los participantes",
                "x-parser-schema-id": "<anonymous-schema-27>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-25>"
          },
          "x-parser-unique-object-id": "ConfirmExchangeResponse"
        }
      },
      "x-parser-unique-object-id": "/confirm_exchange"
    },
    "/exchange_completed": {
      "address": "/exchange_completed",
      "description": "Canal para notificación de intercambio completado",
      "messages": {
        "ExchangeCompleted": {
          "name": "ExchangeCompleted",
          "title": "Intercambio completado",
          "summary": "Mensaje de notificación de intercambio completado",
          "payload": {
            "type": "object",
            "properties": {
              "exchangeId": {
                "type": "string",
                "description": "ID único del intercambio",
                "x-parser-schema-id": "<anonymous-schema-30>"
              },
              "message": {
                "type": "string",
                "description": "Mensaje de confirmación",
                "x-parser-schema-id": "<anonymous-schema-31>"
              },
              "user1Card": {
                "type": "string",
                "description": "ID de la carta del usuario 1",
                "x-parser-schema-id": "<anonymous-schema-32>"
              },
              "user2Card": {
                "type": "string",
                "description": "ID de la carta del usuario 2",
                "x-parser-schema-id": "<anonymous-schema-33>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-29>"
          },
          "x-parser-unique-object-id": "ExchangeCompleted"
        }
      },
      "x-parser-unique-object-id": "/exchange_completed"
    }
  },
  "components": {
    "messages": {
      "RequestExchange": "$ref:$.channels./request_exchange.messages.RequestExchange",
      "RequestExchangeResponse": "$ref:$.channels./request_exchange.messages.RequestExchangeResponse",
      "AcceptExchange": "$ref:$.channels./accept_exchange.messages.AcceptExchange",
      "AcceptExchangeResponse": "$ref:$.channels./accept_exchange.messages.AcceptExchangeResponse",
      "SelectCards": "$ref:$.channels./select_cards.messages.SelectCards",
      "SelectCardsResponse": "$ref:$.channels./select_cards.messages.SelectCardsResponse",
      "ConfirmExchange": "$ref:$.channels./confirm_exchange.messages.ConfirmExchange",
      "ConfirmExchangeResponse": "$ref:$.channels./confirm_exchange.messages.ConfirmExchangeResponse",
      "ExchangeCompleted": "$ref:$.channels./exchange_completed.messages.ExchangeCompleted"
    }
  },
  "x-parser-spec-parsed": true,
  "x-parser-api-version": 3,
  "x-parser-spec-stringified": true
};
    const config = {"show":{"sidebar":true},"sidebar":{"showOperations":"byDefault"}};
    const appRoot = document.getElementById('root');
    AsyncApiStandalone.render(
        { schema, config, }, appRoot
    );
  