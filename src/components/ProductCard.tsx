/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Eye, Star, FileText, Package } from 'lucide-react';
import { Product } from '../types';
import { formatKwanza } from '../utils';

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const isDigital = product.type === 'digital';

  return (
    <motion.div
      id={`product-card-${product.id}`}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative flex flex-col overflow-hidden bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 rounded-2xl">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="px-2.5 py-1 text-[10px] font-extrabold text-white bg-[#2563EB] rounded-full uppercase tracking-wider">
            {product.category}
          </span>
          {isDigital ? (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-white bg-[#F97316] rounded-full uppercase tracking-wider">
              <FileText className="w-3 h-3" /> Digital
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-white bg-[#1F2937] rounded-full uppercase tracking-wider">
              <Package className="w-3 h-3" /> Físico
            </span>
          )}
        </div>

        {/* hover quick actions */}
        <div className="absolute inset-0 bg-[#1F2937]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 z-10">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 bg-white hover:bg-gray-100 text-[#1F2937] rounded-full shadow-md hover:scale-110 transition-transform duration-200"
            title="Ver Detalhes"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onAddToCart(product)}
            className="p-3 bg-[#F97316] hover:bg-[#e05e0f] text-white rounded-full shadow-md hover:scale-110 transition-transform duration-200"
            title="Adicionar ao Carrinho"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* product info */}
      <div className="flex flex-col flex-1 mt-4">
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-500">
            {product.rating || 5.0}
          </span>
          {product.sales_count ? (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-auto">
              {product.sales_count} vendidos
            </span>
          ) : null}
        </div>

        <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#2563EB] transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed">
          {product.description}
        </p>

        {/* footer action & stock */}
        <div className="flex items-end justify-between pt-4 mt-auto border-t border-gray-100">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Preço</div>
            <div className="text-lg font-black text-[#2563EB] tracking-tight">
              {formatKwanza(product.price)}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-extrabold text-[#2563EB] bg-blue-50 hover:bg-[#2563EB] hover:text-white rounded-xl shadow-sm transition-all active:scale-95 uppercase tracking-wider"
          >
            Comprar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
