/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Upload, Plus, Trash2, Settings, ClipboardList, CheckCircle, 
  Download, LayoutDashboard, Copy, Check, Info, FileText, AlertTriangle,
  Edit3, DollarSign, TrendingUp, ShoppingBag, BarChart3, X, FileSignature
} from 'lucide-react';
import { Product, Order, OrderStatus } from '../types';
import { 
  getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials, 
  createProductInDatabase, deleteProductFromDatabase, updateProductInDatabase, uploadProductImage 
} from '../supabase';
import { formatKwanza } from '../utils';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onRefreshProducts: () => Promise<void>;
  onRefreshOrders: () => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export default function AdminPanel({
  products,
  orders,
  onRefreshProducts,
  onRefreshOrders,
  onUpdateOrderStatus
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'finance' | 'supabase'>('catalog');
  
  // Products form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodCat, setProdCat] = useState('Eletrónicos');
  const [prodType, setProdType] = useState<'physical' | 'digital'>('physical');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodDigitalLink, setProdDigitalLink] = useState('');
  
  // Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Supabase connection keys state
  const [sUrl, setSUrl] = useState('');
  const [sKey, setSKey] = useState('');
  const [sConfigSuccess, setSConfigSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    // Load config on mount
    const creds = getSupabaseCredentials();
    setSUrl(creds.supabaseUrl);
    setSKey(creds.supabaseAnonKey);
  }, []);

  const handleCopySql = () => {
    const sqlText = `-- 1. Crie a tabela de produtos no Supabase SQL Editor:
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image_url text,
  type text CHECK (type IN ('physical', 'digital')) NOT NULL,
  stock integer DEFAULT 0,
  digital_link text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilite a segurança em nível de linha (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Crie políticas de segurança pública (Leitura livre)
CREATE POLICY "Leitura livre de produtos" ON public.products 
  FOR SELECT USING (true);

-- 4. Crie política de escrita para controle administrativo
CREATE POLICY "Admin controle total" ON public.products 
  FOR ALL USING (true);`;
    
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(sUrl, sKey, false);
    setSConfigSuccess(true);
    setTimeout(() => setSConfigSuccess(false), 3000);
    onRefreshProducts(); // Force refresh of products collection
  };

  const handleEditInit = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description || '');
    setProdPrice(product.price);
    setProdCat(product.category);
    setProdType(product.type);
    setProdStock(product.stock || 0);
    setProdDigitalLink(product.digital_link || '');
    setImageUrl(product.image_url || '');
    setImageFile(null);
    setPdfFile(null);
    setFormSuccess(null);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(0);
    setProdStock(10);
    setProdDigitalLink('');
    setImageFile(null);
    setPdfFile(null);
    setImageUrl('');
    setFormSuccess(null);
    setFormError(null);
  };

  const handleAddOrEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess(null);
    setFormError(null);

    try {
      let finalImgUrl = imageUrl.trim() || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600';
      let finalDigitalLink = prodDigitalLink.trim();

      // Upload image to Supabase Bucket if provided
      if (imageFile) {
        finalImgUrl = await uploadProductImage(imageFile);
      }

      // Upload PDF file to Supabase Bucket if digital format and pdf is selected
      if (prodType === 'digital' && pdfFile) {
        finalDigitalLink = await uploadProductImage(pdfFile);
      }

      const payload = {
        name: prodName.trim(),
        description: prodDesc.trim(),
        price: Number(prodPrice),
        category: prodCat,
        type: prodType,
        stock: prodType === 'digital' ? 99999 : Number(prodStock),
        image_url: finalImgUrl,
        digital_link: prodType === 'digital' ? finalDigitalLink : undefined
      };

      if (editingProduct) {
        // Mode: Edit Product
        const success = await updateProductInDatabase(editingProduct.id, payload);
        if (success) {
          setFormSuccess('Produto atualizado com sucesso no Supabase!');
          setEditingProduct(null);
        } else {
          throw new Error('Falha ao atualizar base de dados.');
        }
      } else {
        // Mode: Create Product
        await createProductInDatabase(payload);
        setFormSuccess('Produto cadastrado e armazenado com sucesso!');
      }

      // Restores fields to initial empty state
      setProdName('');
      setProdDesc('');
      setProdPrice(0);
      setProdStock(10);
      setProdDigitalLink('');
      setImageFile(null);
      setPdfFile(null);
      setImageUrl('');
      
      await onRefreshProducts();
    } catch (err: any) {
      setFormError(`Ocorreu um erro: ${err.message || 'Dados inválidos inseridos.'}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Pretende realmente eliminar este artigo de forma permanente?')) {
      await deleteProductFromDatabase(id);
      await onRefreshProducts();
      if (editingProduct && editingProduct.id === id) {
        handleCancelEdit();
      }
    }
  };

  const { isConfigured } = getSupabaseCredentials();

  // Finance tab metrics calculations
  const totalApprovedOrders = orders.filter(o => o.status === 'approved' || o.status === 'delivered');
  const totalPendingOrders = orders.filter(o => o.status === 'pending');
  
  const faturamentoRealizado = totalApprovedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const faturamentoPendente = totalPendingOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  
  const totalInvoicedItemsCount = totalApprovedOrders.reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  const averageTicket = totalApprovedOrders.length > 0 ? faturamentoRealizado / totalApprovedOrders.length : 0;

  // Split Category sells data
  const categorySalesStats: Record<string, { faturado: number, count: number }> = {};
  const typeSalesStats = {
    physical: 0,
    digital: 0
  };

  totalApprovedOrders.forEach(o => {
    o.items.forEach(i => {
      // Find category in products lists or guess
      const matchedProd = products.find(p => p.id === i.productId);
      const cat = matchedProd ? matchedProd.category : 'Outros';
      
      if (!categorySalesStats[cat]) {
        categorySalesStats[cat] = { faturado: 0, count: 0 };
      }
      categorySalesStats[cat].faturado += (i.price * i.quantity);
      categorySalesStats[cat].count += i.quantity;

      if (i.type === 'digital') {
        typeSalesStats.digital += (i.price * i.quantity);
      } else {
        typeSalesStats.physical += (i.price * i.quantity);
      }
    });
  });

  return (
    <div id="admin-panel-container" className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[#1F2937] text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 rounded border border-orange-500/20 uppercase">
              Admin Suite
            </span>
            <h2 className="text-xl font-bold tracking-tight">Painel Executivo Seu Lugar</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">Gestão de catálogo Supabase, upload de imagens (Storage) e auditorias de faturas.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex flex-wrap bg-gray-800 rounded-xl p-1 shrink-0 border border-gray-700">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'catalog' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Catálogo
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Encomendas ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'finance' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Financeiro
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative flex items-center gap-1.5 ${
              activeTab === 'supabase' ? 'bg-orange-650 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Supabase Config
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-gray-400'}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: CATALOG MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Box: Form Entry (Create or Edit) */}
            <div className="lg:col-span-1 border-r border-gray-100 pr-0 lg:pr-6">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  {editingProduct ? (
                    <>
                      <FileSignature className="w-4 h-4 text-[#F97316]" /> Editar Artigo
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-blue-600" /> Cadastrar Artigo
                    </>
                  )}
                </h3>
                {editingProduct && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-[10px] font-extrabold text-red-500 flex items-center gap-0.5 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar Edição
                  </button>
                )}
              </div>

              {formSuccess && (
                <div className="p-3 mb-4 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl">
                  {formSuccess}
                </div>
              )}

              {formError && (
                <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddOrEditProduct} className="space-y-4">
                {editingProduct && (
                  <div className="p-2.5 bg-yellow-50 text-yellow-800 text-[10px] rounded-lg font-medium border border-yellow-100 mb-2">
                    Alterando o artigo com ID: <span className="font-mono font-bold">{editingProduct.id}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">DESIGN-NOME DO PRODUTO *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: iPhone 15 Pro Max"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">CATEGORIA</label>
                    <select
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full px-2 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-blue-600"
                    >
                      <option value="Eletrónicos">Eletrónicos</option>
                      <option value="Livros">Livros</option>
                      <option value="Moda & Calçado">Moda & Calçado</option>
                      <option value="Serviços">Serviços</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">FORMATO</label>
                    <select
                      value={prodType}
                      onChange={(e) => setProdType(e.target.value as 'physical' | 'digital')}
                      className="w-full px-2 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-blue-600"
                    >
                      <option value="physical">Físico</option>
                      <option value="digital">Digital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">PREÇO (KWANZAS) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      placeholder="EX: 45000"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-800 font-bold"
                    />
                  </div>

                  {prodType === 'physical' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">STOCK REAL</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-850 font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">STOCK</label>
                      <div className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-bold">
                        ILIMITADO (∞)
                      </div>
                    </div>
                  )}
                </div>

                {prodType === 'digital' && (
                  <div className="p-3 bg-orange-50/50 border border-[#F97316]/30 rounded-xl space-y-2">
                    <span className="block text-[10px] font-bold text-[#F97316]">PDF DO LIVRO DIGITAL / ARQUIVO</span>
                    
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPdfFile(e.target.files[0]);
                        }
                      }}
                      className="text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                    />
                    
                    <div className="text-center text-[9px] text-gray-400 font-bold">OU USE LINK EXTERNO ABAIXO</div>

                    <input
                      type="url"
                      value={prodDigitalLink}
                      onChange={(e) => setProdDigitalLink(e.target.value)}
                      placeholder="https://sua-url.com/pdf-ou-chave"
                      className="w-full px-3 py-1.5 text-[11px] bg-white border border-gray-200 outline-none rounded-lg focus:border-[#F97316] text-gray-800 font-mono"
                    />
                    
                    {pdfFile && (
                      <span className="block text-[9px] text-orange-600 font-semibold">PDF Pronto: {pdfFile.name} (upload automático para bucket Supabase)</span>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">DESCRITIVO DO ARTIGO</label>
                  <textarea
                    rows={3}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Sumário dos benefícios e especificações..."
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-800 resize-none font-semibold text-gray-700"
                  />
                </div>

                {/* IMAGE UPLOAD SECTION */}
                <div className="p-3 bg-gray-50 border border-dashed border-gray-250 rounded-xl space-y-2">
                  <span className="block text-[10px] font-bold text-gray-500">IMAGEM MOCK / BUCKET STORAGE ('products')</span>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                    />
                    
                    <div className="text-center text-[10px] text-gray-400 font-bold">Alternativamente informe link URL:</div>
                    
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 outline-none rounded-lg focus:border-blue-600 text-gray-800 font-mono text-[11px]"
                    />
                    
                    {imageFile && (
                      <div className="flex items-center gap-1 text-[9px] text-blue-600 font-bold">
                        <Upload className="w-3 h-3 shrink-0" /> Foto Carregada: {imageFile.name} (upload directo)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  {formLoading ? 'Salvando na Base de Dados...' : (
                    <>
                      <Database className="w-4 h-4" /> 
                      {editingProduct ? 'Gravar Alterações' : 'Cadastrar Artigo no Supabase'}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Box: Catalog List Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-[#F97316]" /> Lista de Artigos Cadastrados
                </h3>
                <span className="text-xs font-bold text-gray-400">Total: {products.length} itens</span>
              </div>

              {products.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-100 rounded-2xl text-center bg-gray-50">
                  <p className="text-sm text-gray-400 font-medium">Nenhum produto cadastrado por enquanto.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-150">
                        <th className="py-3 px-4">Artigo</th>
                        <th className="py-3 px-4 text-center">Categoria</th>
                        <th className="py-3 px-4 text-center">Formato</th>
                        <th className="py-3 px-4 text-right">Preço</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 max-w-[180px] truncate">
                            <span className="flex items-center gap-2">
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-8 h-8 object-cover rounded-xl border"
                              />
                              {p.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-650 font-semibold">{p.category}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                              p.type === 'digital' ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50'
                            }`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-gray-900">{formatKwanza(p.price)}</td>
                          <td className="py-3.5 px-4 text-center text-gray-600 font-bold">
                            {p.type === 'digital' ? '∞' : p.stock}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditInit(p)}
                                className="p-1 px-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar Artigo"
                              >
                                <Edit3 className="w-4 h-4 stroke-[2]" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 px-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar Artigo"
                              >
                                <Trash2 className="w-4 h-4 stroke-[2]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS AUDITING */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-600" /> Registro de Faturas de Clientes
              </h3>
              <button
                onClick={onRefreshOrders}
                className="text-xs font-black text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Atualizar Lista
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-100 rounded-2xl text-center bg-gray-50">
                <p className="text-sm text-gray-400 font-medium">Nenhuma encomenda registada na plataforma de momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="border border-gray-150 rounded-2xl p-5 hover:shadow-sm transition-shadow bg-gray-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 select-all">{o.id}</span>
                          <span className="text-xs text-gray-400">• Encomendado em {new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 mt-1">Cliente: {o.userName} ({o.userEmail})</div>
                      </div>

                      {/* Status selectors */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          o.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          o.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {o.status === 'pending' ? 'Pendente' :
                           o.status === 'approved' ? 'Aprovado' :
                           o.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </span>

                        <select
                          value={o.status}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="px-2 py-1 text-xs border border-gray-200 outline-none rounded-lg focus:border-blue-600 text-gray-800 bg-white cursor-pointer font-bold"
                        >
                          <option value="pending">Pendente (Avaliação)</option>
                          <option value="approved">Aprovar Transferência</option>
                          <option value="delivered">Marcar como Entregue</option>
                          <option value="cancelled">Cancelar Pedido</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Contents and details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
                      {/* Products */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide">Artigos do Pedido</h4>
                        <div className="space-y-1.5">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-50 pb-1.5 text-gray-700">
                              <span>{item.name} <strong className="text-gray-900 font-bold">x{item.quantity}</strong></span>
                              <span className="font-bold">{formatKwanza(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-black pt-1.5 text-[#2563EB] text-sm">
                          <span>Total Faturado:</span>
                          <span>{formatKwanza(o.totalPrice)}</span>
                        </div>
                      </div>

                      {/* Payment references */}
                      <div className="p-4 bg-white border border-gray-150 rounded-xl space-y-2">
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1">
                          Ref/Código de Pagamento
                        </h4>
                        <div>
                          <span className="text-gray-400">Canal:</span>{' '}
                          <span className="font-semibold text-gray-800">
                            {o.paymentMethod === 'bank_transfer' && 'Transferências Bancárias'}
                            {o.paymentMethod === 'paypay' && 'PayPay'}
                            {o.paymentMethod === 'multicaixa_express' && 'Multicaixa Express'}
                            {o.paymentMethod === 'delivery' && 'Pagamento na Entrega'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Código do Talão:</span> <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1 hover:bg-orange-100 select-all">{o.paymentReference}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-50 flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold leading-relaxed">
                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>
                            {o.paymentMethod === 'delivery' 
                              ? 'O cliente escolheu pagar no ato de entrega física dos produtos.' 
                              : 'Confirme o recebimento do valor na conta/carteira correspondente antes de aprovar.'}
                          </span>
                        </div>
                      </div>

                      {/* Shipping information */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide">Destinatário & Envio</h4>
                        <div className="space-y-1 text-gray-650 font-semibold">
                          <div><strong className="text-gray-800">Nome:</strong> {o.shippingAddress?.fullName}</div>
                          <div><strong className="text-gray-800">Província:</strong> {o.shippingAddress?.province}</div>
                          <div><strong className="text-gray-800">Telefone:</strong> {o.shippingAddress?.phone}</div>
                          <div><strong className="text-gray-800">Morada:</strong> {o.shippingAddress?.street}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FINANCIAL CONTROL */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Painel de Controle Financeiro do Administrador
              </h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                Relatórios em Tempo Real
              </span>
            </div>

            {/* Financial Metrics Cards (Executive Theme) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1F2937] text-white rounded-3xl p-5 border border-gray-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vendas Realizadas</span>
                  <p className="text-2xl font-black mt-1 text-[#F97316] tracking-tight">{formatKwanza(faturamentoRealizado)}</p>
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">Pedidos Confirmados: {totalApprovedOrders.length}</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-gray-500">A Receber / Pendentes</span>
                  <p className="text-2xl font-black mt-1 text-gray-900 tracking-tight">{formatKwanza(faturamentoPendente)}</p>
                  <span className="text-[9px] text-amber-500 font-bold mt-0.5 block">Talões pendentes: {totalPendingOrders.length}</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-gray-500">Ticket Médio</span>
                  <p className="text-2xl font-black mt-1 text-[#2563EB] tracking-tight">{formatKwanza(averageTicket)}</p>
                  <span className="text-[9px] text-blue-500 font-bold mt-0.5 block">Por Encomenda Registada</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-gray-500">Artigos Despachados</span>
                  <p className="text-2xl font-black mt-1 text-teal-600 tracking-tight">{totalInvoicedItemsCount}</p>
                  <span className="text-[9px] text-teal-650 font-bold mt-0.5 block">Volume em Unidades</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Visual breakdown metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Sales distribution chart in SVG */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> Distribuição de Receitas por Categoria
                </h4>

                {Object.keys(categorySalesStats).length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-xs font-semibold">Sem transações aprovadas para apresentar relatórios por categoria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(categorySalesStats).map(([cat, stat]) => {
                      // Calculate percentage relative to faturamento realizado
                      const pct = faturamentoRealizado > 0 ? (stat.faturado / faturamentoRealizado) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-700">{cat} ({stat.count} {stat.count === 1 ? 'venda' : 'vendas'})</span>
                            <span className="text-gray-950">{formatKwanza(stat.faturado)} <span className="text-gray-400 font-bold">({pct.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#2563EB] h-full rounded-full" 
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Physical vs Digital Sales splits */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Divisão de Vendas: Artigos Físicos vs Digitais
                </h4>

                {faturamentoRealizado === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-xs font-semibold text-gray-400">Nenhum faturamento confirmado para repartir os volumes.</p>
                  </div>
                ) : (
                  <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-blue-600 uppercase tracking-widest text-[10px]">Artigos Físicos</span>
                        <span className="text-gray-900">{formatKwanza(typeSalesStats.physical)}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full" 
                          style={{ width: `${(typeSalesStats.physical / faturamentoRealizado) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold block">Envio expresso e entrega local em Luanda</span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-orange-600 uppercase tracking-widest text-[10px]">Materiais Digitais</span>
                        <span className="text-gray-900">{formatKwanza(typeSalesStats.digital)}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#F97316] h-full rounded-full" 
                          style={{ width: `${(typeSalesStats.digital / faturamentoRealizado) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold block">Acesso imediato e downloads diretos de PDF</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUPABASE INTEGRATION WIZARD */}
        {activeTab === 'supabase' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" /> Configuração do Supabase Database & Storage
              </h3>
              <span className={`px-2.5 py-1 text-xs rounded-full font-bold flex items-center gap-1.5 ${
                isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConfigured ? 'Conexão em Tempo Real Ativa' : 'Supabase Desconfigurado'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Instructions and SQL copy */}
              <div className="lg:col-span-3 space-y-4 text-xs">
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl space-y-2 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 shrink-0" /> Configuração do Catálogo Real</div>
                  <p>
                    Com o Seu Lugar, o painel administrativo conecta-se diretamente ao <strong>banco de dados Supabase do administrador</strong>. O seu catálogo de artigos e upload de imagens no Storage bucket passarão a ser sincronizados em tempo real, fornecendo o backend de alto desempenho necessário para produção.
                  </p>
                </div>

                <div className="border border-gray-150 rounded-2xl p-5 bg-gray-50/40 relative">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900 uppercase">1. Script SQL para Criar Tabelas</h4>
                    <button
                      onClick={handleCopySql}
                      className="text-[10px] font-bold text-blue-600 flex items-center gap-1 bg-white border px-2 py-1 rounded hover:bg-gray-150 shadow-sm"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Código SQL
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mb-3 text-[11px] text-gray-500">
                    Aceda ao seu dashboard do Supabase, clique em <strong>SQL Editor</strong>, cole o script abaixo e clique em **Run**:
                  </p>
                  
                  <pre className="p-3 bg-gray-900 text-gray-100 text-[10px] rounded-lg h-[180px] overflow-y-auto font-mono select-all text-left">
{`CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image_url text,
  type text CHECK (type IN ('physical', 'digital')) NOT NULL,
  stock integer DEFAULT 0,
  digital_link text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura livre de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin controle total" ON public.products FOR ALL USING (true);`}
                  </pre>
                </div>

                <div className="p-4 bg-orange-50/70 text-orange-850 rounded-xl space-y-2 border border-orange-100">
                  <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" /> Configuração do Storage Bucket para Imagens & Downloads</div>
                  <p className="text-[11px] leading-relaxed">
                    No painel do Supabase, vá para <strong>Storage</strong>, crie um novo bucket público chamado <strong>products</strong> para acomodar os arquivos de imagem dos produtos e arquivos de download (PDFs).
                  </p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-gray-150 rounded-2xl p-6 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 uppercase text-xs mb-4 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-600" /> Credenciais Supabase
                  </h4>

                  {sConfigSuccess && (
                    <div className="p-3 mb-4 text-xs text-green-700 bg-green-50 border border-green-150 rounded-xl flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 stroke-[2]" /> Configuração salva com sucesso!
                    </div>
                  )}

                  <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">SUPABASE URL APLET *</label>
                      <input
                        type="url"
                        value={sUrl}
                        onChange={(e) => setSUrl(e.target.value)}
                        placeholder="https://xxxxxx.supabase.co"
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-250 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">SUPABASE ANON / PUBLIC KEY *</label>
                      <input
                        type="password"
                        value={sKey}
                        onChange={(e) => setSKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-250 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-gray-800 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center justify-center gap-1"
                    >
                      Salvar e Reconectar
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          clearSupabaseCredentials();
                          setSUrl('');
                          setSKey('');
                          onRefreshProducts();
                        }}
                        className="w-full text-center text-[10px] text-red-500 hover:underline pt-2 font-bold block"
                      >
                        Limpar Credenciais Conectadas
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
