'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Database, Code, 
  Loader2, Terminal, Sparkles, ChevronRight, History, LogOut, Plus,
  Pencil, Trash2, Eye, Star, Table as TableIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProjectModal from '@/components/ProjectModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ChartRenderer from '@/components/ChartRenderer';
import SchemaViewer from '@/components/SchemaViewer';
import { useProjects, Project } from '@/hooks/useProjects';
import { useHistory, HistoryItem } from '@/hooks/useHistory';
import { useChat } from '@/hooks/useChat';
import { useSuggestions } from '@/hooks/useSuggestions';

export default function Home() {
  const { user, token, logout } = useAuth();
  const { 
    projects, 
    fetchProjects, 
    deleteProject 
  } = useProjects();
  
  const { 
    history, 
    fetchHistory, 
    toggleFavorite, 
    deleteHistoryItem 
  } = useHistory();

  const { 
    messages, 
    loading: chatLoading, 
    sessionId, 
    sendMessage, 
    loadSession, 
    clearChat 
  } = useChat();

  const { 
    suggestions, 
    loading: suggestionsLoading, 
    fetchSuggestions, 
    clearSuggestions 
  } = useSuggestions();

  const [input, setInput] = useState('');
   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isChatDeleteModalOpen, setIsChatDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaProjectId, setSchemaProjectId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  useEffect(() => {
    fetchProjects();
    fetchHistory();
  }, [fetchProjects, fetchHistory]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSuggestions(selectedProjectId);
    } else {
      clearSuggestions();
    }
  }, [selectedProjectId, fetchSuggestions, clearSuggestions]);

  useEffect(() => {
    if (messages.length > 0) fetchHistory();
  }, [messages.length, fetchHistory]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId && !sessionId) {
      const timer = setTimeout(() => {
        setSelectedProjectId(projects[0]._id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [projects, selectedProjectId, sessionId]);

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading || !selectedProjectId) return;
    const currentInput = input;
    setInput('');
    await sendMessage(currentInput, selectedProjectId);
  };

  const startNewQuery = () => {
    clearChat();
    setInput('');
    if (selectedProjectId) fetchSuggestions(selectedProjectId);
  };

  const handleLoadHistory = async (item: HistoryItem) => {
    const projectId = await loadSession(item._id);
    if (projectId) setSelectedProjectId(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const success = await deleteProject(projectToDelete);
    if (success) {
      if (selectedProjectId === projectToDelete) {
        setSelectedProjectId(null);
        startNewQuery();
      }
    }
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const success = await deleteHistoryItem(chatToDelete);
    if (success) {
      if (sessionId === chatToDelete) startNewQuery();
      fetchHistory();
    }
    setIsChatDeleteModalOpen(false);
    setChatToDelete(null);
  };

  const handleProjectSaved = () => {
    fetchProjects();
    setProjectToEdit(null);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProjectToDelete(null); }}
        onConfirm={confirmDeleteProject}
        title="Delete Project?"
        message="Are you sure you want to delete this project? All associated chats and history will be permanently removed. This action cannot be undone."
      />
      <ConfirmationModal
        isOpen={isChatDeleteModalOpen}
        onClose={() => { setIsChatDeleteModalOpen(false); setChatToDelete(null); }}
        onConfirm={confirmDeleteChat}
        title="Delete Chat?"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
      />
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => { setIsProjectModalOpen(false); setProjectToEdit(null); }}
        onProjectSaved={handleProjectSaved}
        token={token}
        projectToEdit={projectToEdit}
      />
      <SchemaViewer
        isOpen={isSchemaModalOpen}
        onClose={() => { setIsSchemaModalOpen(false); setSchemaProjectId(null); }}
        projectId={schemaProjectId}
        token={token}
      />
      
      <aside className="w-[280px] bg-zinc-900/50 border-r border-zinc-800 hidden md:flex flex-col backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-zinc-100">DataPilot AI</span>
          </div>

          {user && (
            <div className="mb-6 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Signed in as</span>
                <span className="text-sm font-medium text-zinc-300 truncate max-w-[140px]">{user.email}</span>
              </div>
              <button onClick={logout} className="p-1.5 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">
              <span>Project</span>
              <button 
                onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                className="hover:text-indigo-400"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map(p => (
                <div key={p._id} className="group relative">
                  <button
                    onClick={() => { setSelectedProjectId(p._id); startNewQuery(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate flex items-center gap-2 pr-16 ${selectedProjectId === p._id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <Database className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSchemaProjectId(p._id); setIsSchemaModalOpen(true); }}
                      className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-700/50 rounded-md"
                      title="View Schema"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setProjectToEdit(p); setIsProjectModalOpen(true); }}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-md"
                      title="Edit Project"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setProjectToDelete(p._id); setIsDeleteModalOpen(true); }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <button 
                  onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                  className="w-full text-left px-3 py-3 rounded-lg border border-dashed border-zinc-700 text-zinc-500 text-xs hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  + Create first project
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={startNewQuery}
            className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            New Query
          </button>
        </div>
        
        <div className="flex-1 px-4 overflow-y-auto">
           <div className="flex items-center gap-2 px-2 mb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
             <History className="w-3 h-3" />
             History
           </div>
           <div className="space-y-1">
              {history.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => handleLoadHistory(item)}
                  className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate flex items-center justify-between cursor-pointer ${sessionId === item._id ? 'bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <span className="truncate flex-1">{item.title || "Untitled Chat"}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item._id); }}
                        className={`p-1 rounded hover:bg-zinc-700 ${item.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                     >
                        <Star className={`w-3 h-3 ${item.isFavorite ? 'fill-current' : ''}`} />
                     </button>
                     <button
                        onClick={(e) => { e.stopPropagation(); setChatToDelete(item._id); setIsChatDeleteModalOpen(true); }}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400"
                     >
                        <Trash2 className="w-3 h-3" />
                     </button>
                  </div>
                </div>
              ))}
             {history.length === 0 && (
               <div className="px-3 py-2 text-sm text-zinc-600 italic">No history yet.</div>
             )}
           </div>
        </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2">
           <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] ${selectedProject ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
           <div className="text-xs font-medium text-zinc-400">
              {selectedProject ? `Connected to ${selectedProject.name}` : 'No Project Selected'}
           </div>
        </div>
      </div>
    </aside>

    <main className="flex-1 flex flex-col relative w-full max-w-full bg-zinc-950">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth relative">
        
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
              <Terminal className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
              {selectedProject ? `Querying ${selectedProject.name}` : "Select a Project"}
            </h2>
            <p className="text-zinc-400 mb-10 max-w-md text-lg">
               {selectedProject ? "I can generate SQL queries and visualize data for you." : "Please create or select a project from the sidebar to start."}
            </p>
            
            {selectedProject && (
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                {suggestionsLoading ? (
                   <div className="p-4 text-center text-zinc-500 text-sm animate-pulse">
                      Generating suggestions...
                   </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((q, i) => (
                    <button 
                      key={i} 
                      onClick={() => setInput(q)}
                      className="group p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white text-left transition-all flex items-center justify-between"
                    >
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </button>
                  ))
                ) : (
                   <div className="text-center text-zinc-500 text-sm">
                      No suggestions available.
                   </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 pb-4 relative z-10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
                
                {msg.role === 'user' ? (
                  <div className="max-w-lg bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-zinc-300">Data Assistant</span>
                    </div>

                    {msg.sql && (
                      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                            <Code className="w-3 h-3" />
                            SQL QUERY
                          </div>
                        </div>
                        <pre className="p-4 text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                          {msg.sql}
                        </pre>
                      </div>
                    )}

                    {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                      <div className="space-y-4">
                        <ChartRenderer data={msg.data} />

                        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 shadow-sm">
                           <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 text-xs font-mono text-zinc-500">
                             <TableIcon className="w-3 h-3" />
                             RESULTS
                           </div>
                           <div className="overflow-auto max-h-[400px] border border-zinc-800 rounded-lg">
                             <table className="w-full text-sm text-left border-collapse">
                               <thead className="bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
                                 <tr>
                                   {Array.isArray(msg.data[0]) 
                                     ? msg.data[0].map((_, i) => <th key={i} className="px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-800">Col {i+1}</th>)
                                     : Object.keys(msg.data[0] as object).map((key) => (
                                         <th key={key} className="px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-800 uppercase tracking-wider">{key}</th>
                                       ))
                                   }
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-zinc-800/50">
                                 {msg.data.map((row, i) => (
                                   <tr key={i} className="group hover:bg-zinc-800/30 transition-colors">
                                     {Array.isArray(row) ? row.map((cell, j) => (
                                       <td key={j} className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                                         {String(cell)}
                                       </td>
                                     )) : (
                                        Object.values(row as object).map((cell, j) => (
                                          <td key={j} className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                                            {String(cell)}
                                          </td>
                                        ))
                                     )}
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {chatLoading && (
               <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 w-fit animate-pulse">
                 <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                 <span className="text-sm text-zinc-400">Thinking...</span>
               </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="p-6 relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className={`relative flex items-center bg-zinc-900 rounded-2xl border transition-all duration-200 shadow-2xl ${chatLoading ? 'border-zinc-800 opacity-50' : 'border-zinc-800 hover:border-zinc-700 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20'}`}>
            <div className="pl-4">
               <Terminal className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={chatLoading || !selectedProjectId}
              placeholder={selectedProjectId ? "Ask me anything regarding your database..." : "Select a project to start chatting"}
              className="flex-1 bg-transparent px-4 py-4 text-white placeholder-zinc-500 focus:outline-none text-[15px]"
            />
            <div className="pr-2">
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !input.trim() || !selectedProjectId}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer shadow-lg shadow-indigo-900/20 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
  );
}
