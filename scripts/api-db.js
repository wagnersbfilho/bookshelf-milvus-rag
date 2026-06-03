const Knex = require('knex');
const Bookshelf = require('../bookshelf');

const database = process.env.MYSQL_DATABASE || 'bookshelf';

const connection = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  charset: process.env.MYSQL_CHARSET || 'utf8'
};

function createKnex(options) {
  return Knex({
    client: 'mysql',
    connection: Object.assign({}, connection, options || {})
  });
}

function createBookshelf() {
  const knex = createKnex({database});
  const bookshelf = Bookshelf(knex);
  const Book = bookshelf.Model.extend({
    tableName: 'books'
  });

  return {
    Book: Book,
    bookshelf: bookshelf,
    database: database,
    knex: knex
  };
}

module.exports = {
  connection: connection,
  createBookshelf: createBookshelf,
  createKnex: createKnex,
  database: database
};
