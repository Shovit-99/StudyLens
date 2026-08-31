import { Link } from 'react-router-dom';
import { Book, LayoutDashboard, Brain, BookOpen, User as UserIcon, CheckCircle2, Clock, ArrowRight, ChevronDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    <div className="min-h-screen bg-[#dcece2] relative overflow-x-hidden font-sans text-gray-800">
      {/* Background Blobs for Glassmorphic Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply"></div>

      {/* Navigation */}
      <nav className="relative z-50 p-4 max-w-7xl mx-auto flex items-center justify-between mt-4">
        <div className="flex items-center gap-12 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/40">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-1.5 rounded-lg text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-teal-900">Study<span className="text-teal-600">Lens</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-teal-700 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-teal-700 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-teal-700 transition-colors">FAQ</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Link to="/login" className="px-4 text-sm font-medium text-gray-700 hover:text-teal-900 transition-colors">Log In</Link>
          <Link
            to="/register"
            className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-md"
          >
            Sign Up
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
        <div className="flex items-center gap-4 z-10 relative">
          <Link to="/login" className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            Start Learning
          </Link>
        </div>

        {/* Hero Background Decorative Graphic */}
        <div className="absolute top-0 left-0 w-full h-[60vh] opacity-[0.25] pointer-events-none z-[-1] overflow-hidden">
          <div className="relative w-full h-full max-w-7xl mx-auto">
            <BookOpen className="absolute top-[15%] left-[5%] w-32 h-32 text-teal-600 rotate-[-15deg] mix-blend-multiply animate-[pulse_6s_infinite]" />
            <FileText className="absolute bottom-[20%] left-[10%] w-24 h-24 text-emerald-600 rotate-[25deg] mix-blend-multiply animate-[pulse_8s_infinite]" />
            <Brain className="absolute top-[10%] right-[5%] w-40 h-40 text-teal-800 rotate-[10deg] mix-blend-multiply animate-[pulse_7s_infinite]" />
            <Book className="absolute bottom-[30%] right-[12%] w-28 h-28 text-teal-500 rotate-[-20deg] mix-blend-multiply animate-[pulse_9s_infinite]" />
          </div>
        </div>

        {/* Dashboard Glassmorphic Panels */}
        <div className="mt-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative max-w-5xl mx-auto z-10">

          {/* Left Panel: Recent Uploads */}
          <div className="lg:col-span-5 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-col text-left relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm border border-white/40">
                  <FileText className="w-5 h-5 text-teal-700"/>
                </div>
                <h2 className="font-semibold text-lg text-gray-800">Recent Uploads</h2>
              </div>
              <div className="flex gap-2 bg-white/40 rounded-lg p-1 text-xs font-medium border border-white/30">
                <button className="bg-white shadow-sm px-3 py-1 rounded-md text-gray-800">All</button>
                <button className="px-3 py-1 text-gray-500 hover:text-gray-700">PDFs</button>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              {[
                { name: 'Machine_Learning_Ch4.pdf', status: 'Indexed for Search', color: 'emerald' },
                { name: 'World_History_Midterm.pptx', status: 'Chunking Text...', color: 'gray' },
                { name: 'Bio_Cell_Structure.pdf', status: 'Extracting...', color: 'gray' },
                { name: 'Calculus_Notes_Week3.pdf', status: 'Queued', color: 'gray' },
              ].map((sub, index) => (
                <div key={sub.name} className="flex items-center justify-between group p-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 truncate">{sub.name}</span>
                  </div>
                  {index === 0 ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 flex-shrink-0 pl-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {sub.status}</span>
                  ) : (
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1 flex-shrink-0 pl-2">{sub.status}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/40 flex items-center justify-between">
              <span className="font-medium text-sm text-gray-700">Auto-Generate Vector Embeddings</span>
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
                  <Brain className="w-5 h-5 text-teal-800" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-gray-800 leading-tight">StudyLens Knowledge Base Activity</h2>
                  <p className="text-sm text-gray-500 mt-1">Total Vector Chunks Indexed: <span className="font-semibold text-gray-900">4,521</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] mt-4 relative">
               <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md border border-white/50 rounded-xl p-3 shadow-lg text-xs font-medium space-y-2">
                 <div className="flex justify-between gap-4">
                    <span className="text-gray-600 flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-gray-300"></span> Semantic Searches</span>
                    <span className="text-gray-900">342</span>
                 </div>
                 <div className="flex justify-between gap-4">
                    <span className="text-gray-600 flex items-center gap-2"><span className="w-2 h-2 rounded-sm border border-gray-400"></span> RAG Answers Generated</span>
                    <span className="text-gray-900">128</span>
                 </div>
               </div>

               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.4)'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="secondary" stackId="a" fill="#e5e7eb" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="active" stackId="a" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Thu' ? '#10b981' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Placeholder Sections for Navigation */}
        <section id="features" className="mt-32 w-full max-w-5xl text-left">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
              <h3 className="font-semibold text-teal-900 mb-2">Smart Chunking</h3>
              <p className="text-gray-600 text-sm">Automatically break down long PDFs into digestible study cards.</p>
            </div>
            <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
              <h3 className="font-semibold text-teal-900 mb-2">Semantic Search</h3>
              <p className="text-gray-600 text-sm">Find exactly what you need without remembering the exact words.</p>
            </div>
            <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
              <h3 className="font-semibold text-teal-900 mb-2">Auto-Summaries</h3>
              <p className="text-gray-600 text-sm">Generate AI summaries of any chapter in seconds.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-20 w-full max-w-5xl text-left">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">How it Works</h2>
          <p className="text-gray-600">Simply upload your course materials, and our AI pipeline extracts, categorizes, and indexes the content instantly.</p>
        </section>

        <section id="testimonials" className="mt-20 w-full max-w-5xl text-left">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Testimonials</h2>
          <div className="bg-white/40 p-6 rounded-2xl border border-white/50 inline-block">
            <p className="text-gray-800 italic mb-4">"StudyLens completely changed how I prepare for my finals."</p>
            <p className="text-sm font-semibold text-teal-900">- Sarah J., Med Student</p>
          </div>
        </section>

        <section id="faq" className="mt-20 mb-20 w-full max-w-5xl text-left">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">FAQ</h2>
          <div className="space-y-4">
            <div className="bg-white/40 p-4 rounded-xl border border-white/50">
              <h4 className="font-semibold text-gray-800">Is it free?</h4>
              <p className="text-gray-600 text-sm mt-1">We offer a generous free tier for students.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
