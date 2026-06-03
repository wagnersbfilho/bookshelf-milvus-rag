const Knex = require('knex');
const Bookshelf = require('../bookshelf');
const config = require('../test/integration/helpers/config').mysql;

const knex = Knex({
  client: 'mysql',
  connection: config
});

const bookshelf = Bookshelf(knex);
const Book = bookshelf.Model.extend({
  tableName: 'codex_smoke_books'
});

Promise.resolve()
  .then(function() {
    return knex.schema.dropTableIfExists('codex_smoke_books');
  })
  .then(function() {
    return knex.schema.createTable('codex_smoke_books', function(table) {
      table.increments('id').primary();
      table.string('title');
    });
  })
  .then(function() {
    return Book.forge({title: 'Bookshelf local MySQL OK'}).save();
  })
  .then(function(saved) {
    return Book.forge({id: saved.id}).fetch();
  })
  .then(function(row) {
    console.log(JSON.stringify(row.toJSON()));
  })
  .then(function() {
    return knex.schema.dropTableIfExists('codex_smoke_books');
  })
  .then(function() {
    return knex.destroy();
  })
  .catch(function(error) {
    console.error(error.stack || error.message);
    return knex.destroy().then(function() {
      process.exit(1);
    });
  });
