import { useState, useEffect } from 'react';
import { X, Upload, Database } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  type: 'mysql' | 'csv';
  dbConfig?: {
    host: string;
    port?: number;
    user: string;
    database: string;
  };
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSaved: () => void;
  token: string | null;
  projectToEdit?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onProjectSaved, token, projectToEdit }: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'mysql' | 'csv'>('mysql');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && projectToEdit) {
      setName(projectToEdit.name);
      setActiveTab(projectToEdit.type);
      if (projectToEdit.type === 'mysql' && projectToEdit.dbConfig) {
        setHost(projectToEdit.dbConfig.host || '');
        setPort(projectToEdit.dbConfig.port?.toString() || '3306');
        setUser(projectToEdit.dbConfig.user || '');
        setDatabase(projectToEdit.dbConfig.database || '');
      }
    } else if (isOpen && !projectToEdit) {
        setName('');
        setHost('');
        setPort('3306');
        setUser('');
        setPassword('');
        setDatabase('');
        setCsvFile(null);
        setActiveTab('mysql');
    }
  }, [isOpen, projectToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      let res;

      if (projectToEdit) {
         const body: { name: string; dbConfig?: { host: string; port: number; user: string; database: string; password?: string } } = { name };
         if (activeTab === 'mysql') {
            body.dbConfig = { 
                host, 
                port: parseInt(port) || 3306,
                user, 
                database 
            };
            if (password) body.dbConfig.password = password;
         }
         
         res = await fetch(`${apiUrl}/api/projects/${projectToEdit._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

      } else {
        if (activeTab === 'mysql') {
            res = await fetch(`${apiUrl}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                type: 'mysql',
                dbConfig: { 
                    host, 
                    port: parseInt(port) || 3306,
                    user, 
                    password, 
                    database 
                }
            })
            });
        } else {
            if (!csvFile) throw new Error("Please select a CSV file");
            
            const formData = new FormData();
            formData.append('name', name);
            formData.append('file', csvFile);

            res = await fetch(`${apiUrl}/api/projects/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
            });
        }
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save project');
      }

      onProjectSaved();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">
            {projectToEdit ? 'Edit Project' : 'New Project'}
        </h2>


        {!projectToEdit && (
            <div className="flex border-b border-zinc-800 mb-6">
            <button
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'mysql' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setActiveTab('mysql')}
            >
                <div className="flex items-center justify-center gap-2">
                <Database className="w-4 h-4" /> MySQL Database
                </div>
            </button>
            <button
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'csv' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setActiveTab('csv')}
            >
                <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> CSV Upload
                </div>
            </button>
            </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="My Awesome Data"
            />
          </div>

          {activeTab === 'mysql' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Host</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="sql_gen_mysql"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="3306"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-xs font-medium text-zinc-400 mb-1">Database Name</label>
                   <input
                     type="text"
                     required
                     value={database}
                     onChange={(e) => setDatabase(e.target.value)}
                     className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                     placeholder="ecommerce"
                   />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">User</label>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="root"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder={projectToEdit ? "(Unchanged)" : "••••••"}
                  />
                </div>
              </div>
            </>
          ) : (
            projectToEdit ? (
                 <div className="p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-400 italic text-center">
                    CSV file cannot be changed. Create a new project to upload a different file.
                 </div>
            ) : (
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">
                    {csvFile ? csvFile.name : "Click to upload CSV"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Max file size 5MB</p>
                </div>
            )
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (projectToEdit ? 'Save Changes' : 'Create Project')}
          </button>
        </form>
      </div>
    </div>
  );
}
