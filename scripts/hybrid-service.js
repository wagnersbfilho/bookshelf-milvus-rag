const db = require('./api-db');
const embedding = require('./embedding-openai');
const milvus = require('./milvus-db');

const MIN_SIMILARITY = Number(process.env.MIN_SIMILARITY || 0.25);

function bookToEmbeddingText(book) {
  return [
    'Titulo: ' + book.title,
    'Autor: ' + book.author,
    'Tema: ' + (book.category || ''),
    'Descricao: ' + (book.description || ''),
    'Status: ' + book.status
  ].join('. ');
}

function normalizeMilvusHits(result) {
  const hits = result.results || result.data || [];

  return hits.map(function(hit) {
    return {
      book_id: Number(hit.book_id || hit.id),
      score: hit.score,
      distance: hit.distance,
      text: hit.text
    };
  });
}

function orderBooksByHits(books, hits) {
  const byId = books.reduce(function(index, book) {
    index[book.id] = book;
    return index;
  }, {});

  return hits
    .filter(function(hit) {
      const score = hit.score != null ? Number(hit.score) : Number(hit.distance);

      return score >= MIN_SIMILARITY;
    })
    .map(function(hit) {
      const book = byId[hit.book_id];

      if (!book) return null;

      return Object.assign({}, book, {
        vector_score: hit.score,
        vector_distance: hit.distance,
        vector_text: hit.text
      });
    })
    .filter(Boolean);
}

async function setupMilvusCollection() {
  const client = milvus.createClient();

  await milvus.ensureCollection(client);

  return {
    collection: milvus.COLLECTION_NAME,
    dimension: embedding.EMBEDDING_DIMENSION,
    metric: 'COSINE',
    model: embedding.EMBEDDING_MODEL,
    provider: embedding.EMBEDDING_PROVIDER
  };
}

async function indexBooks() {
  const api = db.createBookshelf();
  const client = milvus.createClient();

  try {
    await milvus.ensureCollection(client);

    const collection = await api.Book.fetchAll({orderBy: 'id'});
    const books = collection.toJSON();
    const rows = [];

    for (const book of books) {
      const text = bookToEmbeddingText(book);
      const vector = await embedding.generateEmbedding(text);

      rows.push({
        book_id: book.id,
        text: text,
        vector: vector
      });
    }

    await milvus.replaceBookEmbeddings(client, rows);

    return rows.length;
  } finally {
    await api.knex.destroy();
  }
}

async function searchBooks(query, limit) {
  const api = db.createBookshelf();
  const client = milvus.createClient();

  try {
    await milvus.ensureCollection(client);

    const vector = await embedding.generateEmbedding(query);
    const result = await milvus.searchBooks(client, vector, limit);
    const hits = normalizeMilvusHits(result);
    const ids = hits.map(function(hit) {
      return hit.book_id;
    });

    if (!ids.length) return [];

    const collection = await api.Book.query(function(queryBuilder) {
      queryBuilder.whereIn('id', ids);
    }).fetchAll();

    return orderBooksByHits(collection.toJSON(), hits);
  } finally {
    await api.knex.destroy();
  }
}

module.exports = {
  bookToEmbeddingText: bookToEmbeddingText,
  indexBooks: indexBooks,
  MIN_SIMILARITY: MIN_SIMILARITY,
  searchBooks: searchBooks,
  setupMilvusCollection: setupMilvusCollection
};
