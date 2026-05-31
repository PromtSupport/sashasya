import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { File, Folder as FolderIcon, Upload, X, Save } from 'lucide-react';
import { motion } from 'motion/react';

export function StorageModule() {
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingFile, setEditingFile] = useState<any>(null);

  useEffect(() => {
    const unsubFolders = onSnapshot(query(collection(db, 'folders')), (snap) => {
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubFiles = onSnapshot(query(collection(db, 'files')), (snap) => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubFolders(); unsubFiles(); };
  }, []);

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addDoc(collection(db, 'folders'), {
      name: newFolderName,
      parentId: currentFolderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const deleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'folders', id));
  };
  
  const deleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'files', id));
  };

  const saveFileContent = async () => {
    if (!editingFile) return;
    await updateDoc(doc(db, 'files', editingFile.id), {
      content: editingFile.content,
      updatedAt: serverTimestamp()
    });
    setEditingFile(null);
  };

  const uploadFakeFile = async () => {
    await addDoc(collection(db, 'files'), {
      name: "Заметки.txt",
      parentId: currentFolderId,
      size: "12 KB",
      type: "text/plain",
      content: "Это синхронизированный текстовый файл в новой эстетике.",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const currentFolders = folders.filter(f => f.parentId === currentFolderId);
  const currentFiles = files.filter(f => f.parentId === currentFolderId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/[0.08] pb-6 mb-8">
        <div>
          <h2 className="text-4xl font-serif text-white tracking-wide">Хранилище</h2>
          <p className="text-zinc-500 text-sm mt-2 font-light">Общие файлы и директории</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsAddingFolder(true)} className="btn-secondary py-2 px-5 text-sm flex items-center gap-2">
            <FolderIcon className="w-4 h-4" /> Новая Папка
          </button>
          <button onClick={uploadFakeFile} className="btn-primary py-2 px-5 text-sm flex items-center gap-2">
             Загрузить
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-[11px] text-zinc-500 uppercase tracking-widest font-medium mb-6">
         <button onClick={() => setCurrentFolderId(null)} className="hover:text-white transition-colors">Пространство</button>
      </div>

      {isAddingFolder && (
        <form onSubmit={createFolder} className="glass-card p-4 flex gap-3 mb-8">
           <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Имя папки..." className="flex-grow bg-transparent px-4 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" autoFocus />
           <button type="submit" className="btn-primary px-4 py-2 text-xs">Создать</button>
           <button type="button" onClick={() => setIsAddingFolder(false)} className="btn-secondary px-4 py-2 text-xs">Отмена</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentFolders.map(f => (
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={f.id} 
            onClick={() => setCurrentFolderId(f.id)} 
            className="glass-card p-6 flex flex-col justify-between cursor-pointer group h-40"
          >
             <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.02)] flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-500">
                 <FolderIcon className="text-zinc-500 group-hover:text-indigo-400 w-5 h-5 flex-shrink-0 transition-colors" strokeWidth={1.5} />
               </div>
               <button onClick={(e) => deleteFolder(f.id, e)} className="opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-red-500/20 p-2 rounded-full text-zinc-600 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button>
             </div>
             <div className="mt-4">
               <span className="text-sm tracking-wide font-medium text-zinc-300 group-hover:text-white transition-colors truncate block">{f.name}</span>
               <span className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1 block">Папка</span>
             </div>
          </motion.div>
        ))}

        {currentFiles.map(f => (
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={f.id} 
            onClick={() => setEditingFile(f)} 
            className="glass-card p-6 flex flex-col justify-between cursor-pointer group h-40"
          >
             <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.02)] flex items-center justify-center group-hover:bg-sky-500/10 group-hover:border-sky-500/30 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] transition-all duration-500">
                 <File className="text-zinc-500 group-hover:text-sky-400 w-5 h-5 flex-shrink-0 transition-colors" strokeWidth={1.5} />
               </div>
               <button onClick={(e) => deleteFile(f.id, e)} className="opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-red-500/20 p-2 rounded-full text-zinc-600 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button>
             </div>
             <div className="overflow-hidden mt-4">
               <p className="text-sm font-medium truncate text-zinc-300 group-hover:text-white transition-colors">{f.name}</p>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-mono">{f.size}</p>
             </div>
          </motion.div>
        ))}
        {currentFolders.length === 0 && currentFiles.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/10 rounded-[2rem]">
            <FolderIcon className="w-8 h-8 mb-4 opacity-50" strokeWidth={1} />
            <p className="text-sm font-light">Директория пуста</p>
          </div>
        )}
      </div>

      {editingFile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-8">
           <div className="glass-panel w-full max-w-4xl h-[85vh] rounded-[2rem] flex flex-col p-8">
              <div className="flex justify-between items-center pb-6 border-b border-white/[0.05]">
                 <div>
                   <h3 className="text-xl font-serif text-white tracking-wide mb-1">Текстовый Редактор</h3>
                   <p className="text-xs text-zinc-500 font-mono">{editingFile.name}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setEditingFile(null)} className="btn-secondary px-6 py-2.5 text-xs">Закрыть</button>
                    <button onClick={saveFileContent} className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2"><Save className="w-3.5 h-3.5"/> Сохранить Документ</button>
                 </div>
              </div>
              <textarea 
                value={editingFile.content} 
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="flex-grow mt-6 bg-transparent rounded-xl text-sm font-mono text-zinc-300 resize-none outline-none leading-relaxed"
                placeholder="Начните печатать..."
              />
           </div>
        </div>
      )}
    </div>
  );
}
