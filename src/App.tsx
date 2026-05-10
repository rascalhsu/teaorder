import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Info, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Clock,
  User,
  Coffee as TeaIcon
} from 'lucide-react';
import { 
  db, 
  auth, 
  googleProvider, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  signInWithPopup, 
  signOut,
  handleFirestoreError,
  OperationType
} from './lib/firebase';

// Constants
const SUGAR_OPTIONS = ["無糖", "微糖", "半糖", "少糖", "全糖"];
const ICE_OPTIONS = ["去冰", "微冰", "少冰", "正常冰", "熱"];

interface Order {
  id: string;
  customerName: string;
  drinkName: string;
  sugar: string;
  ice: string;
  note: string;
  createdAt: any;
}

export default function App() {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    drinkName: '',
    sugar: '半糖',
    ice: '去冰',
    note: ''
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Simple admin check for demo: rascalhsu@hlvs.ylc.edu.tw
        setIsAdmin(user.email === 'rascalhsu@hlvs.ylc.edu.tw');
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Orders Listener (as requested: "每秒均更新資料" and "自動載入資料庫資料")
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.drinkName) return;

    try {
      await addDoc(collection(db, 'orders'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      // Reset form
      setFormData({
        customerName: '',
        drinkName: '',
        sugar: '半糖',
        ice: '去冰',
        note: ''
      });
      // Show success feedback (optional)
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">
        <div className="text-[#059669] animate-pulse font-bold">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1a1a1a] font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#059669] text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full">
              <TeaIcon className="w-6 h-6 text-[#059669]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TeaParty 團購趣</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-full">
            <button 
              onClick={() => setView('front')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${view === 'front' ? 'bg-white text-[#059669]' : 'text-white hover:bg-white/20'}`}
            >
              前台點餐
            </button>
            <button 
              onClick={() => setView('back')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${view === 'back' ? 'bg-white text-[#059669]' : 'text-white hover:bg-white/20'}`}
            >
              後台管理
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-700 px-3 py-1 rounded-full text-[10px] font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Firebase 連線中
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">{user.displayName}</p>
                  <p className="text-[8px] text-emerald-300 uppercase tracking-widest">{isAdmin ? 'ADMIN' : 'USER'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-emerald-800 hover:bg-emerald-900 p-2 rounded-lg transition-colors"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-yellow-400 hover:bg-yellow-500 text-emerald-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                管理員登入
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <AnimatePresence mode="wait">
          {view === 'front' ? (
            <motion.div 
              key="front"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full"
            >
              {/* Order Form (Step 1) */}
              <div className="md:col-span-4 space-y-6">
                <section className="bg-white rounded-2xl p-6 shadow-lg border-t-8 border-orange-400 h-full">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-orange-500 underline decoration-4 underline-offset-4">Step 1. 前台點餐</span>
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">訂購人姓名</label>
                      <input 
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                        placeholder="請輸入姓名"
                        className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">飲料品項</label>
                      <input 
                        type="text"
                        required
                        value={formData.drinkName}
                        onChange={e => setFormData({...formData, drinkName: e.target.value})}
                        placeholder="例如: 手打鴨屎香檸檬茶"
                        className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">甜度</label>
                        <select 
                          value={formData.sugar}
                          onChange={e => setFormData({...formData, sugar: e.target.value})}
                          className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-all appearance-none bg-white"
                        >
                          {SUGAR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">冰塊</label>
                        <select 
                          value={formData.ice}
                          onChange={e => setFormData({...formData, ice: e.target.value})}
                          className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-all appearance-none bg-white"
                        >
                          {ICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">備註 (選填)</label>
                      <textarea 
                        value={formData.note}
                        onChange={e => setFormData({...formData, note: e.target.value})}
                        placeholder="少糖少珍珠..."
                        className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-all min-h-[80px]"
                      />
                    </div>
                    <div className="mt-4">
                      <button 
                        type="submit"
                        className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        送出訂單 🚀
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              {/* Order Lists (Step 2 - Simplified View for participants) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                <section className="bg-white rounded-2xl p-6 shadow-lg border-t-8 border-emerald-400 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <span className="text-emerald-500 underline decoration-4 underline-offset-4">即時點餐看板</span>
                    </h2>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">當前總計</p>
                      <p className="text-2xl font-black text-emerald-600">{orders.length} 杯</p>
                    </div>
                  </div>

                  <div className="flex-1 border-2 border-dashed border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 flex flex-col">
                    <div className="grid grid-cols-12 bg-gray-100 p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <div className="col-span-3">訂購人</div>
                      <div className="col-span-6">品項</div>
                      <div className="col-span-3 text-right">規格</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {orders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                          <TeaIcon className="w-16 h-16 mb-4" />
                          <p className="font-bold uppercase tracking-widest">待機中...</p>
                        </div>
                      ) : (
                        orders.map((order, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            key={order.id}
                            className="grid grid-cols-12 items-center p-3 bg-white rounded-xl shadow-sm border border-gray-50 hover:border-emerald-100"
                          >
                            <div className="col-span-3 font-bold text-gray-700 truncate pr-2">{order.customerName}</div>
                            <div className="col-span-6 flex flex-col">
                               <span className="text-sm font-medium text-gray-800">{order.drinkName}</span>
                               {order.note && <span className="text-[10px] text-gray-400 truncate italic">"{order.note}"</span>}
                            </div>
                            <div className="col-span-3 flex justify-end gap-1">
                              <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-bold">{order.sugar}</span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{order.ice}</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="back"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-800">
                  <span className="text-emerald-500 underline decoration-4 underline-offset-4">後台管理系統</span>
                </h2>
                <div className="flex items-center gap-4">
                  {!isAdmin && user && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                       ACCESS DENIED
                    </div>
                  )}
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">總訂單</span>
                      <span className="text-2xl font-black text-[#059669]">{orders.length}</span>
                    </div>
                    <div className="w-[2px] h-10 bg-gray-100 rounded-full"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">品項統計</span>
                      <span className="text-2xl font-black text-[#059669]">
                        {new Set(orders.map(o => o.drinkName)).size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!isAdmin ? (
                <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-200 shadow-xl">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
                      <ShieldCheck className="w-12 h-12 text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">權限不足</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                      此區域僅限管理員 Rascal 進行操作。<br/>請確認登入帳號屬性。
                    </p>
                    {!user && (
                      <button 
                        onClick={handleLogin}
                        className="px-8 py-3 bg-[#059669] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-lg shadow-emerald-100"
                      >
                        管理員授權登入
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-[#059669] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <TeaIcon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                        <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">最受歡迎茶飲</h4>
                        <p className="text-2xl font-black truncate relative z-10">
                          {orders.length > 0 
                            ? Object.entries(orders.reduce((acc: any, o) => {
                                acc[o.drinkName] = (acc[o.drinkName] || 0) + 1;
                                return acc;
                              }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]
                            : '待機中'}
                        </p>
                     </div>
                     <div className="bg-orange-500 text-white rounded-2xl p-6 shadow-xl">
                        <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">團購動態</h4>
                        <p className="text-2xl font-black">ACTIVE NOW</p>
                     </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl">
                    <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-800">訂單流水帳 (Real-time)</h3>
                      <button className="bg-white text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-50 transition-all">
                        匯出統計表格 (Excel)
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100/50">
                            <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">訂購人</th>
                            <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">品項名稱</th>
                            <th className="px-8 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">甜度/冰塊</th>
                            <th className="px-8 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">訂購時間</th>
                            <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">動作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                                暫無資料
                              </td>
                            </tr>
                          ) : (
                            orders.map((order) => (
                              <tr key={order.id} className="hover:bg-emerald-50/30 transition-colors group">
                                <td className="px-8 py-4 font-bold text-gray-800">{order.customerName}</td>
                                <td className="px-8 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{order.drinkName}</span>
                                    {order.note && <span className="text-[10px] text-rose-400 font-bold italic line-clamp-1">{order.note}</span>}
                                  </div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                  <div className="flex justify-center gap-1">
                                    <span className="text-[10px] px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-bold">{order.sugar}</span>
                                    <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold">{order.ice}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                  <span className="text-[10px] font-mono font-bold text-gray-400">
                                    {order.createdAt?.toDate().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                  <button 
                                    onClick={() => handleDelete(order.id)}
                                    className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-lg"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 text-emerald-100 p-3 text-center text-[10px] tracking-widest uppercase font-bold">
        REAL-TIME TRANSACTION MONITORING SYSTEM • DATABASE ID: {db.app.options.projectId} • VERSION 2.0.4
      </footer>
    </div>
  );
}
