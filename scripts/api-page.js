const http = require('http');
const db = require('./api-db');

const api = db.createBookshelf();
const port = Number(process.env.PORT || 3000);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(books) {
  const rows = books
    .map(function(book) {
      return (
        '<tr>' +
        '<td>' +
        escapeHtml(book.id) +
        '</td>' +
        '<td>' +
        escapeHtml(book.title) +
        '</td>' +
        '<td>' +
        escapeHtml(book.author) +
        '</td>' +
        '<td>' +
        escapeHtml(book.status) +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  return (
    '<!doctype html>' +
    '<html lang="pt-BR">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bookshelf API Demo</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;margin:40px;background:#f7f8fa;color:#20242a}' +
    'main{max-width:920px;margin:0 auto}' +
    'h1{font-size:28px;margin:0 0 6px}' +
    'p{margin:0 0 24px;color:#5c6470}' +
    'table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d9dee7}' +
    'th,td{text-align:left;padding:12px 14px;border-bottom:1px solid #e8ebf0}' +
    'th{background:#eef2f6;font-size:13px;text-transform:uppercase;color:#424a57}' +
    'tr:last-child td{border-bottom:0}' +
    '.meta{font-size:14px}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<main>' +
    '<h1>Consulta de livros</h1>' +
    '<p class="meta">Database: ' +
    escapeHtml(api.database) +
    ' | Tabela: books | ORM: Bookshelf</p>' +
    '<table>' +
    '<thead><tr><th>ID</th><th>Titulo</th><th>Autor</th><th>Status</th></tr></thead>' +
    '<tbody>' +
    rows +
    '</tbody>' +
    '</table>' +
    '</main>' +
    '</body>' +
    '</html>'
  );
}

function sendError(response, error) {
  response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
  response.end(error.stack || error.message);
}

const server = http.createServer(function(request, response) {
  if (request.url !== '/') {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not found');
    return;
  }

  api.Book.fetchAll({orderBy: 'id'})
    .then(function(collection) {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      response.end(renderPage(collection.toJSON()));
    })
    .catch(function(error) {
      sendError(response, error);
    });
});

server.listen(port, function() {
  console.log('Bookshelf API demo running at http://localhost:' + port);
});

process.on('SIGINT', function() {
  server.close(function() {
    api.knex.destroy().then(function() {
      process.exit(0);
    });
  });
});
