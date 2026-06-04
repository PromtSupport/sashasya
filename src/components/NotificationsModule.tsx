import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, FileText, Upload, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function NotificationsModule() {
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uMap: Record<string, any> = {};
      snap.docs.forEach(d => uMap[d.id] = d.data());
      setUsers(uMap);
    });

    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => {
      unsubUsers();
      unsub();
    };
  }, []);

  const getIcon = (type: string) => {
    if (type.includes('файл') || type.includes('фото')) return <Upload className="w-5 h-5 text-sky-400" />;
    if (type.includes('задач') || type.includes('completed')) return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (type.includes('сообщение')) return <MessageCircle className="w-5 h-5 text-indigo-400" />;
    return <Bell className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/[0.08] pb-6 mb-8">
        <div>
          <h2 className="text-4xl font-serif text-white tracking-wide">Уведомления</h2>
          <p className="text-zinc-500 text-sm mt-2 font-light">Активность на платформе и действия команды</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-[2rem] bg-white/[0.02]">
             <Bell className="w-10 h-10 mx-auto opacity-20 mb-4" />
             <p className="text-zinc-500 font-light">Событий пока нет</p>
          </div>
        ) : (
          activities.map((act, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={act.id} 
              className="glass-card p-5 flex items-start gap-4 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex flex-shrink-0 items-center justify-center overflow-hidden">
                 {users[act.actorId]?.avatarUrl ? (
                   <img src={users[act.actorId].avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   getIcon(act.actionType || '')
                 )}
              </div>
              <div>
                <p className="text-zinc-300 text-sm font-medium">
                  <span className="text-white font-semibold">{users[act.actorId]?.username || act.actorName}</span> {act.actionType} <span className="italic text-zinc-400">{act.targetName}</span>
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                  <Clock className="w-3 h-3" />
                  {act.createdAt?.toDate ? new Date(act.createdAt.toDate()).toLocaleString('ru-RU') : 'Только что'}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
