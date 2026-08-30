import { Link } from 'react-router-dom';
import { Book, LayoutDashboard, Brain, BookOpen, User as UserIcon, CheckCircle2, Clock, ArrowRight, ChevronDown } from 'lucide-react';
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#dcece2] relative overflow-hidden font-sans text-gray-800">
      {/* Background Blobs for Glassmorphic Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-4 max-w-7xl mx-auto flex items-center justify-between mt-4">
        <div className="flex items-center gap-12 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-teal-900">nexus <span className="font-normal text-gray-500 text-base">for study</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-teal-700 flex items-center gap-1">Models <ChevronDown className="w-3 h-3"/></a>
            <a href="#" className="hover:text-teal-700">Marketplace</a>
            <a href="#" className="hover:text-teal-700">Docs</a>
            <a href="#" className="hover:text-teal-700">API</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Link to="/login" className="px-4 text-sm font-medium text-gray-700 hover:text-teal-900 transition-colors">Sign Up</Link>
          <Link
            to="/register"
            className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-md"
          >
            Deploy Agent
          </Link>
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
          <Link to="/login" className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            Start Learning
          </Link>
          <button className="bg-white/30 backdrop-blur-md border border-white/50 text-gray-800 px-8 py-4 rounded-full font-semibold hover:bg-white/40 transition-all shadow-sm">
            Study Library
          </button>
        </div>

        {/* Dashboard Glassmorphic Panels */}
        <div className="mt-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative max-w-5xl mx-auto">
          {/* Background Decorative Graphic (Replacing the 3D book) */}
          <div className="absolute top-[-70%] right-[-15%] w-[80%] h-[180%] opacity-30 pointer-events-none flex items-center justify-center z-[-1]">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-emerald-600 animate-[spin_120s_linear_infinite]">
              <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,96.4,-2.8C96,12.5,89.1,27.3,79.5,40.1C70,52.8,57.7,63.5,43.6,71.4C29.4,79.3,13.4,84.4,-1.8,87.4C-17.1,90.5,-31.6,91.4,-44.6,85.6C-57.6,79.8,-69.2,67.3,-78.2,53C-87.2,38.7,-93.6,22.6,-94.1,6C-94.6,-10.6,-89.2,-27.7,-79.8,-41.6C-70.4,-55.5,-57,-66.2,-42.6,-73.2C-28.2,-80.1,-12.8,-83.4,1.8,-86.5C16.4,-89.6,30.5,-83.5,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
            </svg>
          </div>

          {/* Left Panel: Subject Dashboard */}
          <div className="lg:col-span-5 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-col text-left relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm border border-white/40">
                  <Book className="w-5 h-5 text-teal-700"/>
                </div>
                <h2 className="font-semibold text-lg text-gray-800">Notebook Dashboard</h2>
              </div>
              <div className="flex gap-2 bg-white/40 rounded-lg p-1 text-xs font-medium border border-white/30">
                <button className="bg-white shadow-sm px-3 py-1 rounded-md text-gray-800">Live</button>
                <button className="px-3 py-1 text-gray-500 hover:text-gray-700">Archived</button>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              {[
                { name: 'Computer Science', status: 'Active', color: 'emerald' },
                { name: 'History', status: 'Processing Summary', color: 'gray' },
                { name: 'Physics', status: 'In Review', color: 'gray' },
                { name: 'Literature', status: 'Queued for Quizzes', color: 'gray' },
              ].map((sub, index) => (
                <div key={sub.name} className="flex items-center justify-between group p-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{sub.name}</span>
                  </div>
                  {index === 0 ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {sub.status}</span>
                  ) : (
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">{sub.status}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/40 flex items-center justify-between">
              <span className="font-medium text-sm text-gray-700">AI Summary Generator</span>
              <button className="w-11 h-6 rounded-full p-1 transition-colors bg-teal-500 flex items-center">
                <div className="w-4 h-4 rounded-full bg-white translate-x-5"></div>
              </button>
            </div>
          </div>

          {/* Right Panel: Analytics */}
          <div className="lg:col-span-7 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] text-left flex flex-col relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100/50 border border-teal-200/50 flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-teal-800">Q-4</span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-gray-800 leading-tight">Weekly Study Engagement & Note Creation</h2>
                  <p className="text-sm text-gray-500 mt-1">Total Resources Created: <span className="font-semibold text-gray-900">12.4M</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] mt-4 relative">
               <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md border border-white/50 rounded-xl p-3 shadow-lg text-xs font-medium space-y-2">
                 <div className="flex justify-between gap-4">
                    <span className="text-gray-600 flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-gray-300"></span> Summaries (GPT-4)</span>
                    <span className="text-gray-900">2.1M</span>
                 </div>
                 <div className="flex justify-between gap-4">
                    <span className="text-gray-600 flex items-center gap-2"><span className="w-2 h-2 rounded-sm border border-gray-400"></span> Flashcards (Llama 3)</span>
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
                    contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
          </div>
        </div>
      </main>
    </div>
  );
}
