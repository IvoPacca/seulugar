/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, CreditCard, Send, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { CartItem, OrderItem } from '../types';
import { formatKwanza, ANGOLAN_PROVINCES } from '../utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateCartQty: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
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
  }) => Promise<void>;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onPlaceOrder
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: review cart, 2: delivery and payment info
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Checkout details form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [street, setStreet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paypay' | 'multicaixa_express' | 'delivery'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFee = province === 'Luanda' ? 2500 : 7500; // Physical shipping fee; free for digital
  const isOnlyDigital = cartItems.length > 0 && cartItems.every(item => item.product.type === 'digital');
  const total = isOnlyDigital ? subtotal : subtotal + (cartItems.length > 0 ? shippingFee : 0);

  const handleNextStep = () => {
    if (cartItems.length === 0) return;
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form validations
    if (!fullName.trim()) return setFormError('Por favor insira o nome completo do destinatário.');
    if (!phone.trim()) return setFormError('Identifique o número de telemóvel para contacto/WhatsApp.');
    if (!isOnlyDigital && !street.trim()) return setFormError('Especifique a morada de entrega (Rua, Bairro, Casa).');
    
    const isDelivery = paymentMethod === 'delivery';
    if (!isDelivery && !paymentReference.trim()) {
      return setFormError('Forneça a referência ou código de transação para validação da transferência.');
    }

    setLoading(true);
    try {
      await onPlaceOrder({
        paymentMethod,
        paymentReference: isDelivery ? 'PAGAMENTO NA ENTREGA' : paymentReference.toUpperCase().trim(),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          province,
          street: isOnlyDigital ? 'Entrega Digital' : street.trim()
        }
      });
      setSuccess(true);
      onClearCart();
    } catch (err: any) {
      setFormError('Erro ao submeter encomenda. Por favor verifique o seu acesso e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    setStep(1);
    setFullName('');
    setPhone('');
    setStreet('');
    setPaymentReference('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          id="checkout-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-6 border border-gray-100"
        >
          {/* Cover slider accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-[#F97316]" />

          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* SUCCESS SCREEN */}
          {success ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-5 border border-green-100 shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Encomenda Registada!</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md">
                Parabéns! A sua encomenda foi armazenada com sucesso no <span className="font-semibold text-blue-600">Seu Lugar</span>. Os nossos operadores vão confirmar a transação bancária e expedir o seu pedido.
              </p>

              <div className="w-full mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl text-left text-xs text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Destinatário:</span>
                  <span className="font-semibold text-gray-900">{fullName}</span>
                </div>
                {!isOnlyDigital && (
                  <div className="flex justify-between">
                    <span>Destino:</span>
                    <span className="font-semibold text-gray-900">{province}, {street}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Modo de Pago:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentMethod === 'bank_transfer' && 'Transferência Bancária'}
                    {paymentMethod === 'paypay' && 'PayPay'}
                    {paymentMethod === 'multicaixa_express' && 'Multicaixa Express'}
                    {paymentMethod === 'delivery' && 'Pagamento na entrega'}
                  </span>
                </div>
                {paymentMethod !== 'delivery' && (
                  <div className="flex justify-between">
                    <span>ID/Referência:</span>
                    <span className="font-mono font-bold text-blue-600">{paymentReference.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 items-center justify-center p-3 mt-4 bg-blue-50 text-blue-600 text-xs rounded-lg w-full max-w-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Pode consultar o progresso em "Os Meus Pedidos"</span>
              </div>

              <button
                onClick={handleCloseSuccess}
                className="mt-8 px-6 py-3 w-full max-w-xs text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-90 rounded-xl shadow-lg transition-transform active:scale-98"
              >
                Voltar à Loja
              </button>
            </div>
          ) : (
            <div>
              {/* STEP 1: CART REVIEW */}
              {step === 1 ? (
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    O Seu Carrinho de Compras
                    <span className="px-2.5 py-0.5 text-xs text-blue-600 bg-blue-50 rounded-full font-semibold">
                      {cartItems.length} {cartItems.length === 1 ? 'artigo' : 'artigos'}
                    </span>
                  </h3>

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
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 pr-2">
                        {cartItems.map((item) => (
                          <div key={item.product.id} className="py-4 flex items-center md:gap-4 gap-2">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {item.product.name}
                              </h4>
                              <p className="text-xs text-gray-400 capitalize">
                                {item.product.category} • {item.product.type === 'digital' ? 'Download' : 'Físico'}
                              </p>
                              <div className="text-xs font-bold text-gray-700 mt-0.5">
                                {formatKwanza(item.product.price)}
                              </div>
                            </div>

                            {/* Quantity buttons */}
                            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                              <button
                                onClick={() => onUpdateCartQty(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1 hover:bg-white rounded text-gray-500 disabled:opacity-30"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold px-1.5 min-w-[18px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateCartQty(item.product.id, item.quantity + 1)}
                                disabled={item.product.type === 'digital' || item.quantity >= item.product.stock}
                                className="p-1 hover:bg-white rounded text-gray-500 disabled:opacity-30"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Delete Item */}
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Summary calculations */}
                      <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-gray-900">{formatKwanza(subtotal)}</span>
                        </div>
                        {!isOnlyDigital && (
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Taxa de Entrega ({province}):</span>
                            <span className="font-semibold text-gray-900">{formatKwanza(shippingFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-dashed border-gray-100">
                          <span>Total:</span>
                          <span className="text-lg text-blue-600">{formatKwanza(total)}</span>
                        </div>
                      </div>

                      {/* Step button actions */}
                      <div className="mt-8 flex justify-end gap-3">
                        <button
                          onClick={onClose}
                          className="px-5 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl"
                        >
                          Continuar a Comprar
                        </button>
                        <button
                          onClick={handleNextStep}
                          className="px-6 py-3 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-md"
                        >
                          Ir para Pagamento & Envio
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: DETAILS, BANK TRANSACTIONS, CONFIRMATION */
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Informações de Envio & Transferência</h3>

                  {formError && (
                    <div className="p-3.5 mb-5 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Delivery Form */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Dados de Destino</h4>
                      
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">NOME COMPLETO *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Quem vai receber a encomenda?"
                          className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-blue-600 focus:bg-white transition-all text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">TELEMÓVEL / WHATSAPP *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="EX: +244 937 424 234"
                          className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-blue-600 focus:bg-white transition-all text-gray-800"
                        />
                      </div>

                      {!isOnlyDigital && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">PROVÍNCIA</label>
                              <select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-blue-600 focus:bg-white text-gray-800"
                              >
                                {ANGOLAN_PROVINCES.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">TAXA DE ENVIO</label>
                              <div className="w-full px-3 py-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-700">
                                {formatKwanza(shippingFee)}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">ENDEREÇO DE ENTREGA (MORADA) *</label>
                            <textarea
                              rows={2}
                              required
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="Indique a rua, bairro, nº da casa ou pontos de referência"
                              className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-blue-600 focus:bg-white transition-all text-gray-800 resize-none"
                            />
                          </div>
                        </>
                      )}

                      {isOnlyDigital && (
                        <div className="p-3 bg-orange-50 border border-orange-100 text-orange-700 text-[11px] rounded-xl">
                          📦 <strong>Produto Digital Exclusivo:</strong> Os ficheiros de download e licenças serão associados a esta conta e enviados eletronicamente. Não há envio físico associado.
                        </div>
                      )}
                    </div>

                    {/* Right Column: Payment Method Selection */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Método de Pagamento</h4>
                      
                      <div className="space-y-2.5">
                        {/* Option 1: Transferências Bancárias */}
                        <div 
                          onClick={() => setPaymentMethod('bank_transfer')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            paymentMethod === 'bank_transfer' 
                              ? 'border-[#2563EB] bg-blue-50/50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === 'bank_transfer'}
                              onChange={() => setPaymentMethod('bank_transfer')}
                              className="accent-blue-600"
                            />
                            <div>
                              <div className="text-xs font-semibold text-gray-900">Transferências Bancárias</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">Transferência direta para a nossa conta</div>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: PayPay */}
                        <div 
                          onClick={() => setPaymentMethod('paypay')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            paymentMethod === 'paypay' 
                              ? 'border-[#2563EB] bg-blue-50/50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === 'paypay'}
                              onChange={() => setPaymentMethod('paypay')}
                              className="accent-blue-600"
                            />
                            <div>
                              <div className="text-xs font-semibold text-gray-900">PayPay</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">Pagamento rápido via plataforma PayPay</div>
                            </div>
                          </div>
                        </div>

                        {/* Option 3: MulticaixaExpress */}
                        <div 
                          onClick={() => setPaymentMethod('multicaixa_express')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            paymentMethod === 'multicaixa_express' 
                              ? 'border-[#2563EB] bg-blue-50/50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === 'multicaixa_express'}
                              onChange={() => setPaymentMethod('multicaixa_express')}
                              className="accent-blue-600"
                            />
                            <div>
                              <div className="text-xs font-semibold text-gray-900">MulticaixaExpress</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">Aplicações Multicaixa Express</div>
                            </div>
                          </div>
                        </div>

                        {/* Option 4: Pagamento na entrega */}
                        <div 
                          onClick={() => {
                            if (!isOnlyDigital) {
                              setPaymentMethod('delivery');
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isOnlyDigital 
                              ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50' 
                              : 'cursor-pointer'
                          } ${
                            paymentMethod === 'delivery' 
                              ? 'border-[#2563EB] bg-blue-50/50 shadow-sm' 
                              : !isOnlyDigital ? 'border-gray-200 bg-white hover:border-gray-300' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              disabled={isOnlyDigital}
                              checked={paymentMethod === 'delivery'}
                              onChange={() => setPaymentMethod('delivery')}
                              className="accent-blue-600 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-900">Pagamento na entrega</span>
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Produtos físicos</span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {isOnlyDigital 
                                  ? 'Indisponível para produtos exclusivamente digitais' 
                                  : 'Pague ao receber a encomenda à sua porta'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display reference input only if not paying on delivery */}
                      {paymentMethod !== 'delivery' ? (
                        <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                            REFERÊNCIA OU CÓDIGO DA OPERAÇÃO *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="EX: TRF98374928"
                            className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 outline-none rounded-xl focus:border-blue-600 focus:bg-white transition-all text-gray-800 font-mono font-bold"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            Insira o código do talão ou comprovativo da operação para verificação acelerada de stock e envio.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-green-50 border border-green-100 rounded-xl mt-4 animate-fadeIn">
                          <p className="text-[11px] text-green-800 leading-normal">
                            🤝 <strong>Pronto:</strong> Não precisa de fornecer comprovativo! O pagamento será liquidado diretamente com o distribuidor no momento de entrega da sua mercadoria.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Footer bar */}
                  <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left font-bold text-gray-900 text-sm">
                      Total a Pagar: <span className="text-lg text-blue-600 ml-1">{formatKwanza(total)}</span>
                    </div>

                    <div className="flex gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-5 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl flex-1 sm:flex-initial"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 rounded-xl shadow-lg flex items-center justify-center gap-2 flex-1 sm:flex-initial min-w-[150px]"
                      >
                        {loading ? 'A Submeter...' : (
                          <>
                            Confirmar Encomenda <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
