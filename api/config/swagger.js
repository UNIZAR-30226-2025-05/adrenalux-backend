import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "API",
      version: "1.0.0",
      description: "Documentación de la API"
    },
    schemes: ["http"], 
    servers: [
      {
        url: "http://localhost:3000"  
      }
    ]
  },
  apis: ["./routes/*.js"] 
};

const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs; 
