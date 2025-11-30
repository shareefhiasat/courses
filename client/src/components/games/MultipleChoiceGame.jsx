import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function MultipleChoiceGame({ questions, settings, onComplete }) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(settings?.timeLimit || 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (!gameStarted || !settings?.timeLimit || timeLeft === 0 || gameFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, gameFinished]);

  const handleAnswerSelect = (optionId) => {
    if (showFeedback) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const option = currentQuestion.options.find(opt => opt.id === selectedAnswer);
    const isCorrect = option?.correct || false;

    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct: isCorrect
      }
    });

    if (isCorrect) {
      setScore(score + (currentQuestion.points || 1));
    }

    if (settings?.showCorrectAnswers) {
      setShowFeedback(true);
      setTimeout(() => {
        moveToNext();
      }, 2000);
    } else {
      moveToNext();
    }
  };

  const moveToNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0 && !showFeedback) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[questions[currentIndex - 1].id]?.answer || null);
    }
  };

  const handleFinish = () => {
    setGameFinished(true);
    const answerArray = Object.values(answers);
    onComplete?.({
      score,
      totalQuestions,
      answers: answerArray,
      percentage: (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100,
      completedAt: new Date().toISOString()
    });
  };

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('multiple_choice_quiz') || 'Multiple Choice Quiz'}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          {totalQuestions} {t('questions') || 'questions'} • {settings?.timeLimit ? `${settings.timeLimit / 60} ${t('minutes') || 'minutes'}` : (t('no_time_limit') || 'No time limit')}
        </p>
        <button
          onClick={() => {
            setGameStarted(true);
            setTimeLeft(settings?.timeLimit || 0);
          }}
          className="px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all"
        >
          {t('start_quiz') || 'START QUIZ'}
        </button>
      </div>
    );
  }

  if (gameFinished) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('quiz_complete') || 'Quiz Complete!'}</h1>
        <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          {percentage.toFixed(1)}% {t('score') || 'Score'}
        </div>

        {settings?.showCorrectAnswers && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('review_answers') || 'Review Answers'}</h3>
            {questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const correctOption = q.options.find(opt => opt.correct);
              const userOption = q.options.find(opt => opt.id === userAnswer?.answer);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl mb-2 ${userAnswer?.correct ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                >
                  <div className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Q{idx + 1}: {q.question}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {t('your_answer') || 'Your answer'}: {userOption?.text || (t('no_answer') || '(No answer)')} {userAnswer?.correct ? '✓' : '✗'}
                  </div>
                  {!userAnswer?.correct && (
                    <div className="text-sm mt-1 text-green-700 dark:text-green-400">
                      {t('correct_answer') || 'Correct answer'}: {correctOption?.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('question') || 'Question'} {currentIndex + 1} {t('of') || 'of'} {totalQuestions}
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {t('score') || 'Score'}: {score}
          </div>
        </div>
        {settings?.timeLimit > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${timeLeft < 60 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
            <Clock size={18} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        {currentQuestion.image && (
          <img
            src={currentQuestion.image}
            alt="Question"
            className="max-w-full max-h-[300px] rounded-xl mb-6 block mx-auto object-contain"
          />
        )}
        <h2 className="text-2xl font-bold leading-relaxed mb-6 text-gray-900 dark:text-white text-center">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="grid gap-3">
          {currentQuestion.options?.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.correct;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            let bgClass = 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
            let borderClass = 'border-gray-200 dark:border-gray-700';

            if (showCorrect) {
              bgClass = 'bg-green-50 dark:bg-green-900/20';
              borderClass = 'border-green-500 dark:border-green-500';
            } else if (showWrong) {
              bgClass = 'bg-red-50 dark:bg-red-900/20';
              borderClass = 'border-red-500 dark:border-red-500';
            } else if (isSelected) {
              bgClass = 'bg-indigo-50 dark:bg-indigo-900/20';
              borderClass = 'border-indigo-500 dark:border-indigo-500';
            }

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={showFeedback}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all flex items-center gap-4 group ${bgClass} ${borderClass} ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700'}`}
              >
                {option.image && (
                  <img
                    src={option.image}
                    alt="Option"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <span className="flex-1 text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{option.text}</span>
                {showCorrect && <Check size={24} className="text-green-500" />}
                {showWrong && <X size={24} className="text-red-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={moveToPrevious}
          disabled={currentIndex === 0 || showFeedback}
          className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft size={20} />
          {t('previous') || 'Previous'}
        </button>

        {!showFeedback && (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${!selectedAnswer ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/30 hover:scale-105'}`}
          >
            {currentIndex === totalQuestions - 1 ? (t('finish_quiz') || 'Finish Quiz') : (t('next_question') || 'Next Question')}
            {currentIndex !== totalQuestions - 1 && <ChevronRight size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
