import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { Settings, Shield, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';

export function ProfileModule({ user }: { user: User }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const d = await getDoc(doc(db, "users", user.uid));
      if (d.exists()) {
        setProfile(d.data());
        setStatus(d.data().status || "");
        setAvatarUrl(d.data().avatarUrl || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), {
      status,
      avatarUrl,
      updatedAt: new Date().toISOString()
    });
    setProfile({ ...profile, status, avatarUrl });
    setIsEditing(false);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
           setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
     }
  };

  if (loading) return <div className="text-center mt-20 text-zinc-600 uppercase tracking-widest text-[10px] animate-pulse">Синхронизация Профиля...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-white/[0.08] pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-serif text-white tracking-wide">Профиль</h2>
          <p className="text-zinc-500 text-sm mt-2 font-light">Управление личностью оператора</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center">
            <div className="relative group mb-6">
              <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-white/[0.02] shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-500">
                  {avatarUrl ? (
                     <motion.img 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                  ) : (
                     <span className="text-4xl font-serif text-white">{profile?.username?.charAt(0) || user.email?.charAt(0) || "?"}</span>
                  )}
              </div>
              {isEditing && (
                <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer border border-white/20">
                   <UploadCloud className="w-6 h-6 text-white mb-1" />
                   <span className="text-[9px] uppercase tracking-wider text-white">Изменить</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} className="hidden" accept="image/*" />
            </div>
            
            <h3 className="text-xl font-medium tracking-wide text-white mb-1 font-serif">{profile?.username || "Неизвестно"}</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-6">{user.email?.replace("@promtsupport.space", "") || "Гостевой ID"}</p>
            
            <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 space-y-3 text-left">
               <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono">
                  <span className="text-zinc-500">Статус</span>
                  <span className="text-white font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Активен</span>
               </div>
            </div>
         </div>

         <div className="md:col-span-2 space-y-6">
            <div className="glass-card p-8">
               <div className="flex items-center justify-between pb-6 border-b border-white/[0.05] mb-6">
                  <span className="text-sm tracking-wide font-medium text-white flex items-center gap-3"><Settings className="w-4 h-4 text-zinc-500" /> Настройки Профиля</span>
                  <button onClick={() => isEditing ? saveProfile() : setIsEditing(true)} className="btn-secondary py-2 px-5 text-xs border border-white/[0.08]">
                    {isEditing ? "Сохранить" : "Редактировать Профиль"}
                  </button>
               </div>
               
               <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Оперативный Статус</label>
                    {isEditing ? (
                       <input value={status} onChange={e=>setStatus(e.target.value)} className="w-full bg-transparent border border-white/10 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-white/30" />
                    ) : (
                       <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-3 text-sm text-zinc-300">
                         {profile?.status || "Статус не установлен"}
                       </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Оформление Системы</label>
                    <div className="flex gap-4">
                       <button className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 text-xs text-white font-medium cursor-default shadow-sm">Midnight Pro</button>
                       <button className="flex-1 bg-transparent border border-white/5 rounded-xl py-3 text-xs text-zinc-600 font-medium cursor-not-allowed">Stark Light (Заблокировано)</button>
                    </div>
                  </div>
               </div>
            </div>

            <div className="glass-card p-6 bg-white/[0.01]">
               <span className="text-xs tracking-wider font-medium text-zinc-400 flex items-center gap-2 mb-3"><Shield className="w-3.5 h-3.5" /> Уровень Безопасности</span>
               <p className="text-[11px] text-zinc-600 leading-relaxed max-w-lg">
                 Терминал защищен сквозными изолированными структурами данных. Внешние запросы блокируются. Ваш токен сеанса не подлежит передаче.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
