const EMBEDDING_PROVIDER = 'openai';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 1536);

function getApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate OpenAI embeddings.');
  }

  return process.env.OPENAI_API_KEY;
}

function assertEmbedding(vector) {
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      'Embedding dimension mismatch. Expected ' + EMBEDDING_DIMENSION + ', received ' + (vector && vector.length)
    );
  }

  return vector;
}

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + getApiKey(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload.error && payload.error.message ? payload.error.message : 'OpenAI embedding request failed.'
    );
  }

  return assertEmbedding(payload.data[0].embedding);
}

module.exports = {
  EMBEDDING_DIMENSION: EMBEDDING_DIMENSION,
  EMBEDDING_MODEL: EMBEDDING_MODEL,
  EMBEDDING_PROVIDER: EMBEDDING_PROVIDER,
  generateEmbedding: generateEmbedding
};
