/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Clock, CheckCircle2, ShieldAlert, Ban } from 'lucide-react';
import { Order, OrderItem, Product } from '../types';
import { formatKwanza } from '../utils';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products?: Product[];
}

export default function MyOrdersModal({ isOpen, onClose, orders, products = [] }: MyOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="orders-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          id="orders-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-6 border border-gray-100"
        >
          {/* Accent border */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-orange-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-blue-600" /> Os Meus Pedidos
            </h3>

            {orders.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                <p className="text-sm text-gray-400 font-medium">Ainda não realizou nenhuma compra no Seu Lugar.</p>
                <p className="text-xs text-gray-400 mt-1">Selecione produtos de excelência e confirme a transferência para ver a evolução aqui.</p>
              </div>
            ) : (
              <div className="space-y-5 max-h-[440px] overflow-y-auto pr-2">
                {orders.map((o) => {
                  const isPaid = o.status === 'approved' || o.status === 'delivered';
                  
                  return (
                    <div key={o.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                      {/* Order main reference */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                        <div>
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{o.id}</span>
                          <span className="text-gray-400 ml-2">Encomendado em {new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                          {o.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          {o.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                          {o.status === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                          {o.status === 'cancelled' && <Ban className="w-3.5 h-3.5 text-red-500" />}
                          
                          <span className={
                            o.status === 'pending' ? 'text-amber-600' :
                            o.status === 'approved' ? 'text-sky-600' :
                            o.status === 'delivered' ? 'text-green-600' : 'text-red-500'
                          }>
                            {o.status === 'pending' ? 'Confirmação Pendente' :
                             o.status === 'approved' ? 'Pagamento Aprovado' :
                             o.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                          </span>
                        </div>
                      </div>

                      {/* Items and files list */}
                      <div className="mt-3 space-y-3">
                        {o.items.map((item, idx) => {
                          const isDigital = item.type === 'digital';
                          const prodFromCatalog = products.find(p => p.id === item.productId);
                          const isLocalPlaceholder = item.digital_link === '[data_link_local]';
                          const downloadUrl = (isLocalPlaceholder || !item.digital_link)
                            ? (prodFromCatalog?.digital_link || '#')
                            : item.digital_link;
                          
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pb-3 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                              <div>
                                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                <p className="text-gray-400 text-[11px]">Qtd: {item.quantity} • {formatKwanza(item.price)} cada</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {isDigital && (
                                  <div>
                                    {isPaid ? (
                                      <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Baixar Licença/Ebook
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded bg-amber-100/50">
                                        Libera após validação do depósito
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total and destination summaries */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-gray-500 leading-relaxed text-[11px]">
                          <span>Ref: </span><strong className="font-mono text-gray-700">{o.paymentReference}</strong>
                          <span className="mx-2">|</span>
                          <span>Destinatário: </span><strong className="text-gray-700">{o.shippingAddress?.fullName}</strong>
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                          Total Pago: <span className="text-blue-600">{formatKwanza(o.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl"
              >
                Fechar Pedidos
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
