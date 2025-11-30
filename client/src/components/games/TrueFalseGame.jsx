import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function TrueFalseGame({ questions, settings, onComplete }) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(settings?.timePerQuestion || 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!gameStarted || !settings?.timePerQuestion || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, currentIndex]);

  const handleAnswer = (answer) => {
    const isCorrect = answer === currentQuestion.correctAnswer;
    const newAnswers = [...answers, { questionId: currentQuestion.id, answer, correct: isCorrect, timeSpent: (settings?.timePerQuestion || 0) - timeLeft }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + (currentQuestion.points || 1));
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(settings?.timePerQuestion || 0);
    } else {
      setGameFinished(true);
      onComplete?.({
        score,
        totalQuestions: questions.length,
        answers: newAnswers,
        completedAt: new Date().toISOString()
      });
    }
  };

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 text-center">
          <div className="text-5xl mb-4">✓✗</div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">{t('true_false_quiz') || 'True or False'}</h1>
          <p className="text-sm text-gray-500 mb-8">
            {questions.length} {t('questions') || 'questions'} • {settings?.timePerQuestion ? `${settings.timePerQuestion}s ${t('per_question') || 'per question'}` : (t('no_time_limit') || 'No time limit')}
          </p>
          <button
            onClick={() => {
              setGameStarted(true);
              setTimeLeft(settings?.timePerQuestion || 0);
            }}
            className="px-10 py-3 bg-[#0066ff] hover:bg-[#0052cc] text-white text-sm font-semibold rounded-full shadow-md transition-colors"
          >
            {t('start') || 'Start'}
          </button>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div className="max-w-2xl mx-auto p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 text-center">
          <Trophy size={56} className="mx-auto text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-3 text-gray-900">{t('quiz_complete') || 'Quiz Complete!'}</h1>
          <div className="text-3xl font-extrabold text-indigo-600 mb-2">
            {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
          </div>
          <div className="text-sm text-gray-500 mb-6">
            {percentage.toFixed(1)}% {t('score') || 'Score'}
          </div>

        {settings?.showCorrectAnswers && (
          <div className="mt-6 text-left border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-900">{t('review_answers') || 'Review Answers'}</h3>
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              return (
                <div key={q.id} className={`p-3 rounded-xl mb-2 ${userAnswer?.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-sm font-semibold mb-1 text-gray-900">Q{idx + 1}: {q.question}</div>
                  <div className="text-xs text-gray-700">
                    {t('your_answer') || 'Your answer'}: {userAnswer?.answer === true ? (t('true') || 'True') : userAnswer?.answer === false ? (t('false') || 'False') : (t('no_answer') || 'No answer')}
                    {userAnswer?.correct ? ' ✓' : ' ✗'}
                  </div>
                  {!userAnswer?.correct && (
                    <div className="text-xs mt-1 text-green-700">
                      {t('correct_answer') || 'Correct answer'}: {q.correctAnswer ? (t('true') || 'True') : (t('false') || 'False')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">{t('question') || 'Question'} {currentIndex + 1} {t('of') || 'of'} {questions.length}</span>
          {settings?.timePerQuestion > 0 && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${timeLeft < 10 ? 'text-red-500' : 'text-indigo-600'}`}>
              <Clock size={16} />
              {timeLeft}s
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 text-center">
        {currentQuestion.image && (
          <img src={currentQuestion.image} alt="Question" className="max-w-full max-h-[300px] rounded-xl mb-6 block mx-auto object-contain" />
        )}
        <h2 className="text-xl font-semibold leading-relaxed text-gray-900">
          {currentQuestion.question}
        </h2>
      </div>

      {/* True/False Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="p-5 bg-green-50 border border-green-300 text-green-800 rounded-2xl shadow-sm hover:bg-green-500 hover:text-white hover:border-green-500 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <Check size={32} className="group-hover:scale-110 transition-transform" />
          <div className="text-base font-semibold">{t('true') || 'True'}</div>
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="p-5 bg-red-50 border border-red-300 text-red-800 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <X size={32} className="group-hover:scale-110 transition-transform" />
          <div className="text-base font-semibold">{t('false') || 'False'}</div>
        </button>
      </div>

      {/* Score Display */}
      <div className="mt-6 text-center text-sm font-semibold text-gray-500">
        {t('current_score') || 'Current Score'}: {score}
      </div>
    </div>
  );
}
