/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, Send, Check, ShieldCheck, CreditCard } from 'lucide-react';
import { CartItem } from '../types';
import { formatKwanza } from '../utils';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateCartQty: (productId: string, quantity: number, selectedColor?: string) => void;
  onRemoveFromCart: (productId: string, selectedColor?: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (orderData: {
    paymentMethod: 'bank_transfer' | 'paypay' | 'multicaixa_express' | 'delivery';
    paymentReference: string;
    shippingAddress: {
      fullName: string;
      phone: string;
      province: string;
      street: string;
    };
  }) => Promise<string | undefined>;
  user?: any;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onPlaceOrder,
  user
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Core Payment options state
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'delivery'>('bank_transfer');
  // Suboptions for physical Cash on Delivery
  const [deliveryType, setDeliveryType] = useState<'express' | 'bank_transfer' | 'cash'>('express');

  // Calculates Quantity Discounts
  let totalDiscount = 0;
  cartItems.forEach((item) => {
    const p = item.product;
    if (p.qty_discount_min && p.qty_discount_percent && item.quantity >= p.qty_discount_min) {
      const itemSubtotal = p.price * item.quantity;
      const discountAmount = Math.floor(itemSubtotal * (p.qty_discount_percent / 100));
      totalDiscount += discountAmount;
    }
  });

  const subtotalBeforeDiscount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const subtotal = subtotalBeforeDiscount - totalDiscount;

  const isOnlyDigital = cartItems.length > 0 && cartItems.every(item => item.product.type === 'digital');

  // Calculates bulk and product-specific delivery exemptions
  let qualifiesForFreeShipping = false;
  if (!isOnlyDigital) {
    const physicalItems = cartItems.filter(item => item.product.type === 'physical');
    if (physicalItems.length > 0) {
      const allPhysicalAreFree = physicalItems.every(item => {
        const p = item.product;
        const isFree = !!p.free_shipping;
        const metQtyThreshold = !!(p.qty_free_shipping_min && item.quantity >= p.qty_free_shipping_min);
        return isFree || metQtyThreshold;
      });
      qualifiesForFreeShipping = allPhysicalAreFree;
    }
  }

  const shippingFee = isOnlyDigital || qualifiesForFreeShipping ? 0 : 2500;
  const total = subtotal + shippingFee;

  // Real-time tracking of order status via Firestore subscription
  useEffect(() => {
    if (!placedOrderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', placedOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.status) {
          setLiveStatus(data.status);
        }
      }
    }, (error) => {
      console.error("Erro ao ouvir atualização do pedido:", error);
    });

    return () => unsubscribe();
  }, [placedOrderId]);

  if (!isOpen) return null;

  const handleCheckoutSubmit = async () => {
    setLoading(true);
    setFormError(null);

    // Build the dynamic payment reference label based on payment choice
    let finalRef = 'PAGAMENTO WEBHOOK';
    if (payMethod === 'delivery') {
      if (deliveryType === 'express') {
        finalRef = 'ENTREGA - Multicaixa Express';
      } else if (deliveryType === 'bank_transfer') {
        finalRef = 'ENTREGA - Transferência Bancária';
      } else {
        finalRef = 'ENTREGA - Numerário (Cash)';
      }
    }

    try {
      const orderId = await onPlaceOrder({
        paymentMethod: payMethod === 'delivery' ? 'delivery' : 'bank_transfer',
        paymentReference: finalRef,
        shippingAddress: {
          fullName: user?.displayName || 'Cliente Seu Lugar',
          phone: user?.phoneNumber || '900000000',
          province: 'Luanda',
          street: isOnlyDigital ? 'Entrega Digital' : 'Seu Lugar'
        }
      });

      if (orderId) {
        setPlacedOrderId(orderId);
        // Delivery payments approve on receipt immediately for the user experience, while Online prompts Webhook instructions
        if (payMethod === 'delivery') {
          setLiveStatus('approved');
        } else {
          setLiveStatus('pending');
        }
        onClearCart();
      } else {
        throw new Error('Falha ao gerar o ID da encomenda.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao submeter encomenda. Verifique a ligação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setPlacedOrderId(null);
    setLiveStatus(null);
    onClose();
  };

  const webhookUrl = `${window.location.origin}/api/webhook`;
  const curlCode = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"orderId": "${placedOrderId}"}'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          id="checkout-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-6 border border-gray-100"
        >
          {/* Accent decoration bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-[#F97316]" />

          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-10 p-2 text-gray-500 bg-gray-150 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {placedOrderId ? (
            <div className="p-8">
              {liveStatus === 'approved' ? (
                /* APPROVED ACTION VIEW */
                <div className="text-center flex flex-col items-center py-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-5 border border-green-200 shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Pagamento Confirmado!</h3>
                  <p className="mt-2 text-sm text-gray-600 max-w-sm">
                    Excelente! O nosso servidor recebeu o sinal do Webhook para a encomenda <span className="font-mono font-bold text-blue-600">{placedOrderId}</span> e aprovou os teus acessos automaticamente.
                  </p>

                  <div className="w-full mt-6 p-4 bg-green-50/50 border border-green-100 rounded-2xl flex items-center gap-3 text-left">
                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="text-xs text-green-800 font-medium">Os teus produtos digitais já estão acessíveis na tua prateleira de compras.</span>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="mt-8 px-6 py-3 w-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 rounded-xl shadow-md transition-all active:scale-98"
                  >
                    Ir para Downloads & Biblioteca
                  </button>
                </div>
              ) : (
                /* WAITING ON WEBHOOK SIGNAL VIEW */
                <div className="flex flex-col py-2">
                  <div className="text-center flex flex-col items-center">
                    {/* Ring loader */}
                    <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-orange-200 rounded-full" />
                      <div className="absolute inset-0 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                      <CreditCard className="w-5 h-5 text-[#F97316]" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">Aguardando Confirmação</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      ID Encomenda: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">{placedOrderId}</span>
                    </p>
                  </div>

                  {/* Webhook Developer Instructions Box */}
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        Webhook Endpoint
                      </span>
                      <p className="font-mono text-xs text-gray-700 font-semibold select-all break-all bg-white p-3 rounded-xl border border-gray-200 mt-2">
                        {webhookUrl}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full">
                          Testar com cURL (Postman)
                        </span>
                        <button
                          onClick={copyToClipboard}
                          className="text-[11px] font-bold text-[#F97316] hover:underline"
                        >
                          {copied ? 'Copiado!' : 'Copiar Comando'}
                        </button>
                      </div>
                      <pre className="text-[10px] font-mono leading-relaxed bg-[#1F2937] text-gray-100 p-3.5 rounded-xl overflow-x-auto border border-gray-800">
                        {curlCode}
                      </pre>
                    </div>

                    <div className="text-[11px] text-gray-500 leading-relaxed text-center pt-1">
                      💡 Envie um pedido <strong>POST</strong> para o endpoint acima com o payload indicado para simular o pagamento e libertar instantaneamente.
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="w-full px-5 py-3 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                      Cancelar e Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CART REVIEW SINGLE-SCREEN */
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                Checkout Seu Lugar
                <span className="px-2.5 py-0.5 text-xs text-blue-600 bg-blue-50 rounded-full font-semibold">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                </span>
              </h3>

              {formError && (
                <div className="p-3.5 mb-4 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              {cartItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm">O seu carrinho está vazio. Adicione alguns produtos premium para começar!</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Descobrir Produtos
                  </button>
                </div>
              ) : (
                <div>
                  {/* Products List Scroll Container */}
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-2">
                    {cartItems.map((item, idx) => {
                      const p = item.product;
                      const hasDiscount = !!(p.qty_discount_min && p.qty_discount_percent && item.quantity >= p.qty_discount_min);
                      const keyId = `${p.id}-${item.selectedColor || 'default'}-${idx}`;
                      return (
                        <div key={keyId} className="py-3 flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">
                              {p.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400">
                                {p.category} • {p.type === 'digital' ? 'Download' : 'Físico'}
                              </span>
                              {item.selectedColor && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                                  Cor: {item.selectedColor}
                                </span>
                              )}
                              {hasDiscount && (
                                <span className="px-1.5 py-0.5 bg-orange-50 text-[#F97316] rounded text-[9px] font-bold">
                                  -{p.qty_discount_percent}% Qtd
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity buttons */}
                          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                            <button
                              onClick={() => onUpdateCartQty(p.id, item.quantity - 1, item.selectedColor)}
                              disabled={item.quantity <= 1}
                              className="p-0.5 hover:bg-white rounded text-gray-500 disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-bold px-1 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateCartQty(p.id, item.quantity + 1, item.selectedColor)}
                              disabled={p.type === 'digital' || item.quantity >= p.stock}
                              className="p-0.5 hover:bg-white rounded text-gray-500 disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            onClick={() => onRemoveFromCart(p.id, item.selectedColor)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* PAYMENT SELECTOR (Only for physical products) */}
                  {!isOnlyDigital && (
                    <div className="mt-5 p-3.5 bg-gray-50/50 border border-gray-200/60 rounded-2xl space-y-3.5 text-xs">
                      <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Opção de Pagamento:</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPayMethod('bank_transfer')}
                          className={`px-3 py-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                            payMethod === 'bank_transfer'
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>💳 Transferência Online</span>
                          <span className="text-[9px] font-normal opacity-80">(Confirmação Real-time)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMethod('delivery')}
                          className={`px-3 py-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                            payMethod === 'delivery'
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>🚚 Pagar na Entrega</span>
                          <span className="text-[9px] font-normal opacity-80">(Sem taxas adicionais)</span>
                        </button>
                      </div>

                      {payMethod === 'delivery' && (
                        <div className="mt-2.5 p-3 bg-white border border-gray-150 rounded-xl space-y-2 animate-fadeIn">
                          <span className="block text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">Modalidade de Pagamento na Entrega:</span>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setDeliveryType('express')}
                              className={`py-2 px-1.5 text-[9px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                                deliveryType === 'express'
                                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                                  : 'bg-gray-50/50 border-gray-100 text-gray-505 hover:bg-gray-100'
                              }`}
                            >
                              MulticaixaExpress
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeliveryType('bank_transfer')}
                              className={`py-2 px-1.5 text-[9px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                                deliveryType === 'bank_transfer'
                                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                                  : 'bg-gray-50/50 border-gray-100 text-gray-505 hover:bg-gray-100'
                              }`}
                            >
                              Transferência
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeliveryType('cash')}
                              className={`py-2 px-1.5 text-[9px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                                deliveryType === 'cash'
                                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                                  : 'bg-gray-50/50 border-gray-100 text-gray-505 hover:bg-gray-100'
                              }`}
                            >
                              Numerário (Cash)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary calculations */}
                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-xs text-gray-550">
                      <span>Subtotal bruto:</span>
                      <span className="font-semibold text-gray-800">{formatKwanza(subtotalBeforeDiscount)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-xs text-green-600 font-semibold">
                        <span>Desconto em Quantidade:</span>
                        <span>-{formatKwanza(totalDiscount)}</span>
                      </div>
                    )}
                    {!isOnlyDigital && (
                      <div className="flex justify-between text-xs text-gray-555">
                        <span>Taxa de Entrega:</span>
                        <span className="font-bold text-gray-800">
                          {shippingFee === 0 ? (
                            <span className="text-green-600 font-extrabold uppercase text-[10px]">Livre/Grátis 🎉</span>
                          ) : (
                            formatKwanza(shippingFee)
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-dashed border-gray-150">
                      <span>Total Geral:</span>
                      <span className="text-base text-blue-600">{formatKwanza(total)}</span>
                    </div>
                  </div>

                  {/* Single Checkout CTA Action block */}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      onClick={handleCheckoutSubmit}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      {loading ? 'A processar...' : 'Confirmar Encomenda'} <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                    >
                      Continuar a Comprar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
