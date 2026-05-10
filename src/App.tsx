import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Info, 
  ShieldCheck, 
  Clock,
  User,
  Coffee as TeaIcon
} from 'lucide-react';
import { 
  db, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  handleFirestoreError,
  OperationType
} from './lib/firebase';

// Constants
const SUGAR_OPTIONS = ["無糖", "微糖", "半糖", "少糖", "全糖"];
const ICE_OPTIONS = ["去冰", "微冰", "少冰", "正常冰", "熱"];

const DRINK_MENU = [
  { 
    category: "經典原萃", 
    items: [
      { name: "熟成紅茶", price: 35, desc: "精選斯里蘭卡紅茶，回甘順口" },
      { name: "翡翠綠茶", price: 35, desc: "清香綠茶，清新脫俗" },
      { name: "四季春青茶", price: 35, desc: "在地青茶，香氣持久" },
      { name: "極品烏龍", price: 35, desc: "重焙火烏龍，茶味濃厚" }
    ] 
  },
  { 
    category: "香醇奶茶", 
    items: [
      { name: "珍珠奶茶", price: 55, desc: "Q彈珍珠配上經典奶茶" },
      { name: "經典奶茶", price: 45, desc: "奶香與茶香的完美融合" },
      { name: "燕麥奶茶", price: 60, desc: "健康新選擇，豐富層次感" },
      { name: "烏龍奶茶", price: 50, desc: "焙火茶香與奶精的火花" }
    ] 
  },
  { 
    category: "鮮奶系列", 
    items: [
      { name: "紅茶拿鐵", price: 60, desc: "小農鮮乳與熟成紅茶" },
      { name: "抹茶拿鐵", price: 70, desc: "日本抹茶粉與鮮乳層次分明" },
      { name: "黑糖珍珠鮮奶", price: 75, desc: "濃郁黑糖珍珠與純鮮奶" }
    ] 
  },
  { 
    category: "果香特調", 
    items: [
      { name: "鮮榨柳橙綠", price: 65, desc: "新鮮柳橙汁與清爽綠茶" },
      { name: "葡萄柚綠", price: 65, desc: "含果粒葡萄柚，果味十足" },
      { name: "百香雙響炮", price: 60, desc: "百香果配上椰果與珍珠" },
      { name: "檸檬金桔", price: 55, desc: "酸甜適中，開胃解膩" }
    ] 
  },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  sugar: string;
  ice: string;
  note: string;
}

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
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');

  // Selection state for individual items
  const [currentSelection, setCurrentSelection] = useState({
    sugar: '無糖',
    ice: '去冰',
    note: ''
  });

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

  const addToCart = (drink: { name: string, price: number }) => {
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: drink.name,
      price: drink.price,
      sugar: currentSelection.sugar,
      ice: currentSelection.ice,
      note: currentSelection.note
    };
    setCart([...cart, newItem]);
    // Reset selection note for next item
    setCurrentSelection({ sugar: '無糖', ice: '去冰', note: '' });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || cart.length === 0) return;

    try {
      const promises = cart.map(item => 
        addDoc(collection(db, 'orders'), {
          customerName,
          drinkName: item.name,
          sugar: item.sugar,
          ice: item.ice,
          note: item.note,
          createdAt: serverTimestamp()
        })
      );
      
      await Promise.all(promises);
      setCart([]);
      setCustomerName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
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
            <div className="flex items-center gap-2 bg-emerald-700 px-3 py-1 rounded-full text-[10px] font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              即時同步中
            </div>
            
            <div className="bg-emerald-800 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-100">
              系統操作中
            </div>
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
              <div className="md:col-span-12 space-y-8">
                <section className="bg-white rounded-[32px] p-8 shadow-2xl border-t-8 border-orange-400">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Drink Menu Selection */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-orange-500 underline decoration-4 underline-offset-4">Step 1. 挑選茶飲</span>
                        </h2>
                      </div>
                      
                      <div className="space-y-8 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {DRINK_MENU.map((cat) => (
                          <div key={cat.category} className="space-y-3">
                            <h3 className="text-xs font-black text-[#059669] uppercase tracking-[0.2em] bg-emerald-50 w-fit px-3 py-1 rounded-full">{cat.category}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {cat.items.map(item => (
                                <div key={item.name} className="group p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                                      <p className="text-[10px] text-gray-400 mt-1 min-h-[2.5em]">{item.desc}</p>
                                    </div>
                                    <span className="font-black text-emerald-600 text-sm">${item.price}</span>
                                  </div>
                                  
                                  <div className="mt-4 flex flex-col gap-3">
                                    <div className="flex gap-2">
                                      <select 
                                        className="flex-1 text-[10px] p-1.5 rounded-lg border border-gray-200 outline-none"
                                        value={currentSelection.sugar}
                                        onChange={e => setCurrentSelection({...currentSelection, sugar: e.target.value})}
                                      >
                                        {SUGAR_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                                      </select>
                                      <select 
                                        className="flex-1 text-[10px] p-1.5 rounded-lg border border-gray-200 outline-none"
                                        value={currentSelection.ice}
                                        onChange={e => setCurrentSelection({...currentSelection, ice: e.target.value})}
                                      >
                                        {ICE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                                      </select>
                                    </div>
                                    <button 
                                      onClick={() => addToCart(item)}
                                      className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                      加入購物車 <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Cart and Finalize */}
                    <div className="space-y-8 bg-gray-50/50 rounded-3xl p-6 border-2 border-dashed border-gray-100">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-between mb-6">
                           <span className="text-emerald-500 underline decoration-4 underline-offset-4">Step 2. 我的購物車</span>
                           <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{cart.length} 品項</span>
                        </h2>

                        <div className="space-y-3 min-h-[300px]">
                          {cart.length === 0 ? (
                            <div className="h-[300px] flex flex-col items-center justify-center opacity-30 grayscale">
                              <TeaIcon className="w-20 h-20 mb-4 text-emerald-800" />
                              <p className="font-black uppercase tracking-widest text-sm text-emerald-900 text-center">購物車是空的<br/>從左側選單挑幾杯吧！</p>
                            </div>
                          ) : (
                            cart.map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                                <div className="flex-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800">{item.name}</span>
                                    <span className="text-emerald-500 font-black text-xs">${item.price}</span>
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{item.sugar}</span>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.ice}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {cart.length > 0 && (
                        <div className="pt-6 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-500 uppercase tracking-widest">總計金額</span>
                            <span className="text-3xl font-black text-emerald-600">${cart.reduce((sum, item) => sum + item.price, 0)}</span>
                          </div>
                          
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">最後一步：填寫訂購人姓名</label>
                               <input 
                                 type="text"
                                 required
                                 value={customerName}
                                 onChange={e => setCustomerName(e.target.value)}
                                 placeholder="這張單子是誰的？"
                                 className="w-full p-4 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 bg-white outline-none transition-all font-bold"
                               />
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                              送出全體訂單 <ChevronRight className="w-6 h-6" />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* Order Lists (Step 2 - Simplified View for participants) */}
              <div className="md:col-span-12 flex flex-col gap-4">
                <section className="bg-white rounded-[32px] p-8 shadow-lg border-t-8 border-emerald-400 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                       <span className="text-emerald-500 underline decoration-4 underline-offset-4">即時點餐看板 (LIVE)</span>
                    </h2>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">當前總計</p>
                      <p className="text-4xl font-black text-emerald-600">{orders.length} <span className="text-sm">杯</span></p>
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
