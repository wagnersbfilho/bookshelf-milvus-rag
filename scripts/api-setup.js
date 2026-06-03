const db = require('./api-db');

const seedBooks = [
  {
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    status: 'available'
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    status: 'checked_out'
  },
  {
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    status: 'available'
  }
];

function createDatabase() {
  const knex = db.createKnex();

  return knex
    .raw('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8 COLLATE utf8_general_ci', [db.database])
    .then(function() {
      return knex.destroy();
    });
}

function createTables(knex) {
  return knex.schema.hasTable('books').then(function(exists) {
    if (exists) return;

    return knex.schema.createTable('books', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('author').notNullable();
      table
        .string('status')
        .notNullable()
        .defaultTo('available');
      table
        .timestamp('created_at')
        .notNullable()
        .defaultTo(knex.fn.now());
    });
  });
}

function seedTable(Book) {
  return Book.count().then(function(count) {
    if (Number(count) > 0) return;

    return Promise.all(
      seedBooks.map(function(book) {
        return Book.forge(book).save();
      })
    );
  });
}

createDatabase()
  .then(function() {
    const api = db.createBookshelf();

    return createTables(api.knex)
      .then(function() {
        return seedTable(api.Book);
      })
      .then(function() {
        console.log('Database ready: ' + api.database);
        console.log('Table ready: books');
        return api.knex.destroy();
      });
  })
  .catch(function(error) {
    console.error(error.stack || error.message);
    process.exit(1);
  });
