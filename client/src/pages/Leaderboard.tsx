import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaderboardUser {
  id: string;
  name: string;
  totalCorrectAnswers: number;
  totalQuizzesTaken: number;
  currentStreak: number;
  longestStreak: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#dcece2] relative overflow-hidden font-sans text-slate-800">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/50 blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-[100px] mix-blend-multiply"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <Link to="/dashboard" className="flex items-center gap-2 text-teal-700 hover:text-teal-900 font-semibold bg-white/40 px-4 py-2 rounded-full backdrop-blur-md">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" /> Leaderboard
          </h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl border border-white/50">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No quiz data yet. Start taking quizzes to appear on the leaderboard!
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user, index) => (
                <div key={user.id} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 shrink-0">
                    {index === 0 && <Trophy className="w-8 h-8 text-yellow-500" />}
                    {index === 1 && <Medal className="w-8 h-8 text-slate-400" />}
                    {index === 2 && <Award className="w-8 h-8 text-amber-700" />}
                    {index > 2 && <span className="text-xl font-bold text-slate-400">#{index + 1}</span>}
                  </div>
                  
                  <div className="ml-6 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{user.name || 'Anonymous Learner'}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">🔥 {user.currentStreak} Day Streak</span>
                      <span className="flex items-center gap-1">📚 {user.totalQuizzesTaken} Quizzes</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-teal-600">{user.totalCorrectAnswers}</div>
                    <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
