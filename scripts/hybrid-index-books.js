const service = require('./hybrid-service');

service
  .indexBooks()
  .then(function(count) {
    console.log('Indexed books in Milvus: ' + count);
  })
  .catch(function(error) {
    console.error(error.stack || error.message);
    process.exit(1);
  });

process.on('unhandledRejection', function(error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
