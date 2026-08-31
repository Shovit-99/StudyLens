import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogOut, Search as SearchIcon, FileText, ChevronDown, Loader2 } from 'lucide-react';

export default function Search() {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
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
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dcece2] relative overflow-x-hidden font-sans text-gray-800 flex flex-col">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-4 max-w-7xl mx-auto flex items-center justify-between w-full">
        <div className="flex items-center gap-12 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/40">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-teal-900">Study<span className="text-teal-600">Lens</span></span>
            <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">beta</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/dashboard" className="hover:text-teal-700">Dashboard</Link>
            <Link to="/search" className="text-teal-700 flex items-center gap-1">Search</Link>
            <a href="#" className="hover:text-teal-700">Analytics</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <div className="px-4 text-sm font-medium text-gray-700">{user?.name || user?.email || 'Loading...'}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
          >
            Logout <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-16 px-4 max-w-5xl mx-auto w-full">
        <div className="w-full max-w-3xl text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
            Search your Knowledge Base
          </h1>
          <p className="text-lg text-gray-600">Find exactly what you're looking for across all your documents.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl mb-12 relative group">
          <div className="absolute inset-0 bg-teal-500/10 rounded-[2rem] blur-xl transition-all group-hover:bg-teal-500/20 z-0"></div>
          <div className="relative z-10 flex items-center bg-white/70 backdrop-blur-xl border border-white/60 p-2 rounded-[2rem] shadow-lg focus-within:ring-4 focus-within:ring-teal-500/20 transition-all">
            <div className="pl-6 pr-4">
              <SearchIcon className="w-6 h-6 text-teal-700" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g. What is the process of photosynthesis?"
              className="flex-1 bg-transparent border-none text-lg text-gray-800 placeholder-gray-400 focus:outline-none py-4"
            />
            <button 
              type="submit" 
              disabled={isSearching || !query.trim()}
              className="bg-teal-700 text-white px-8 py-4 rounded-[1.5rem] font-semibold shadow-md hover:bg-teal-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching</> : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        <div className="w-full max-w-4xl space-y-6 pb-20">
          {isSearching && !results.length && (
            <div className="text-center py-20 text-gray-500 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
              <p>Scanning your documents...</p>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-12 text-center shadow-sm">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No results found</h3>
              <p className="text-gray-500">We couldn't find any matches for "{query}". Try a different keyword.</p>
            </div>
          )}

          {results.map((result, index) => (
            <div key={result.id || index} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 bg-teal-100/50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  {result.page?.document?.title || 'Unknown Document'}
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white/50 px-3 py-1 rounded-full border border-gray-200">
                  Page {result.page?.pageNumber}
                </span>
              </div>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {result.content}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
