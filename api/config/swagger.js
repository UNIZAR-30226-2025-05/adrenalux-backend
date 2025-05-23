import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: { 
      title: 'Adrenalux API',
      version: '1.0.0',
      description: 'API documentation for Adrenalux project',
     },
    servers: [{ 
      url: "https://adrenalux.duckdns.org/api-docs",
      description: 'Production Server'
    }]
  },
  apis: ['./api/routes/*.js']
};


const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs;