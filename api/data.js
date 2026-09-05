import { createClient, createPool } from '@vercel/postgres';

const allowedCollections = new Set([
  'config',
  'noticias',
  'eventos',
  'diretoria',
  'estatuto',
  'historia',
  'slider',
]);

const privateCollections = new Set(['inscricoes', 'socios']);

function hasDatabase() {
  return Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
}

function databaseUrl() {
  return process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || '';
}

function collectionFromRequest(request) {
  return String(request.query?.collection || '').trim().toLowerCase();
}

export default async function handler(request, response) {
  const collection = collectionFromRequest(request);

  if (privateCollections.has(collection)) {
    return response.status(403).json({
      error: 'Acesso restrito. Dados pessoais não são públicos.',
    });
  }

  if (!allowedCollections.has(collection)) {
    return response.status(400).json({ error: 'Coleção inválida.' });
  }

  if (!hasDatabase()) {
    return response.status(503).json({
      error: 'Banco SQL não configurado.',
      setup: 'Configure POSTGRES_URL na Vercel.',
    });
  }

  if (!/^(postgres|postgresql):\/\//.test(databaseUrl())) {
    return response.status(503).json({
      error: 'POSTGRES_URL inválida.',
      setup: 'Cadastre na Vercel uma URL iniciada por postgres:// ou postgresql://.',
    });
  }

  const connectionString = databaseUrl();
  const pooled = connectionString.includes('-pooler.');
  const client = pooled
    ? createPool({ connectionString })
    : createClient({ connectionString });

  try {
    if (!pooled) await client.connect();
    await client.sql`CREATE TABLE IF NOT EXISTS assga_data (
      collection TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    if (request.method === 'GET') {
      const result = await client.sql`
        SELECT payload FROM assga_data WHERE collection = ${collection}
      `;
      const payload = result.rows[0]?.payload ?? [];
      if (collection === 'config' && payload && !Array.isArray(payload)) {
        const { senha, ...publicConfig } = payload;
        return response.status(200).json(publicConfig);
      }
      return response.status(200).json(payload);
    }

    if (request.method === 'POST') {
      const payload = request.body;
      await client.sql`
        INSERT INTO assga_data (collection, payload, updated_at)
        VALUES (${collection}, ${JSON.stringify(payload)}::jsonb, NOW())
        ON CONFLICT (collection)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      `;
      return response.status(200).json({ status: 'ok', collection });
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    return response.status(500).json({
      error: 'Erro ao acessar o banco SQL.',
      message: error.message,
    });
  } finally {
    await client.end().catch(() => {});
  }
}