import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  swaggerDefinition: {
    info: {
      title: "API",
      version: "1.0.0",
      description: "Documentación de la API"
    },
    schemes: ["http"], 
    servers: [
      {
        url: "http://54.37.50.18:3000"
      }
    ]
  },
  apis: ["./routes/*.js"] 
};

const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs; 
