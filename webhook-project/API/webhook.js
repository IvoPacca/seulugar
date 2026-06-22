/**
 * API Webhook Receiver - Vercel Serverless Function
 * salva em: /api/webhook.js
 * 
 * Este arquivo recebe as requisições de webhook enviadas por sistemas externos.
 */

const fs = require('fs');
const path = require('path');

// Caminho do arquivo temporário utilizado para salvar os logs de eventos
// A pasta '/tmp' é a única pasta com permissão de gravação no ambiente serverless da Vercel.
const LOG_FILE_PATH = path.join('/tmp', 'webhook_logs.json');

// Função auxiliar para carregar os logs atuais salvos no disco ou em memória
function getLogs() {
  try {
    if (fs.existsSync(LOG_FILE_PATH)) {
      const data = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler arquivo de logs:', error);
  }
  return [];
}

// Função auxiliar para salvar novos logs de forma rotativa (limitado a 100 eventos)
function saveLog(newEvent) {
  try {
    const logs = getLogs();
    
    // Adiciona o novo evento ao início da lista (mais recente primeiro)
    logs.unshift(newEvent);
    
    // Limita a quantidade total para não saturar o armazenamento temporário
    if (logs.length > 100) {
      logs.length = 100;
    }
    
    // Escreve de volta para a pasta temporária
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar logs no arquivo temporário:', error);
  }
}

/**
 * Handler principal da Serverless Function do Vercel
 */
module.exports = async function handler(req, res) {
  // Configuração de CORS simples para permitir testes locais e externos
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Webhook-Secret'
  );

  // Manipulação de requisições de pré-voo (Preflight - OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite apenas requisições do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido', 
      message: 'Este endpoint aceita exclusivamente requisições HTTP POST para recebimento de webhooks.' 
    });
  }

  // 1. Obtenção e Validação do Token Secreto no Header
  // O token padrão é definido abaixo, mas no painel da Vercel você deve criar 
  // uma variável de ambiente chamada WEBHOOK_SECRET para segurança máxima.
  const API_SECRET_TOKEN = process.env.WEBHOOK_SECRET || 'meu_token_secreto_super_seguro';
  const receivedSecretToken = req.headers['x-webhook-secret'];

  if (!receivedSecretToken || receivedSecretToken !== API_SECRET_TOKEN) {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Token de segurança ausente ou inválido no cabeçalho X-Webhook-Secret.'
    });
  }

  try {
    // 2. Extração do payload recebido
    const payload = req.body;
    
    // Cria um identificador único simples para o log
    const eventId = 'ev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    
    // 3. Estruturação do log do evento
    const newLogEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'x-webhook-secret': '***' // Mascarado por segurança
      },
      body: payload
    };

    // 4. Salva o registro nos logs temporários
    saveLog(newLogEvent);

    // Registra no console padrão do Vercel logs para monitoria em tempo real
    console.log(`[Webhook Recebido] ID: ${eventId} em ${newLogEvent.timestamp}`);

    // 5. Retorna HTTP 200 imediatamente conforme boa prática de Webhooks
    return res.status(200).json({
      status: 'success',
      message: 'Webhook recebido, validado e registrado com sucesso!',
      eventId: eventId,
      receivedAt: newLogEvent.timestamp
    });

  } catch (err) {
    console.error('Falha ao processar o webhook recebido:', err);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Erro interno ao tentar salvar e registrar os dados do webhook.'
    });
  }
};
