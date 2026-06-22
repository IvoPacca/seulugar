/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Star, ShoppingCart, Info, Compass, 
  Layers, Package, Award, Sparkles, Filter 
} from 'lucide-react';
import { Product } from '../types';
import { formatKwanza } from '../utils';

interface LibraryShelfProps {
  products: Product[];
  allProducts: Product[];
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function LibraryShelf({
  products,
  allProducts,
  onViewDetails,
  onAddToCart,
  selectedCategory,
  onSelectCategory
}: LibraryShelfProps) {
  const [viewMode, setViewMode] = useState<'shelf' | 'classical'>('shelf');
  
  // Sidebar folders for direct physical / digital divisions
  const mainFolders = [
    { id: 'Todos', label: 'Todos os Artigos', icon: Compass, count: allProducts.length },
    { id: 'physical', label: 'Artigos Físicos 📦', icon: Package, count: allProducts.filter(p => p.type === 'physical').length },
    { id: 'digital', label: 'Cursos & Ebooks 📂', icon: BookOpen, count: allProducts.filter(p => p.type === 'digital').length },
  ];

  // Secondary folders by general categories to mimic Icecream Reader 6 folders
  const categoryFolders = [
    { id: 'Livros', label: 'Livros & Leitura', icon: BookOpen, count: allProducts.filter(p => p.category === 'Livros').length },
    { id: 'Eletrónicos', label: 'Produtos de Tecnologia', icon: Layers, count: allProducts.filter(p => p.category === 'Eletrónicos').length },
    { id: 'Moda & Calçado', label: 'Estilo & Calçado', icon: Award, count: allProducts.filter(p => p.category === 'Moda & Calçado').length },
    { id: 'Serviços', label: 'Serviços Digitais', icon: Sparkles, count: allProducts.filter(p => p.category === 'Serviços').length },
    { id: 'Outros', label: 'Artigos Diversos', icon: Package, count: allProducts.filter(p => p.category === 'Outros').length },
  ];

  // Group products by 4 to place them on horizontal shelf rows
  const chunkSize = 4;
  const shelvesList: Product[][] = [];
  for (let i = 0; i < products.length; i += chunkSize) {
    shelvesList.push(products.slice(i, i + chunkSize));
  }

  return (
    <div className="bg-gradient-to-b from-[#F9F7F3] to-[#EFECE6] border border-stone-200 shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row min-h-[700px] w-full text-stone-800 font-sans">
      
      {/* ICECREAM EBOOK READER LEFT SIDEBAR */}
      <aside className="w-full lg:w-72 bg-[#E9E5DD] border-r border-stone-300 flex flex-col p-6 shrink-0 shrink-0">
        <div className="flex items-center gap-3 pb-6 border-b border-stone-300">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-stone-800 uppercase">BIBLIOTECA</h4>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Seu Lugar Reader v6</span>
          </div>
        </div>

        {/* Sidebar Folder Navigation */}
        <div className="mt-8 space-y-1.5 flex-1">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-3 mb-2">TIPO DE ARTIGO</p>
          {mainFolders.map(folder => {
            const IconComponent = folder.icon;
            const isSelected = selectedCategory === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectCategory(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? 'bg-amber-850 text-white shadow-md bg-gradient-to-r from-[#7c4c1a] to-[#5C3612] border border-amber-950/30' 
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#F97316]' : 'text-stone-500'}`} />
                  <span>{folder.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isSelected ? 'bg-amber-950/40 text-orange-200' : 'bg-stone-300/50 text-stone-600'
                }`}>
                  {folder.count}
                </span>
              </button>
            );
          })}

          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-3 mt-6 mb-2">CATEGORIAS</p>
          {categoryFolders.map(folder => {
            const IconComponent = folder.icon;
            const isSelected = selectedCategory === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectCategory(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? 'bg-amber-850 text-white shadow-md bg-gradient-to-r from-[#7c4c1a] to-[#5C3612] border border-amber-950/30' 
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#F97316]' : 'text-stone-500'}`} />
                  <span>{folder.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isSelected ? 'bg-amber-950/40 text-orange-200' : 'bg-stone-300/50 text-stone-600'
                }`}>
                  {folder.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary controls/View mode switch */}
        <div className="pt-6 border-t border-stone-300 mt-6">
          <div className="bg-stone-300/40 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('shelf')}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                viewMode === 'shelf' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500'
              }`}
            >
              Prateleiras
            </button>
            <button
              onClick={() => setViewMode('classical')}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                viewMode === 'classical' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500'
              }`}
            >
              Grelha Leve
            </button>
          </div>
        </div>
      </aside>

      {/* DETAILED BOOKSHELF AREA */}
      <section className="flex-1 p-6 sm:p-10 flex flex-col justify-between relative min-h-[500px]">
        {/* Shelf Category Header */}
        <div className="flex items-center justify-between border-b border-stone-300 pb-5 mb-8">
          <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Filter className="w-5 h-5 text-amber-700" />
              {mainFolders.find(f => f.id === selectedCategory)?.label || 
               categoryFolders.find(f => f.id === selectedCategory)?.label || 
               'Produtos'}
            </h3>
            <p className="text-xs text-stone-500 font-semibold">Exibindo artigos na prateleira principal do Seu Lugar.</p>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-stone-200 text-stone-600 px-3 py-1 rounded-full border border-stone-300">
            {products.length} Artigos no total
          </span>
        </div>

        {/* SHELF CONTAINER */}
        {products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/40 rounded-2xl border border-dashed border-stone-300 my-auto">
            <BookOpen className="w-12 h-12 text-stone-400 mb-3 animate-pulse" />
            <p className="text-sm text-stone-600 font-bold">Nenhum produto listado nesta categoria.</p>
            <button
              onClick={() => onSelectCategory('Todos')}
              className="mt-4 px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold rounded-lg transition-all"
            >
              Ver Tudo
            </button>
          </div>
        ) : viewMode === 'shelf' ? (
          /* ICECREAM BOOKSHELF THEME (The wood shelf design) */
          <div className="space-y-16 pb-12">
            {shelvesList.map((shelfProducts, shelfIdx) => (
              <div key={shelfIdx} className="relative pt-6">
                
                {/* Books Grid Alignment on Shelf */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 sm:gap-x-10 gap-y-12 relative z-10 px-4 md:px-6">
                  {shelfProducts.map((product) => {
                    const isDigital = product.type === 'digital';
                    return (
                      <div 
                        key={product.id} 
                        className="flex flex-col items-center text-center group cursor-pointer relative"
                      >
                        {/* THE 3D BOOK COVER STYLE */}
                        <div 
                          onClick={() => onViewDetails(product)}
                          className="w-full max-w-[150px] aspect-[2/3] bg-amber-50 rounded-r-md shadow-lg relative group transition-transform duration-300 group-hover:-translate-y-3 flex flex-col justify-between overflow-hidden border border-stone-300/70"
                          style={{
                            boxShadow: '4px 10px 20px rgba(0,0,0,0.22), inset 3px 0 6px rgba(255,255,255,0.4)'
                          }}
                        >
                          {/* Inner page edge shadow side-crease */}
                          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/25 to-transparent z-10" />
                          <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-white/20 z-10" />

                          {/* Cover Image */}
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />

                          {/* Gloss flare reflection overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-60 pointer-events-none" />

                          {/* Badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
                            {isDigital ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-black text-white bg-orange-600 rounded uppercase tracking-widest leading-none shadow-sm shadow-orange-950/30">
                                Digital
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8px] font-black text-white bg-teal-700 rounded uppercase tracking-widest leading-none shadow-sm shadow-teal-950/30">
                                Físico
                              </span>
                            )}
                          </div>

                          {/* Under cover info panel (visible overlay on hover) */}
                          <div className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-white z-10">
                            <Info className="w-5 h-5 text-orange-400 mb-1" />
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider">Ver Detalhes</span>
                          </div>
                        </div>

                        {/* PRODUCT SHELF CAPTION label */}
                        <div className="mt-4 w-full px-2 max-w-[160px] flex flex-col items-center">
                          <h4 
                            onClick={() => onViewDetails(product)}
                            className="text-xs font-black text-stone-800 line-clamp-1 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h4>
                          
                          {/* Rating & Stock */}
                          <div className="flex items-center gap-1 my-1">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-2.5 h-2.5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-stone-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[9px] font-bold text-stone-500">
                              {product.rating || 5.0}
                            </span>
                          </div>

                          <span className="text-xs font-black text-amber-900 tracking-tight">
                            {formatKwanza(product.price)}
                          </span>

                          {/* ICECREAM DESIGNED DIRECT BUY PROMOTIONAL BUTTON */}
                          <button
                            onClick={() => onAddToCart(product)}
                            className="mt-2.5 w-full bg-gradient-to-b from-[#FFA726] to-[#FB8C00] hover:from-[#FB8C00] hover:to-[#F57C00] text-white py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Comprar</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* THE 3D WOODEN SHELF BAR BEVEL (Behind books footer) */}
                <div className="absolute -bottom-6 left-0 right-0 z-0">
                  {/* Wood top plank shelf */}
                  <div className="h-4 bg-gradient-to-r from-[#8D5B28] via-[#B5864F] to-[#7c4c1a] rounded-t-sm shadow-md border-b border-amber-950/20" />
                  {/* Beveled wood face with bottom ledge and deep ambient drop-shadow */}
                  <div className="h-5 bg-gradient-to-r from-[#6B4219] via-[#8F6335] to-[#5C3612] rounded-b-md shadow-xl flex items-center px-4 relative">
                    {/* Metal brand plaque in middle or left to match classical library look */}
                    <div className="absolute left-6 top-1 px-3 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-100 hover:from-yellow-105 hover:to-amber-200 border border-amber-500/30 rounded text-[7px] font-black tracking-widest text-amber-900 uppercase opacity-75 shadow-sm">
                      SEU LUGAR • SHELF {shelfIdx + 1}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* STANDARD GRELHA CATALOG FOR COMPATIBILITY */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
            {products.map(product => (
              <div 
                key={product.id}
                className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col md:flex-row gap-4 hover:shadow-lg transition-all duration-300 relative group"
              >
                <div className="w-24 h-32 shrink-0 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">{product.category}</span>
                    <h4 className="text-sm font-bold text-stone-800 mt-1 line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-normal">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-black text-amber-900">{formatKwanza(product.price)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onViewDetails(product)}
                        className="p-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-500"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 font-bold text-[10px] text-white uppercase rounded-lg transition-all tracking-wider"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
