import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, XCircle, ChevronRight, Brain, RotateCcw } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function QuizModal({ isOpen, onClose, documentId, documentTitle }: QuizModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    if (isOpen && documentId && questions.length === 0 && !error) {
      generateQuiz();
    }
  }, [isOpen, documentId]);

  const generateQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/quiz/generate/${documentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions(res.data.questions);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerRevealed) return; // Prevent changing answer after revealed
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    setIsAnswerRevealed(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswerRevealed(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsAnswerRevealed(false);
    setQuestions([]);
    generateQuiz();
  };

  const handleClose = () => {
    onClose();
    // Reset state after close animation finishes
    setTimeout(() => {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setIsAnswerRevealed(false);
      if (error) setError(null);
    }, 300);
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];
  const score = Object.entries(selectedAnswers).filter(([idx, answer]) => questions[parseInt(idx)].correctAnswer === answer).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Study Quiz</h3>
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative bg-slate-50/50">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                <Brain className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Generating your Quiz...</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Our AI is reading your document and crafting 5 perfect questions to test your knowledge.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Oops!</h3>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button 
                onClick={generateQuiz}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : showResults ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 relative mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#0d9488" strokeWidth="8"
                    strokeDasharray={`${(score / questions.length) * 283} 283`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-900">{score}</span>
                  <span className="text-xs font-semibold text-slate-400">out of {questions.length}</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {score === questions.length ? 'Perfect Score!' : score >= questions.length / 2 ? 'Great Job!' : 'Keep Studying!'}
              </h2>
              <p className="text-slate-500 mb-8 max-w-sm">
                You've completed the quiz for this document. Review your notes and try again to improve your score!
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleRetake}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-teal-600 shadow-md shadow-teal-500/20 hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Progress Bar */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold text-teal-600 w-12 text-right">Q {currentIndex + 1}</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-400 w-12">{questions.length}</span>
              </div>

              {/* Question */}
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 leading-tight">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentIndex] === idx;
                  const isCorrect = currentQuestion.correctAnswer === idx;
                  
                  let optionClass = "border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 text-slate-700";
                  let Icon = null;

                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      optionClass = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500";
                      Icon = CheckCircle2;
                    } else if (isSelected) {
                      optionClass = "border-red-300 bg-red-50 text-red-900";
                      Icon = XCircle;
                    } else {
                      optionClass = "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
                    }
                  } else if (isSelected) {
                    optionClass = "border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerRevealed}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${optionClass} ${isAnswerRevealed ? 'cursor-default' : 'cursor-pointer shadow-sm hover:shadow'}`}
                    >
                      <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mt-0.5 text-[11px] font-bold transition-colors ${isAnswerRevealed && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isAnswerRevealed && isSelected ? 'border-red-400 bg-red-400 text-white' : isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 text-slate-500'}`}>
                        {Icon ? <Icon className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium text-[15px] leading-relaxed pt-0.5">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button */}
              {isAnswerRevealed && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <div className={`p-4 rounded-2xl mb-6 flex gap-3 ${selectedAnswers[currentIndex] === currentQuestion.correctAnswer ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className="mt-0.5 shrink-0">
                      {selectedAnswers[currentIndex] === currentQuestion.correctAnswer ? 
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : 
                        <Brain className="w-5 h-5 text-amber-600" />
                      }
                    </div>
                    <div>
                      <h4 className={`font-semibold text-[14px] mb-1 ${selectedAnswers[currentIndex] === currentQuestion.correctAnswer ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {selectedAnswers[currentIndex] === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                      </h4>
                      <p className={`text-[14px] leading-relaxed ${selectedAnswers[currentIndex] === currentQuestion.correctAnswer ? 'text-emerald-700/90' : 'text-amber-800/80'}`}>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleNext}
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 group"
                    >
                      {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
