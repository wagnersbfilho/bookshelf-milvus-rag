const {DataType, MilvusClient} = require('@zilliz/milvus2-sdk-node');
const embedding = require('./embedding-openai');

const COLLECTION_NAME = process.env.MILVUS_COLLECTION || 'book_embeddings';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || '127.0.0.1:19530';
const VECTOR_FIELD = 'vector';

function createClient() {
  return new MilvusClient({
    address: MILVUS_ADDRESS
  });
}

async function collectionExists(client) {
  const collections = await client.showCollections();

  return collections.data.some(function(collection) {
    return collection.name === COLLECTION_NAME;
  });
}

async function ensureCollection(client) {
  if (await collectionExists(client)) {
    await client.loadCollectionSync({
      collection_name: COLLECTION_NAME
    });

    return;
  }

  await client.createCollection({
    collection_name: COLLECTION_NAME,
    fields: [
      {
        name: 'book_id',
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: false
      },
      {
        name: 'text',
        data_type: DataType.VarChar,
        max_length: 4000
      },
      {
        name: VECTOR_FIELD,
        data_type: DataType.FloatVector,
        dim: embedding.EMBEDDING_DIMENSION
      }
    ]
  });

  await client.createIndex({
    collection_name: COLLECTION_NAME,
    field_name: VECTOR_FIELD,
    index_type: 'AUTOINDEX',
    metric_type: 'COSINE'
  });

  await client.loadCollectionSync({
    collection_name: COLLECTION_NAME
  });
}

async function replaceBookEmbeddings(client, rows) {
  if (!rows.length) return;

  const ids = rows.map(function(row) {
    return row.book_id;
  });

  await client.delete({
    collection_name: COLLECTION_NAME,
    filter: 'book_id in [' + ids.join(',') + ']'
  });

  await client.insert({
    collection_name: COLLECTION_NAME,
    data: rows
  });

  await client.flushSync({
    collection_names: [COLLECTION_NAME]
  });

  await client.loadCollectionSync({
    collection_name: COLLECTION_NAME
  });
}

async function searchBooks(client, vector, limit) {
  return client.search({
    collection_name: COLLECTION_NAME,
    data: [vector],
    anns_field: VECTOR_FIELD,
    output_fields: ['book_id', 'text'],
    search_params: {
      metric_type: 'COSINE',
      topk: limit || 5,
      params: JSON.stringify({})
    }
  });
}

module.exports = {
  COLLECTION_NAME: COLLECTION_NAME,
  MILVUS_ADDRESS: MILVUS_ADDRESS,
  createClient: createClient,
  ensureCollection: ensureCollection,
  replaceBookEmbeddings: replaceBookEmbeddings,
  searchBooks: searchBooks
};
