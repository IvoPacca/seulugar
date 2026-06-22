/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, ChevronRight, ShoppingBag, ArrowRight, 
  HelpCircle, Star, Package, BookOpen, Coffee, FileImage, Layers 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { fetchAllProducts } from './supabase';
import { Product, CartItem, UserProfile, Order, OrderStatus } from './types';
import { STORE_CATEGORIES, formatKwanza } from './utils';

// Import modular components
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import LibraryShelf from './components/LibraryShelf';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import MyOrdersModal from './components/MyOrdersModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Global State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Filtering and Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isAdminView, setIsAdminView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals Visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Auto-dismiss Toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 1. Hook: Handle Firebase Auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Fetch existing user profile
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          let profile: UserProfile;
          if (userDoc.exists()) {
            profile = userDoc.data() as UserProfile;
          } else {
            // New register fallback
            const isSystemAdmin = firebaseUser.email === 'ivoimbi5@gmail.com' || firebaseUser.email?.endsWith('@seulugar.ao');
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Cliente Seu Lugar',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              isAdmin: isSystemAdmin,
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true });
          }
          setUser(profile);
          
          // Trigger data load
          await Promise.all([
            loadProducts(),
            loadOrdersForUser(profile)
          ]);
        } catch (error) {
          console.error("Error setting up authenticated profile: ", error);
        }
      } else {
        setUser(null);
        setOrders([]);
        await loadProducts(); // Still load catalog for guest navigation
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch products from Supabase (or fallback cache)
  const loadProducts = async () => {
    try {
      const items = await fetchAllProducts();
      setProducts(items);
    } catch (e) {
      console.error("Failed to load catalog: ", e);
    }
  };

  // 3. Fetch orders from Firestore
  const loadOrdersForUser = async (profile: UserProfile | null) => {
    if (!profile || !auth.currentUser) {
      setOrders([]);
      return;
    }

    const path = 'orders';
    try {
      let ordersQuery;
      if (profile.isAdmin) {
        // Admins can see all orders in database
        ordersQuery = query(collection(db, path), orderBy('created_at', 'desc'));
      } else {
        // Simple customers can see only theirs
        ordersQuery = query(
          collection(db, path), 
          where('userId', '==', profile.uid),
          orderBy('created_at', 'desc')
        );
      }

      const querySnapshot = await getDocs(ordersQuery);
      const items: Order[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data() as Order);
      });
      setOrders(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  // Dynamic products update from inside the admin panel
  const handleRefreshProducts = async () => {
    await loadProducts();
  };

  const handleRefreshOrders = async () => {
    await loadOrdersForUser(user);
  };

  // 4. Cart Add Control
  const handleAddToCart = (product: Product, quantity = 1, selectedColor?: string) => {
    if (!user) {
      setIsAuthOpen(true);
      setToastMessage('Sem login não se faz compra! Por favor, inicie sessão.');
      return;
    }
    const existingIndex = cart.findIndex((item) => item.product.id === product.id && item.selectedColor === selectedColor);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      // Virtual/digital products shouldn't have multiplier stack issues
      if (product.type !== 'digital') {
        const potentialQty = updatedCart[existingIndex].quantity + quantity;
        updatedCart[existingIndex].quantity = Math.min(potentialQty, product.stock);
      } else {
        updatedCart[existingIndex].quantity = 1;
      }
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity, selectedColor }]);
    }
    // Launch sidebar drawer notification
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, quantity: number, selectedColor?: string) => {
    const targetIdx = cart.findIndex(item => item.product.id === productId && item.selectedColor === selectedColor);
    if (targetIdx === -1) return;
    
    const targetProduct = cart[targetIdx].product;
    if (targetProduct.type === 'digital') return; // strictly 1

    const updated = [...cart];
    updated[targetIdx].quantity = Math.min(Math.max(1, quantity), targetProduct.stock);
    setCart(updated);
  };

  const handleRemoveFromCart = (productId: string, selectedColor?: string) => {
    setCart(cart.filter(item => !(item.product.id === productId && item.selectedColor === selectedColor)));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // 5. Checkout Flow
  const handlePlaceOrder = async (orderData: {
    paymentMethod: 'bank_transfer' | 'paypay' | 'multicaixa_express' | 'delivery';
    paymentReference: string;
    shippingAddress: {
      fullName: string;
      phone: string;
      province: string;
      street: string;
    };
  }): Promise<string | undefined> => {
    if (!user) {
      setIsAuthOpen(true);
      throw new Error('Identidade necessária para faturar.');
    }

    const orderId = `SL-${Date.now().toString().slice(-6)}`;
    const orderItems = cart.map(item => {
      const orderItem: any = {
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        type: item.product.type,
        selectedColor: item.selectedColor || undefined
      };
      if (item.product.digital_link !== undefined) {
        // Prevent storing huge base64 strings in Firestore (1MB limit)
        const link = item.product.digital_link;
        if (link.startsWith('data:') || link.length > 2000) {
          orderItem.digital_link = '[data_link_local]';
        } else {
          orderItem.digital_link = link;
        }
      }
      return orderItem;
    });

    const isOnlyDigital = cart.every(item => item.product.type === 'digital');
    
    // Calculate quantity discounts
    let totalDiscount = 0;
    cart.forEach((item) => {
      const p = item.product;
      if (p.qty_discount_min && p.qty_discount_percent && item.quantity >= p.qty_discount_min) {
        const itemSubtotal = p.price * item.quantity;
        const discountAmount = Math.floor(itemSubtotal * (p.qty_discount_percent / 100));
        totalDiscount += discountAmount;
      }
    });

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0) - totalDiscount;

    // Check for shipping exemptions
    let qualifiesForFreeShipping = false;
    if (!isOnlyDigital) {
      const physicalItems = cart.filter(item => item.product.type === 'physical');
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
    const finalTotal = subtotal + shippingFee;

    const ord: Order = {
      id: orderId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      items: orderItems,
      totalPrice: finalTotal,
      paymentMethod: orderData.paymentMethod,
      paymentReference: orderData.paymentReference,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      created_at: new Date().toISOString()
    };

    const path = 'orders';
    try {
      // Save order to Firestore
      await setDoc(doc(db, path, orderId), ord);
      
      // Update store orders listing state immediately
      setOrders([ord, ...orders]);
      return orderId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${orderId}`);
    }
  };

  // 6. Admin Panel Order Status modifier
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const path = 'orders';
    try {
      await updateDoc(doc(db, path, orderId), { status });
      
      // Sync local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${orderId}`);
    }
  };

  // Helpers: filter and search catalog
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === 'Todos') {
      matchesCategory = true;
    } else if (selectedCategory === 'physical') {
      matchesCategory = p.type === 'physical';
    } else if (selectedCategory === 'digital') {
      matchesCategory = p.type === 'digital';
    } else {
      matchesCategory = p.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      {/* GLOBAL NAVBAR */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={async () => {
          await signOut(auth);
          setUser(null);
          setIsAdminView(false);
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
      />

      {/* RENDER VIEW AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-xs font-semibold text-gray-400">A iniciar o Seu Lugar...</p>
          </div>
        ) : (
          <div>
            {isAdminView ? (
              /* EXECUTIVE ADMIN SUITE */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminPanel
                  products={products}
                  orders={orders}
                  onRefreshProducts={handleRefreshProducts}
                  onRefreshOrders={handleRefreshOrders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  user={user}
                />
              </motion.div>
            ) : (
              /* CUSTOMER FRONT END INTERFACE */
              <div className="space-y-8">
                
                {/* ADVANCED BENTO GRID SYSTEM - Omitted when searching to leave only products */}
                {!searchQuery.trim() && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* BENTO CARD 1: PRIMARY HERO showcase (col-span-8) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-center min-h-[360px] shadow-sm select-none"
                    >
                      <div className="relative z-10 max-w-lg space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 text-xs font-black text-[#2563EB] uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" /> Destaques da Loja
                        </div>
                        
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
                          Tudo o que procuras, <span className="text-[#2563EB]">num só</span> lugar.
                        </h2>
                        
                        <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-semibold">
                          A plataforma e-commerce premium em Angola de extrema confiança. Explore produtos físicos exclusivos e as melhores soluções digitais do mercado.
                        </p>
                        
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => setSelectedCategory('Eletrónicos')}
                            className="px-6 py-3.5 text-xs font-extrabold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-wider"
                          >
                            Ver Tecnologia
                          </button>
                          <button
                            onClick={() => setSelectedCategory('Todos')}
                            className="px-6 py-3.5 text-xs font-extrabold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 transition-all uppercase tracking-wider"
                          >
                            Ver Todo o Catálogo
                          </button>
                        </div>
                      </div>

                      {/* Technical / Geometric vector graphic element behind the text */}
                      <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:flex items-center justify-center opacity-8 pointer-events-none select-none">
                        <svg className="w-4/5 h-4/5 text-[#2563EB]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="50" cy="50" r="40" strokeDasharray="4 4" />
                          <circle cx="50" cy="50" r="28" />
                          <path d="M10 50H90M50 10V90" strokeWidth="0.5" />
                        </svg>
                      </div>
                    </motion.div>

                    {/* BENTO CARD 2: DIGITAL SHOWCASE (col-span-4) */}
                    <motion.div
                      onClick={() => setSelectedCategory('Livros')}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="lg:col-span-4 bg-[#1F2937] rounded-[2.5rem] p-8 text-white flex flex-col justify-between min-h-[360px] shadow-sm relative overflow-hidden group cursor-pointer border border-[#2d3748]"
                    >
                      <div className="absolute -right-3 -top-3 w-32 h-32 bg-[#F97316] rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity" />
                      
                      <div className="space-y-4">
                        <span className="inline-flex px-3 py-1 bg-white/10 text-[10px] font-extrabold rounded-full uppercase tracking-wider text-[#F97316] border border-white/5">
                          Produtos Digitais
                        </span>
                        <h3 className="text-2xl font-bold tracking-tight text-white m-0">
                          Universo Digital
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                          Ebooks imperdíveis e materiais práticos de excelência. downloads imediatos garantidos após comprovação bancária.
                        </p>
                      </div>

                      <div className="pt-6 flex items-end justify-end">
                        <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-[#F97316] transition-colors flex items-center justify-center text-white">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </motion.div>

                    {/* BENTO CARD 3: LOGISTICS / PROVINCES (col-span-4) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="lg:col-span-4 bg-[#F97316] rounded-[2.5rem] p-8 text-white flex flex-col justify-between min-h-[300px] shadow-sm relative overflow-hidden group border border-[#f97316]/80"
                    >
                      <div className="absolute -left-6 -bottom-6 w-36 h-36 bg-[#2563EB] rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity" />
                      
                      <div className="space-y-4">
                        <span className="inline-flex px-3 py-1 bg-white/15 text-[10px] font-extrabold rounded-full uppercase tracking-wider text-white border border-white/5">
                          Logística Seu Lugar
                        </span>
                        <h3 className="text-2xl font-bold tracking-tight text-white m-0">
                          Entrega em Luanda
                        </h3>
                        <p className="text-xs text-orange-50 leading-relaxed font-semibold">
                          Enviamos produtos físicos com toda a segurança diretamente para a sua morada em Luanda entre 24 a 48 horas!
                        </p>
                      </div>

                      <div className="pt-6 flex items-center justify-between">
                        <div className="text-xs font-black uppercase tracking-widest text-[#1F2937] bg-white px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> 100% SEGURO
                        </div>
                        <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center text-white">
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                    </motion.div>

                    {/* BENTO CARD 4: PREMIUM CLUB VIP (col-span-8) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="lg:col-span-8 bg-gradient-to-br from-[#2563EB] to-blue-800 text-white rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden border border-blue-700"
                    >
                      <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-white/15 to-transparent pointer-events-none" />
                      
                      <div className="space-y-3 max-w-lg z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-white/10 border border-white/15 px-3 py-1 rounded-full inline-block">
                          Fidelidade Premium
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">
                          Adira ao Premium Club SeuLugar
                        </h3>
                        <p className="text-xs text-blue-105 leading-relaxed font-semibold">
                          Registe-se hoje para gerir os seus pedidos, e receba portes grátis em todas as compras físicas acima de Kz 50.000 em Angola!
                        </p>
                      </div>

                      <div className="shrink-0 z-10">
                        <button
                          onClick={() => {
                            setToastMessage('Em desenvolvimento');
                          }}
                          className="w-full md:w-auto px-6 py-3.5 bg-white text-[#2563EB] hover:bg-orange-50 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-wider"
                        >
                          Explorar
                        </button>
                      </div>
                    </motion.div>

                  </div>
                )}

                {/* THE ICECREAM EBOOK READER 6 THEMED PRODUCTS AREA */}
                <LibraryShelf
                  products={filteredProducts}
                  allProducts={products}
                  onViewDetails={(p) => setSelectedProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER METRICS */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="font-bold text-gray-900 text-sm flex items-center justify-center md:justify-start gap-1">
              Seu <span className="text-[#F97316]">Lugar</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">" Tudo o que procuras, num só lugar. " © 2026. Todos os direitos reservados.</p>
          </div>

          {/* Quick legal guarantees badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-gray-450 font-medium">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Garantia de Segurança
            </div>
            <span>•</span>
            <div>Suporte WhatsApp +244 937 424 234</div>
            <span>•</span>
            <div>Luanda, Angola</div>
          </div>
        </div>
      </footer>

      {/* SHARED MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(profile) => {
          setUser(profile);
          loadOrdersForUser(profile);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateCartQty={handleUpdateCartQty}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        user={user}
      />

      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        orders={orders}
        products={products}
      />

      {/* Premium Toast notification overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1F2937] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-800 flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-[#F97316] shrink-0" />
            <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              className="ml-3 text-white/40 hover:text-white transition-colors font-bold text-sm"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
