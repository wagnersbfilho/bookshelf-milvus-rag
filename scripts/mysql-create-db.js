const Knex = require('knex');
const config = require('../test/integration/helpers/config').mysql;

const database = config.database;
const connection = Object.assign({}, config);
delete connection.database;

const knex = Knex({
  client: 'mysql',
  connection
});

knex
  .raw('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8 COLLATE utf8_general_ci', [database])
  .then(function() {
    console.log('MySQL database ready: ' + database);
  })
  .then(function() {
    return knex.destroy();
  })
  .catch(function(error) {
    console.error(error.message);
    return knex.destroy().then(function() {
      process.exit(1);
    });
  });
