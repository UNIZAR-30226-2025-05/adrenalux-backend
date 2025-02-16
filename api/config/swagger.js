import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Adrenalux API',
      version: '1.0.0',
      description: 'API documentation for Adrenalux project',
    },
  },

  apis: ['./api/routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs; 
