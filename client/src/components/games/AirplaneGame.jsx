import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trophy } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function AirplaneGame({ questions, settings, onComplete }) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [answers, setAnswers] = useState([]);
  const [clouds, setClouds] = useState([]);
  const [planePosition, setPlanePosition] = useState(50); // percentage from left
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null);

  const gameAreaRef = useRef(null);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Generate clouds with answers
    const newClouds = currentQuestion.options.map((option, idx) => ({
      id: `${currentIndex}-${idx}`,
      text: option.text,
      correct: option.correct,
      x: Math.random() * 60 + 20, // 20-80% from left
      y: -10, // Start above screen
      speed: 1 + Math.random() * 0.5
    }));

    setClouds(newClouds);
  }, [currentIndex, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setClouds(prev =>
        prev.map(cloud => ({
          ...cloud,
          y: cloud.y + cloud.speed
        })).filter(cloud => cloud.y < 110) // Remove clouds that went off screen
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  const handleCloudClick = (cloud) => {
    if (showFeedback) return;

    const isCorrect = cloud.correct;
    setShowFeedback({ correct: isCorrect, text: cloud.text });

    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      answer: cloud.text,
      correct: isCorrect
    }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + (currentQuestion.points || 1));

      setTimeout(() => {
        setShowFeedback(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setClouds([]);
        } else {
          setGameOver(true);
          onComplete?.({
            score: score + (currentQuestion.points || 1),
            totalQuestions: questions.length,
            answers: newAnswers,
            lives,
            completedAt: new Date().toISOString()
          });
        }
      }, 1500);
    } else {
      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        setShowFeedback(null);
        if (newLives === 0) {
          setGameOver(true);
          onComplete?.({
            score,
            totalQuestions: questions.length,
            answers: newAnswers,
            lives: 0,
            completedAt: new Date().toISOString()
          });
        } else {
          setClouds([]);
        }
      }, 1500);
    }
  };

  const handleMouseMove = (e) => {
    if (!gameAreaRef.current || !gameStarted || gameOver) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlanePosition(Math.max(5, Math.min(95, x)));
  };

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-6xl mb-4">✈️</div>
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('airplane_game') || 'Airplane Game'}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
          {t('fly_instruction') || 'Fly your plane into the correct answers!'}
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
          {questions.length} {t('questions') || 'questions'} • 3 {t('lives') || 'lives'}
        </p>
        <button
          onClick={() => setGameStarted(true)}
          className="px-12 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all"
        >
          {t('start_flying') || 'START FLYING'}
        </button>
      </div>
    );
  }

  if (gameOver) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">
          {lives > 0 ? (t('mission_complete') || 'Mission Complete!') : (t('game_over') || 'Game Over')}
        </h1>
        <div className="text-5xl font-extrabold text-blue-500 dark:text-blue-400 mb-4">
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400 mb-4">
          {percentage.toFixed(1)}% {t('score') || 'Score'}
        </div>
        <div className="text-base text-gray-500 dark:text-gray-400">
          {t('lives_remaining') || 'Lives remaining'}: {lives}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('question') || 'Question'} {currentIndex + 1} {t('of') || 'of'} {questions.length}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {currentQuestion.question}
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, idx) => (
              <Heart
                key={idx}
                size={24}
                fill={idx < lives ? '#ef4444' : 'none'}
                stroke={idx < lives ? '#ef4444' : '#d1d5db'}
                className="transition-all"
              />
            ))}
          </div>
          <div className="text-lg font-bold text-blue-500 dark:text-blue-400">
            {t('score') || 'Score'}: {score}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        onMouseMove={handleMouseMove}
        className="relative w-full h-[600px] bg-gradient-to-b from-sky-300 to-sky-100 rounded-2xl overflow-hidden cursor-none shadow-inner"
      >
        {/* Clouds with answers */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            onClick={() => handleCloudClick(cloud)}
            className="absolute px-6 py-4 bg-white rounded-full shadow-lg cursor-pointer text-base font-bold whitespace-nowrap z-10 hover:scale-110 transition-transform"
            style={{
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {cloud.text}
          </div>
        ))}

        {/* Airplane */}
        <div
          className="absolute text-5xl transition-[left] duration-100 z-20 drop-shadow-lg"
          style={{
            left: `${planePosition}%`,
            bottom: '10%',
            transform: 'translateX(-50%)',
          }}
        >
          ✈️
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-2xl text-2xl font-extrabold z-30 shadow-2xl border-4 ${showFeedback.correct ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}
          >
            {showFeedback.correct ? (t('correct') || '✓ Correct!') : (t('wrong') || '✗ Wrong!')}
          </div>
        )}

        {/* Instruction */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 rounded-lg text-sm text-gray-600 font-medium z-20 backdrop-blur-sm">
          {t('move_mouse_instruction') || 'Move your mouse to fly the plane'}
        </div>
      </div>
    </div>
  );
}
