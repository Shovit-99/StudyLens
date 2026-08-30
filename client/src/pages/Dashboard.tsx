import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Book, LayoutDashboard, Brain, BookOpen, User as UserIcon, LogOut, ChevronDown, CheckCircle2, Clock, Upload, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', active: 1.2, secondary: 0.8 },
  { name: 'Tue', active: 1.8, secondary: 1.2 },
  { name: 'Wed', active: 1.5, secondary: 1.0 },
  { name: 'Thu', active: 3.8, secondary: 2.1 },
  { name: 'Fri', active: 1.1, secondary: 0.7 },
  { name: 'Sat', active: 0.9, secondary: 0.5 },
  { name: 'Sun', active: 1.0, secondary: 0.6 },
];

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const navigate = useNavigate();

  const fetchDocuments = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/documents?subjectId=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    fetchDocuments(subjectId);
  };

  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userRes = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);

        // Fetch subjects
        const subjectsRes = await axios.get('http://localhost:5000/api/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(subjectsRes.data);
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
      const res = await axios.post('http://localhost:5000/api/subjects', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects([res.data, ...subjects]);
      (e.target as any).reset();
    } catch(err) {
      console.error(err);
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
      await axios.post('http://localhost:5000/api/documents', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`Successfully uploaded ${file.name}!`);
      if (selectedSubjectId === subjectId) {
        fetchDocuments(subjectId);
      }
    } catch(err) {
      console.error(err);
      alert('Failed to upload document.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#dcece2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dcece2] relative overflow-hidden font-sans text-gray-800">
      {/* Background Blobs for Glassmorphic Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-12 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-teal-900">Study<span className="text-teal-600">Lens</span></span>
            <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-teal-700 flex items-center gap-1">Dashboard <ChevronDown className="w-3 h-3"/></a>
            <a href="#" className="hover:text-teal-700">Subjects</a>
            <a href="#" className="hover:text-teal-700">Documents</a>
            <a href="#" className="hover:text-teal-700">Analytics</a>
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-12 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-gray-900 mb-6 max-w-4xl leading-[1.1]">
          Organize Your Knowledge Journey with <span className="text-teal-900">Intelligent Notes</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
          Build, connect, and analyze your lecture notes. Leverage AI to create summaries, quizzes, and personalized study paths.
        </p>
        <div className="flex items-center gap-4">
          <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            Start Learning <ArrowRight className="w-5 h-5"/>
          </button>
          <button className="bg-white/30 backdrop-blur-md border border-white/50 text-gray-800 px-8 py-4 rounded-full font-semibold hover:bg-white/40 transition-all shadow-sm">
            Study Library
          </button>
        </div>

        {/* Dashboard Glassmorphic Panels */}
        <div className="mt-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* Left Panel: Subject Dashboard */}
          <div className="lg:col-span-5 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-col text-left">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-5 h-5 text-teal-700"/>
                </div>
                <h2 className="font-semibold text-lg">Notebook Dashboard</h2>
              </div>
              <div className="flex gap-2 bg-white/40 rounded-lg p-1 text-xs font-medium">
                <button className="bg-white shadow-sm px-3 py-1 rounded-md text-gray-800">Live</button>
                <button className="px-3 py-1 text-gray-500 hover:text-gray-700">Archived</button>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              {/* Form to add a subject quickly */}
              <form onSubmit={createSubject} className="flex items-center gap-2 mb-6">
                <input 
                  type="text" 
                  name="subjectName"
                  placeholder="New Subject..." 
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <button type="submit" className="bg-teal-600 text-white p-2 rounded-xl shadow-sm hover:bg-teal-700">
                  <Upload className="w-4 h-4"/>
                </button>
              </form>

              {/* Dynamic Subjects List */}
              {subjects.length > 0 ? (
                subjects.map((sub, index) => (
                  <div key={sub.id} onClick={() => handleSubjectClick(sub.id)} className={`flex items-center justify-between group p-2 rounded-xl transition-colors cursor-pointer ${selectedSubjectId === sub.id ? 'bg-white/50 border border-teal-200 shadow-sm' : 'hover:bg-white/30'}`}>
                    <div className="flex items-center gap-3">
                      <BookOpen className={`w-4 h-4 ${selectedSubjectId === sub.id ? 'text-teal-600' : 'text-gray-500'}`} />
                      <span className="font-medium text-gray-700 group-hover:text-teal-900 transition-colors">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label onClick={(e) => e.stopPropagation()} className="cursor-pointer text-xs font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg">
                        <Upload className="w-3 h-3"/> PDF
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(sub.id, e)} />
                      </label>
                      {index === 0 ? (
                         <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 w-24 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>
                      ) : index === 1 ? (
                         <span className="text-xs font-medium text-amber-600 flex items-center gap-1 w-24 justify-end"><Clock className="w-3 h-3"/> Processing</span>
                      ) : (
                         <span className="text-xs font-medium text-gray-500 flex items-center gap-1 w-24 justify-end"><CheckCircle2 className="w-3 h-3"/> In Review</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4 bg-white/20 rounded-xl border border-dashed border-gray-400">
                  No subjects yet. Add one above!
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-white/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-teal-700"/>
                <span className="font-medium text-sm">AI Summary Generator</span>
              </div>
              <button 
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${aiEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          {/* Right Panel: Analytics or Documents */}
          <div className="lg:col-span-7 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] text-left flex flex-col">
            {!selectedSubjectId ? (
              <>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-teal-800">Q-4</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">Weekly Study Engagement &amp; Note Creation</h2>
                      <p className="text-sm text-gray-500 mt-1">Total Resources Created: <span className="font-semibold text-gray-800">12.4M</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[300px] mt-4 relative">
                  <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur border border-white rounded-xl p-3 shadow-lg text-xs font-medium space-y-2">
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-600 flex items-center gap-1"><Book className="w-3 h-3"/> Summaries (GPT-4)</span>
                        <span className="text-gray-900">2.1M</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-600 flex items-center gap-1"><Brain className="w-3 h-3"/> Flashcards (Llama 3)</span>
                        <span className="text-gray-900">1.8M</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `${val}M`} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.4)'}} 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="secondary" stackId="a" fill="#e5e7eb" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="active" stackId="a" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                          <cell key={`cell-${index}`} fill={entry.name === 'Thu' ? '#10b981' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-5 h-5 text-emerald-700"/>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">
                        {subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject Documents'}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">{documents.length} document{documents.length !== 1 && 's'} found</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSubjectId(null)} className="text-sm text-gray-500 hover:text-gray-800 bg-white/50 px-3 py-1.5 rounded-lg border border-white/60 shadow-sm transition-colors">
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {documents.length > 0 ? (
                    documents.map(doc => (
                      <div key={doc.id} className="bg-white/60 border border-white/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Book className="w-4 h-4 text-teal-700"/>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm">{doc.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.createdAt).toLocaleDateString()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === 'COMPLETED' ? (
                            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">Processed</span>
                          ) : doc.status === 'PROCESSING' ? (
                            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 flex items-center gap-1"><Clock className="w-3 h-3"/> Extracting...</span>
                          ) : (
                            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200">{doc.status}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3">
                      <Upload className="w-10 h-10 text-gray-300"/>
                      <p>No documents uploaded yet.<br/>Upload a PDF on the left panel to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
