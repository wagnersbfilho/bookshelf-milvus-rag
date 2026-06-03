module.exports = {
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || 'bookshelf_test',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    charset: process.env.MYSQL_CHARSET || 'utf8'
  },

  postgres: {
    database: 'bookshelf_test',
    user: 'postgres'
  },

  sqlite3: {
    filename: ':memory:'
  }
};
