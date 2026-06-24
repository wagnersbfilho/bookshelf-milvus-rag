const service = require('./hybrid-service');

service
  .setupMilvusCollection()
  .then(function(result) {
    console.log('Milvus collection ready: ' + result.collection);
    console.log('Embedding provider: ' + result.provider);
    console.log('Embedding model: ' + result.model);
    console.log('Vector dimension: ' + result.dimension);
    console.log('Metric: ' + result.metric);
  })
  .catch(function(error) {
    console.error(error.stack || error.message);
    process.exit(1);
  });

process.on('unhandledRejection', function(error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
