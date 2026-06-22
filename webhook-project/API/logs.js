/**
 * API Logs Retriever - Vercel Serverless Function
 * salva em: /api/logs.js
 * 
 * Este arquivo retorna a lista dos últimos eventos recebidos pelo webhook em formato JSON.
 */

const fs = require('fs');
const path = require('path');

// Caminho do mesmo arquivo temporário compartilhado na pasta '/tmp'
const LOG_FILE_PATH = path.join('/tmp', 'webhook_logs.json');

module.exports = async function handler(req, res) {
  // Configuração de cabeçalhos de CORS para permitir requisições seguras no Dashboard
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manipulação de requisições OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite ação de LIMPAR os logs através do método DELETE ou query param "?clear=true"
  if (req.method === 'DELETE' || (req.method === 'GET' && req.query.clear === 'true')) {
    try {
      if (fs.existsSync(LOG_FILE_PATH)) {
        fs.unlinkSync(LOG_FILE_PATH);
      }
      return res.status(200).json({
        status: 'success',
        message: 'A lista de logs salvos foi limpa com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo de logs:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Não foi possível limpar a lista de logs temporários.'
      });
    }
  }

  // Permite apenas requisições GET para visualização padrão
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Método não permitido',
      message: 'Este endpoint aceita apenas requisições HTTP GET ou DELETE.'
    });
  }

  try {
    let logs = [];
    
    // Verifica se o arquivo de logs foi criado e lê os registros
    if (fs.existsSync(LOG_FILE_PATH)) {
      const fileData = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
      logs = JSON.parse(fileData);
    }

    // Retorna a lista total de logs cadastrados (limitado a 100)
    return res.status(200).json({
      status: 'success',
      totalCount: logs.length,
      logs: logs
    });

  } catch (err) {
    console.error('Erro ao carregar lista de logs:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno ao ler os eventos gravados.'
    });
  }
};
