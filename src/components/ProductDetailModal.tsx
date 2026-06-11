/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star, Download, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../types';
import { formatKwanza } from '../utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const isDigital = product.type === 'digital';

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (isDigital) return; // Unbounded items can't hit a standard small stock limit, but let's let digital items be 1 by default
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddWithQty = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div id="product-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          id="product-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-4"
        >
          {/* Top colored accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-orange-500" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Image */}
            <div className="relative p-6 md:p-8 flex items-center justify-center bg-gray-50 border-r border-gray-100">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-white shadow-sm">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Right Column: Specs */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg">
                    {product.category}
                  </span>
                  {isDigital ? (
                    <span className="px-2.5 py-1 text-xs font-semibold text-[#F97316] bg-orange-50 rounded-lg flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Produto Digital
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Produto Físico
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h2>

                {/* Stars and feedback */}
                <div className="flex items-center gap-2 mt-3 mb-5">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {product.rating || 5.0} (Avaliação média)
                  </span>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                  <div className="text-xs text-gray-500 font-medium mb-1">Preço Exclusivo</div>
                  <div className="text-3xl font-extrabold text-[#1F2937] tracking-tight">
                    {formatKwanza(product.price)}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    Descrição completa
                  </h4>
                  <p className="text-sm text-gray-650 leading-relaxed mb-6">
                    {product.description}
                  </p>
                </div>

                {/* Logistics alerts */}
                <div className="space-y-3 p-4 bg-blue-50/40 rounded-2xl border border-blue-50 mb-6 text-xs text-gray-650">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>Garantia de 100% de satisfação com suporte técnico local via WhatsApp.</span>
                  </div>
                  {isDigital ? (
                    <div className="flex items-start gap-2.5">
                      <Download className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                      <span><strong>Entrega Instantânea:</strong> Após aprovação da transferência, o link de descarregamento é facultado diretamente no histórico de pedidos e por email.</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <Truck className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                      <span><strong>Entrega ao Domicílio em Luanda:</strong> Entregas rápidas e exclusivas para a província de Luanda (24-48h).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Box */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  {/* Quantity selector (only for physical) */}
                  {!isDigital && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1.5 font-medium">Quantidade</span>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <button
                          onClick={handleDecrease}
                          className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold transition-colors"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-2 text-sm font-semibold text-gray-900 min-w-[36px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={handleIncrease}
                          className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold transition-colors"
                          disabled={quantity >= product.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-end h-full">
                    {!isDigital && (
                      <span className="text-xs text-gray-400 mb-1.5">
                        Armazém: <strong className={product.stock > 0 ? "text-green-600" : "text-red-600"}>{product.stock > 0 ? `${product.stock} unidades` : "Esgotado"}</strong>
                      </span>
                    )}
                    {isDigital && <span className="text-xs text-gray-405 mb-1.5">Licença Digital Ilimitada</span>}
                    
                    <button
                      onClick={handleAddWithQty}
                      disabled={!isDigital && product.stock <= 0}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 rounded-xl shadow-lg transition-transform active:scale-98"
                    >
                      <ShoppingCart className="w-4 h-4" /> Adicionar {quantity > 1 ? `(${quantity})` : ''} ao Carrinho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
