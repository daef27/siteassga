import { get } from '@vercel/global-config';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido' });
  }

  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) {
    return response.status(503).json({
      error: 'Global Config não configurado.',
      setup: 'Configure GLOBAL_CONFIG na Vercel.',
    });
  }

  try {
    const greeting = await get('greeting');
    return response.status(200).json(greeting ?? { greeting: 'Olá, ASSGA!' });
  } catch (error) {
    return response.status(500).json({
      error: 'Não foi possível ler o Global Config.',
      message: error.message,
    });
  }
}
