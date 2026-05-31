import React, { useEffect, useState } from 'react';
import { signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, Layers, Calendar, Lock, LogOut, Activity, User as UserIcon } from 'lucide-react';
import { StorageModule } from './components/StorageModule';
import { TasksModule } from './components/TasksModule';
import { CalendarModule } from './components/CalendarModule';
import { MetricsModule } from './components/MetricsModule';
import { SafeModule } from './components/SafeModule';
import { ProfileModule } from './components/ProfileModule';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("storage");
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!username || !password) return;
    try {
      const cred = await signInAnonymously(auth);
      
      if (isRegistering) {
        await setDoc(doc(db, "users", cred.user.uid), {
             username,
             theme: "dark",
             status: "Active operator",
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
        });
      } else {
        await setDoc(doc(db, "users", cred.user.uid), {
             username,
             updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e: any) {
      setAuthError(e.message.replace("Firebase:", "System error:"));
    }
  };

  const logout = () => signOut(auth);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#030303] relative overflow-hidden">
        {/* Static Abstract Geometric Elements for Auth Page */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] border-[1px] border-indigo-500/10 rounded-full" />
          <div className="absolute top-[20%] -right-[20%] w-[70vw] h-[70vw] border-[1px] border-purple-500/10 rounded-full" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm flex flex-col items-center relative p-8 glass-panel rounded-[2.5rem]"
        >
          <div className="relative z-10 flex flex-col items-center w-full">
            <div 
              className="w-64 h-64 mb-8 flex items-center justify-center relative"
            >
              <div className="absolute inset-2 bg-indigo-500/10 blur-xl rounded-full" />
              <img src="https://i.ibb.co/Lz5djnMx/Promt-Support-logo-2-P-S-removebg-preview.png" alt="PS" className="w-56 h-56 object-contain drop-shadow-lg relative z-10" />
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-white mb-2 font-serif text-center">
              Prompt <span className="italic text-zinc-500">&</span> Support
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-12 font-medium">
              Защищенное Пространство
            </p>

            <form onSubmit={handleAuth} className="w-full space-y-4">
               <div>
                  <input required value={username} onChange={e=>setUsername(e.target.value)} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all placeholder-zinc-600" placeholder="Имя Оператора" />
               </div>
               <div>
                  <input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all placeholder-zinc-600" placeholder="Код Доступа" />
               </div>

               {authError && <div className="text-[11px] text-red-400 text-center py-2">{authError}</div>}

               <button type="submit" className="w-full btn-primary py-4 mt-2">
                 <span className="text-sm font-semibold tracking-wide">{isRegistering ? "Создать Профиль" : "Авторизоваться"}</span>
               </button>
            </form>

            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="mt-8 text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
               {isRegistering ? "Вернуться к Авторизации" : "Создать новые учетные данные"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "storage": return <StorageModule />;
      case "tasks": return <TasksModule />;
      case "chronos": return <CalendarModule />;
      case "metrics": return <MetricsModule />;
      case "safe": return <SafeModule />;
      case "profile": return <ProfileModule user={user} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#030303] pb-32 overflow-hidden selection:bg-indigo-500/30">
      
      {/* Ambient Moving Orbs Overlay (Optimized) */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30">
         <div className="absolute w-[150vw] h-[150vw]">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-500/20 blur-[80px] rounded-full" />
            <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-sky-500/10 blur-[80px] rounded-full" />
            <div className="absolute top-[40%] right-[30%] w-[20%] h-[20%] bg-purple-500/10 blur-[80px] rounded-full" />
         </div>
      </div>

      <header className="px-6 sm:px-12 pt-8 flex items-center justify-between z-40 relative">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center shrink-0">
            <img src="https://i.ibb.co/Lz5djnMx/Promt-Support-logo-2-P-S-removebg-preview.png" alt="PS" className="h-32 w-auto object-contain opacity-90 drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif font-medium tracking-wide text-white leading-tight">
              Prompt <span className="italic text-zinc-500">&</span> Support
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <button onClick={logout} className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
             <LogOut className="w-4 h-4 ml-1" />
           </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-12 pt-12 flex-grow relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)', scale: 0.98 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Interactive Dock */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm sm:max-w-md flex justify-center"
      >
        <div className="glass-panel rounded-full px-2 py-2 flex items-center gap-1 sm:gap-2 pointer-events-auto overflow-x-auto hide-scrollbar max-w-full shadow-2xl">
          {[
            { id: "storage", icon: Folder, label: "Хранилище", color: "hover:text-amber-400 hover:bg-amber-400/10" },
            { id: "tasks", icon: Layers, label: "Задачи", color: "hover:text-sky-400 hover:bg-sky-400/10" },
            { id: "chronos", icon: Calendar, label: "Время", color: "hover:text-emerald-400 hover:bg-emerald-400/10" },
            { id: "metrics", icon: Activity, label: "Метрики", color: "hover:text-rose-400 hover:bg-rose-400/10" },
            { id: "safe", icon: Lock, label: "Ключи", color: "hover:text-indigo-400 hover:bg-indigo-400/10" },
            { id: "profile", icon: UserIcon, label: "Профиль", color: "hover:text-purple-400 hover:bg-purple-400/10" }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group flex flex-col items-center justify-center shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner scale-110' : `text-zinc-500 scale-100 ${tab.color}`}`}
            >
              <tab.icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              {activeTab === tab.id && <motion.div layoutId="dock-indicator" className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
              
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 glass-panel text-white text-[10px] px-3 py-1.5 shadow-lg pointer-events-none whitespace-nowrap font-medium tracking-wide border-t border-white/20">
                {tab.label}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
