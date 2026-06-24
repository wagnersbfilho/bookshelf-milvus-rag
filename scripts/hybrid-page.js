const http = require('http');
const service = require('./hybrid-service');

const port = Number(process.env.PORT || 3001);

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderResults(results) {
  if (!results.length) {
    return '<p class="empty">Nenhum resultado encontrado.</p>';
  }

  return results
    .map(function(book) {
      const score = book.vector_score != null ? book.vector_score : book.vector_distance;

      return (
        '<article>' +
        '<h2>' +
        escapeHtml(book.title) +
        '</h2>' +
        '<p><strong>Autor:</strong> ' +
        escapeHtml(book.author) +
        '</p>' +
        '<p><strong>Status:</strong> ' +
        escapeHtml(book.status) +
        '</p>' +
        '<p><strong>Similaridade:</strong> ' +
        escapeHtml(score) +
        '</p>' +
        '<p class="source">' +
        escapeHtml(book.vector_text) +
        '</p>' +
        '</article>'
      );
    })
    .join('');
}

function renderPage(query, results, error) {
  return (
    '<!doctype html>' +
    '<html lang="pt-BR">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Busca Semantica Bookshelf + Milvus</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;margin:40px;background:#f7f8fa;color:#20242a}' +
    'main{max-width:920px;margin:0 auto}' +
    'h1{font-size:28px;margin:0 0 8px}' +
    'p{color:#5c6470}' +
    'form{display:flex;gap:8px;margin:24px 0}' +
    'input{flex:1;padding:12px 14px;border:1px solid #cfd6df;font-size:16px}' +
    'button{padding:12px 18px;border:0;background:#1f6feb;color:white;font-weight:bold;cursor:pointer}' +
    'article{background:white;border:1px solid #d9dee7;margin:12px 0;padding:16px}' +
    'h2{font-size:20px;margin:0 0 8px}' +
    '.source{font-size:14px;background:#f0f3f6;padding:10px;color:#424a57}' +
    '.error{background:#fff2f2;border:1px solid #f0b5b5;padding:12px;color:#8a1f1f}' +
    '.empty{background:#fff;border:1px solid #d9dee7;padding:16px}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<main>' +
    '<h1>Busca semantica hibrida</h1>' +
    '<p>MySQL guarda os livros. OpenAI gera embeddings semanticos. Milvus busca por proximidade vetorial.</p>' +
    '<p>Similaridade minima: ' +
    escapeHtml(service.MIN_SIMILARITY) +
    '</p>' +
    '<form method="GET" action="/">' +
    '<input name="q" value="' +
    escapeHtml(query) +
    '" placeholder="Ex: livros sobre arquitetura de software">' +
    '<button type="submit">Buscar</button>' +
    '</form>' +
    (error ? '<div class="error">' + escapeHtml(error) + '</div>' : '') +
    (query && !error ? renderResults(results) : '') +
    '</main>' +
    '</body>' +
    '</html>'
  );
}

const server = http.createServer(function(request, response) {
  const url = new URL(request.url, 'http://localhost:' + port);

  if (url.pathname !== '/') {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not found');
    return;
  }

  const query = url.searchParams.get('q') || '';

  Promise.resolve()
    .then(function() {
      if (!query) return [];
      return service.searchBooks(query, 5);
    })
    .then(function(results) {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      response.end(renderPage(query, results, null));
    })
    .catch(function(error) {
      response.writeHead(500, {'Content-Type': 'text/html; charset=utf-8'});
      response.end(renderPage(query, [], error.message));
    });
});

server.listen(port, function() {
  console.log('Hybrid Bookshelf + Milvus demo running at http://localhost:' + port);
});

process.on('unhandledRejection', function(error) {
  console.error(error.stack || error.message);
});
