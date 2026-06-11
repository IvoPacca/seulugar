/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formata um número para a moeda oficial de Angola (Kwanza - Kz)
 * Exemplo: 1150000 -> "1.150.000 Kz"
 */
export function formatKwanza(value: number): string {
  if (value === undefined || value === null) return '0 Kz';
  return new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + ' Kz';
}

/**
 * Filtra categorias disponíveis no Seu Lugar
 */
export const STORE_CATEGORIES = [
  'Todos',
  'Eletrónicos',
  'Livros',
  'Moda & Calçado',
  'Serviços',
  'Outros'
];

/**
 * Lista de províncias de Angola para opções de envio
 */
export const ANGOLAN_PROVINCES = [
  'Luanda'
];

/**
 * IBAN e Referências Oficiais para pagamento da e-commerce
 */
export const PAYMENT_CHANNELS = {
  bankName: 'Banco de Fomento Angola (BFA)',
  accountOwner: 'Seu Lugar E-commerce Lda.',
  iban: 'AO06 0006 0000 9384 1234 1512 8',
  expressPhone: '937 424 234 (WhatsApp / ATM / Multicaixa)',
};
