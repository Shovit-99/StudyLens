import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Book, LayoutDashboard, Brain, BookOpen, LogOut, CheckCircle2, Clock, Upload, FileText, Trash2, Edit2, X, Save, Send, Bot, Maximize2, Minimize2, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import QuizModal from '../components/QuizModal';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Data will be fetched dynamically



export default function Dashboard() {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [expandedPanel, setExpandedPanel] = useState<'notes' | 'ai' | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', content: string, sources?: number[]}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, chartData: [] });
  const [showArchived, setShowArchived] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get('docId');
    if (docId && docId !== selectedDocumentId) {
      handleDocumentClick(docId);
    }
  }, [location.search]);

  const fetchDocuments = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/documents?subjectId=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  // Poll for document status updates if any document is processing
  useEffect(() => {
    if (!selectedSubjectId) return;
    const hasProcessing = documents.some(doc => doc.status === 'PROCESSING');
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocuments(selectedSubjectId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, selectedSubjectId]);

  const fetchSubjects = async (isArchived: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`/api/subjects?archived=${isArchived}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubjects(showArchived);
    }
  }, [showArchived, user]);

  const toggleArchiveSubject = async (subjectId: string, isArchived: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/subjects/${subjectId}/archive`, { isArchived }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubjects(showArchived);
      if (selectedSubjectId === subjectId) {
        setSelectedSubjectId(null);
        setSelectedDocumentId(null);
        setDocuments([]);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedDocumentId(null);
    setDocumentDetails(null);
    fetchDocuments(subjectId);
  };

  const handleDocumentClick = async (docId: string) => {
    setSelectedDocumentId(docId);
    setDocumentDetails(null);
    setChatMessages([]);
    setExpandedPanel(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocumentDetails(res.data);
      setNewTitle(res.data.title);
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateTitle = async () => {
    if (!selectedDocumentId || !newTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/documents/${selectedDocumentId}`, { title: newTitle }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocumentDetails({ ...documentDetails, title: newTitle });
      setIsEditingTitle(false);
      // Refresh documents list if viewing a subject
      if (selectedSubjectId) fetchDocuments(selectedSubjectId);
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocumentId) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/documents/${selectedDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedDocumentId(null);
      setDocumentDetails(null);
      if (selectedSubjectId) fetchDocuments(selectedSubjectId);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);

        // Fetch subjects
        const subjectsRes = await axios.get(`/api/subjects?archived=${showArchived}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(subjectsRes.data);

        // Fetch weekly stats
        const statsRes = await axios.get('/api/documents/stats/weekly', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchUserAndData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).subjectName.value;
    if(!name) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/subjects', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects([res.data, ...subjects]);
      (e.target as any).reset();
    } catch(err) {
      console.error(err);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedDocumentId) return;
    
    const query = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/chat', 
        { query, documentId: selectedDocumentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages(prev => [...prev, { role: 'ai', content: res.data.answer, sources: res.data.sources }]);
    } catch(err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please make sure your Groq API key is valid.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileUpload = async (subjectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
    formData.append('subjectId', subjectId);
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/documents', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setToastMessage({ title: `Successfully uploaded ${file.name}!`, type: 'success' });
      if (selectedSubjectId === subjectId) {
        fetchDocuments(subjectId);
      }
    } catch(err) {
      console.error(err);
      setToastMessage({ title: 'Failed to upload document.', type: 'error' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dcece2] relative overflow-x-hidden font-sans text-slate-800">
      {/* Background Blobs for Glassmorphic Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-12 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/40">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="StudyLens" className="h-16 w-auto scale-125 origin-left" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/dashboard" className="text-teal-700 flex items-center gap-1">Dashboard</Link>
            <Link to="/search" className="hover:text-teal-700">Search</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <div className="px-4 text-sm font-medium text-gray-700">{user.name || user.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
          >
            Logout <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-12 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 max-w-3xl leading-[1.15]">
          Organize your knowledge with <span className="text-teal-600">intelligent notes.</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-2xl leading-relaxed">
          Upload your lectures, automatically extract text, and use AI to generate summaries and find answers instantly.
        </p>

        {/* Dashboard Panels */}
        {/* Dashboard Panels */}
        {/* Dashboard Panels */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative h-[700px]">
          {/* Left Panel: Subject Dashboard */}
          <div className="lg:col-span-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 shadow-sm flex flex-col text-left">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-teal-600"/>
                </div>
                <h2 className="font-semibold text-[15px] text-slate-900">Notebooks</h2>
              </div>
              <div className="flex gap-1 bg-slate-100/80 p-1 rounded-md text-[11px] font-semibold tracking-wide uppercase">
                <button onClick={() => setShowArchived(false)} className={`px-2.5 py-1 rounded transition-colors ${!showArchived ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Live</button>
                <button onClick={() => setShowArchived(true)} className={`px-2.5 py-1 rounded transition-colors ${showArchived ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Archived</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
              {/* Form to add a subject quickly */}
              {!showArchived && (
                <form onSubmit={createSubject} className="flex items-center gap-2 mb-6">
                  <input 
                    type="text" 
                    name="subjectName"
                    placeholder="New Subject..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg shadow-sm hover:bg-teal-600 transition-colors">
                    <Upload className="w-4 h-4"/>
                  </button>
                </form>
              )}

              {/* Dynamic Subjects List */}
              <div className="space-y-1.5">
                {subjects.length > 0 ? (
                  subjects.map((sub) => (
                    <div key={sub.id} onClick={() => handleSubjectClick(sub.id)} className={`flex items-center justify-between group px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${selectedSubjectId === sub.id ? 'bg-teal-50/50 border-teal-200/60 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <BookOpen className={`w-4 h-4 ${selectedSubjectId === sub.id ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`text-[14px] font-medium transition-colors ${selectedSubjectId === sub.id ? 'text-teal-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleArchiveSubject(sub.id, !showArchived); }} className="cursor-pointer text-[11px] font-semibold tracking-wide uppercase text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                          {showArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <label onClick={(e) => e.stopPropagation()} className="cursor-pointer text-[11px] font-semibold tracking-wide uppercase text-slate-500 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Upload className="w-3 h-3"/> Upload
                          <input type="file" className="hidden" accept=".pdf,.pptx" onChange={(e) => handleFileUpload(sub.id, e)} />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-slate-400 text-center py-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    No subjects yet. Create one above!
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-teal-600"/>
                <span className="font-semibold text-[13px] text-slate-700">AI Assistant</span>
              </div>
              <button 
                onClick={() => {
                  setAiEnabled(!aiEnabled);
                  if (aiEnabled && expandedPanel === 'ai') setExpandedPanel(null);
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${aiEnabled ? 'bg-teal-500' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${aiEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
              </button>
            </div>
          </div>

          {/* Right Panel: Analytics or Documents */}
          <div className="lg:col-span-8 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-sm text-left flex flex-col overflow-hidden relative">
            {!selectedSubjectId ? (
              <div className="p-8">
                <div className="flex items-start justify-between mb-10 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <BarChart className="w-6 h-6 text-slate-700"/>
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-slate-900 leading-tight">Weekly Activity</h2>
                      <p className="text-[14px] text-slate-500 mt-1">Total documents processed: <span className="font-semibold text-slate-700">{stats.total}</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} allowDecimals={false} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}}
                      />
                      <Bar dataKey="active" stackId="a" radius={[4, 4, 0, 0]}>
                        {stats.chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.isToday ? '#0f766e' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : selectedDocumentId && documentDetails ? (
              <div className="flex flex-col h-full relative">
                {/* Sticky Header for Reader View */}
                <div className="sticky top-0 z-10 bg-white/40 backdrop-blur-xl border-b border-white/50 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-teal-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={newTitle} 
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-white border border-teal-500 rounded-md px-2.5 py-1 text-[15px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-full max-w-sm shadow-sm"
                            autoFocus
                          />
                          <button onClick={handleUpdateTitle} className="p-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setIsEditingTitle(false); setNewTitle(documentDetails.title); }} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h2 className="font-bold text-[17px] text-slate-900 truncate" title={documentDetails.title}>
                            {documentDetails.title}
                          </h2>
                          <button onClick={() => setIsEditingTitle(true)} className="p-1 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(documentDetails.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{(documentDetails.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <button 
                      onClick={() => setIsQuizOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-white bg-teal-600 shadow-md shadow-teal-500/20 hover:bg-teal-700 hover:shadow-teal-500/30 rounded-full transition-all"
                    >
                      <GraduationCap className="w-4 h-4" /> Quiz Me!
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    <button onClick={handleDeleteDocument} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <button onClick={() => setSelectedDocumentId(null)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors px-2">
                      Close
                    </button>
                  </div>
                </div>

                {/* Content Area: Reader + Optional Chat */}
                <div className="flex-1 flex overflow-hidden">
                  {(expandedPanel === null || expandedPanel === 'notes') && (
                    <div ref={pdfContainerRef} className={`overflow-hidden relative ${aiEnabled && expandedPanel === null ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
                      {documentDetails.file_path ? (
                        documentDetails.file_type === 'application/pdf' ? (
                          <>
                            <iframe 
                              src={`${axios.defaults.baseURL || ''}/uploads/${documentDetails.file_path.split(/[\\/]/).pop()}#toolbar=0&navpanes=0&view=FitH`}
                              className="w-full h-full bg-slate-100/50"
                              title={documentDetails.title}
                            />
                            <button 
                              onClick={() => setExpandedPanel(expandedPanel === 'notes' ? null : 'notes')}
                              className="absolute bottom-4 right-4 p-2.5 bg-white border border-slate-200 shadow-lg rounded-full text-slate-500 hover:text-teal-600 hover:bg-slate-50 transition-colors z-10"
                              title={expandedPanel === 'notes' ? "Restore Panel" : "Maximize Panel"}
                            >
                              {expandedPanel === 'notes' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                              <FileText className="w-8 h-8 text-teal-600" />
                            </div>
                            <h3 className="text-slate-900 font-semibold mb-1">Presentation Uploaded</h3>
                            <p className="text-[14px] text-slate-500 max-w-xs mx-auto">The text from this presentation has been successfully extracted for AI search. Visual preview is not available for presentations.</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                            <FileText className="w-8 h-8 text-slate-300" />
                          </div>
                          <h3 className="text-slate-900 font-semibold mb-1">Document Unavailable</h3>
                          <p className="text-[14px] text-slate-500">The file could not be found.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Chat Panel */}
                  {aiEnabled && (expandedPanel === null || expandedPanel === 'ai') && (
                    <div className={`flex flex-col bg-slate-50 relative ${expandedPanel === null ? 'w-1/2' : 'w-full'}`}>
                      <button 
                        onClick={() => setExpandedPanel(expandedPanel === 'ai' ? null : 'ai')}
                        className="absolute top-4 right-4 p-2.5 bg-white border border-slate-200 shadow-lg rounded-full text-slate-500 hover:text-teal-600 hover:bg-slate-50 transition-colors z-20"
                        title={expandedPanel === 'ai' ? "Restore Panel" : "Maximize Panel"}
                      >
                        {expandedPanel === 'ai' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>

                      <div className="absolute inset-0 bg-[#dcece2]/20 mix-blend-multiply pointer-events-none"></div>
                      <div className="flex-1 overflow-y-auto p-6 pt-16 space-y-4 custom-scrollbar relative z-10">
                        {chatMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <Brain className="w-12 h-12 mb-3 text-teal-600/40" />
                            <p className="font-medium text-[15px] text-slate-700">Ask anything about this document!</p>
                            <p className="text-[13px] mt-1 text-slate-500">Groq will search your notes and generate a lightning-fast answer.</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 shadow-sm"><Bot className="w-4 h-4 text-teal-600"/></div>}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm flex flex-col ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                  {msg.role === 'ai' ? (
                                    <div className="markdown-body">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                          strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                          code: ({node, inline, ...props}: any) => 
                                            inline 
                                              ? <code className="bg-slate-100 text-teal-800 px-1.5 py-0.5 rounded font-mono text-[13px]" {...props} />
                                              : <div className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto font-mono text-[13px] my-2 leading-relaxed"><code {...props} /></div>,
                                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 text-slate-900" {...props} />,
                                          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                          h3: ({node, ...props}) => <h3 className="text-[15px] font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                          li: ({node, ...props}) => <li className="pl-1" {...props} />
                                        }}
                                      >
                                        {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                  )}
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100/50">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider self-center mr-1">Sources:</span>
                                    {msg.sources.map(page => (
                                      <span key={page} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors" title={`Go to page ${page}`}>
                                        📄 Page {page}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        {isChatLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-teal-600"/></div>
                            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-slate-200 shadow-sm rounded-bl-none flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-75"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-white border-t border-slate-200 relative z-10">
                        <form onSubmit={handleChatSubmit} className="flex gap-2 relative">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask a question..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
                            disabled={isChatLoading}
                          />
                          <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:hover:bg-teal-600 shadow-sm">
                            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]"/>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

                <QuizModal 
                  isOpen={isQuizOpen} 
                  onClose={() => setIsQuizOpen(false)} 
                  documentId={selectedDocumentId} 
                  documentTitle={documentDetails.title}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="px-8 py-6 border-b border-white/50 flex items-center justify-between sticky top-0 bg-white/40 backdrop-blur-xl z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-teal-600"/>
                    </div>
                    <div>
                      <h2 className="font-bold text-[17px] text-slate-900 leading-tight">
                        {subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject Documents'}
                      </h2>
                      <p className="text-[13px] font-medium text-slate-500 mt-0.5">{documents.length} document{documents.length !== 1 && 's'} found</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSubjectId(null)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors px-2">
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {documents.length > 0 ? (
                      documents.map(doc => (
                        <div 
                          key={doc.id} 
                          onClick={() => handleDocumentClick(doc.id)}
                          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                              <Book className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors"/>
                            </div>
                            {doc.status === 'COMPLETED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Ready</span>
                            ) : doc.status === 'PROCESSING' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><Clock className="w-3 h-3"/> Process</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-50 text-red-700 border border-red-100">Failed</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-[15px] group-hover:text-teal-700 transition-colors line-clamp-1">{doc.title}</h3>
                            <p className="text-[12px] font-medium text-slate-400 mt-1">{new Date(doc.createdAt).toLocaleDateString()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                          <Upload className="w-8 h-8 text-slate-300"/>
                        </div>
                        <h3 className="text-slate-900 font-semibold mb-1">No documents found</h3>
                        <p className="text-[14px] text-slate-500">Upload a PDF or PPTX to get started!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        } transition-all duration-300`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-600" />}
          <p className="text-[14px] font-semibold">{toastMessage.title}</p>
        </div>
      )}
    </div>
  );
}
