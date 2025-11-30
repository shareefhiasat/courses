import React, { useState, useEffect } from 'react';
import { Shuffle, Check, X, Trophy, SkipForward } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function AnagramGame({ questions, settings, onComplete }) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [skips, setSkips] = useState(3);

  const currentQuestion = questions[currentIndex];
  const correctAnswer = currentQuestion.answer.toUpperCase();

  useEffect(() => {
    if (currentQuestion) {
      scrambleWord(currentQuestion.answer);
    }
  }, [currentIndex]);

  const scrambleWord = (word) => {
    const letters = word.toUpperCase().split('').map((letter, idx) => ({
      id: `${currentIndex}-${idx}`,
      letter,
      originalIndex: idx
    }));

    // Shuffle
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setScrambledLetters(shuffled);
    setSelectedLetters([]);
    setFeedback(null);
  };

  const handleLetterClick = (letter) => {
    if (feedback) return;

    setSelectedLetters([...selectedLetters, letter]);
    setScrambledLetters(scrambledLetters.filter(l => l.id !== letter.id));
  };

  const handleSelectedLetterClick = (letter, index) => {
    if (feedback) return;

    setScrambledLetters([...scrambledLetters, letter]);
    setSelectedLetters(selectedLetters.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    const userAnswer = selectedLetters.map(l => l.letter).join('');
    const isCorrect = userAnswer === correctAnswer;

    setFeedback(isCorrect ? 'correct' : 'wrong');

    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      answer: userAnswer,
      correct: isCorrect
    }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + (currentQuestion.points || 1));
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setGameFinished(true);
        onComplete?.({
          score: isCorrect ? score + (currentQuestion.points || 1) : score,
          totalQuestions: questions.length,
          answers: newAnswers,
          completedAt: new Date().toISOString()
        });
      }
    }, 1500);
  };

  const handleSkip = () => {
    if (skips === 0) return;

    setSkips(skips - 1);
    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      answer: null,
      correct: false,
      skipped: true
    }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
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

  const handleShuffle = () => {
    if (feedback) return;
    setScrambledLetters([...scrambledLetters].sort(() => Math.random() - 0.5));
  };

  if (gameFinished) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="flex justify-center mb-6">
          <Trophy size={64} className="text-yellow-500" />
        </div>
        <h1 className="text-3xl font-extrabold mb-6 text-slate-900 dark:text-white">
          {t('gameCompleted', 'All Words Unscrambled!')}
        </h1>
        <div className="text-5xl font-extrabold text-violet-600 mb-4">
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div className="text-lg text-slate-500 dark:text-slate-400 mb-8">
          {percentage.toFixed(1)}% {t('score', 'Score')}
        </div>

        {settings?.showCorrectAnswers && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">{t('review', 'Review')}</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userAnswer = answers[idx];
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${userAnswer?.correct
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                  >
                    <div className="font-semibold mb-2 text-slate-900 dark:text-white">{q.hint}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {t('yourAnswer', 'Your answer')}: {userAnswer?.answer || t('skipped', '(skipped)')} {userAnswer?.correct ? '✓' : '✗'}
                    </div>
                    {!userAnswer?.correct && (
                      <div className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                        {t('correctAnswer', 'Correct answer')}: {q.answer.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">
          {t('question', 'Question')} {currentIndex + 1} {t('of', 'of')} {questions.length}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">
          {currentQuestion.hint || t('unscrambleWord', 'Unscramble the word')}
        </h2>
        {currentQuestion.image && (
          <div className="flex justify-center mb-6">
            <img
              src={currentQuestion.image}
              alt="Hint"
              className="max-w-[200px] rounded-2xl shadow-lg"
            />
          </div>
        )}
        <div className="flex justify-center gap-6 items-center">
          <div className="text-lg font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-4 py-1.5 rounded-full">
            {t('score', 'Score')}: {score}
          </div>
          <div className="text-lg font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">
            {t('skips', 'Skips')}: {skips}
          </div>
        </div>
      </div>

      {/* Answer Area */}
      <div className="mb-8 p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 min-h-[140px] flex items-center justify-center gap-3 flex-wrap shadow-sm">
        {selectedLetters.length === 0 ? (
          <div className="text-lg text-slate-400 dark:text-slate-500 font-medium text-center">
            {t('clickLetters', 'Click letters below to build your answer')}
          </div>
        ) : (
          selectedLetters.map((letter, idx) => (
            <button
              key={`selected-${idx}`}
              onClick={() => handleSelectedLetterClick(letter, idx)}
              className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-violet-600 text-white text-2xl sm:text-3xl font-bold rounded-xl shadow-lg shadow-violet-200 dark:shadow-none hover:scale-110 transition-transform duration-200"
            >
              {letter.letter}
            </button>
          ))
        )}
      </div>

      {/* Scrambled Letters */}
      <div className="mb-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl min-h-[140px] flex items-center justify-center gap-3 flex-wrap border border-slate-100 dark:border-slate-800">
        {scrambledLetters.map(letter => (
          <button
            key={letter.id}
            onClick={() => handleLetterClick(letter)}
            className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-2xl sm:text-3xl font-bold rounded-xl shadow-sm hover:border-violet-500 dark:hover:border-violet-500 hover:scale-110 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
          >
            {letter.letter}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-8 p-6 rounded-2xl border-2 text-center transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${feedback === 'correct'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}
        >
          <div className="flex flex-col items-center gap-2">
            {feedback === 'correct' ? (
              <>
                <Check size={40} className="mb-1" />
                <div className="text-2xl font-bold">{t('correct', 'Correct!')}</div>
              </>
            ) : (
              <>
                <X size={40} className="mb-1" />
                <div className="text-xl font-bold">{t('wrong', 'Wrong!')}</div>
                <div className="text-lg opacity-90">{t('answerWas', 'The answer was')}: {correctAnswer}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={handleShuffle}
          disabled={feedback !== null}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shuffle size={20} />
          {t('shuffle', 'Shuffle')}
        </button>
        <button
          onClick={handleSkip}
          disabled={skips === 0 || feedback !== null}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${skips === 0
              ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none'
            }`}
        >
          <SkipForward size={20} />
          {t('skip', 'Skip')} ({skips})
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedLetters.length !== correctAnswer.length || feedback !== null}
          className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedLetters.length !== correctAnswer.length || feedback
              ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 dark:shadow-none hover:scale-105'
            }`}
        >
          <Check size={20} />
          {t('submit', 'Submit Answer')}
        </button>
      </div>
    </div>
  );
}
