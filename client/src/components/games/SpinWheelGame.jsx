import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trophy } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function SpinWheelGame({ questions, settings, onComplete }) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const wheelRef = useRef(null);
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + extraDegrees;

    setRotation(totalRotation);

    setTimeout(() => {
      const segmentAngle = 360 / questions.length;
      const normalizedRotation = totalRotation % 360;
      const selectedIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % questions.length;

      setSelectedSegment(selectedIndex);
      setCurrentIndex(selectedIndex);
      setSpinning(false);
      setShowQuestion(true);
    }, 4000);
  };

  const handleAnswer = (answer) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    const newAnswers = [...answers, { questionId: currentQuestion.id, answer, correct: isCorrect }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + (currentQuestion.points || 1));
    }

    // Remove answered question
    const remainingQuestions = questions.filter((_, idx) => idx !== currentIndex);

    if (remainingQuestions.length === 0) {
      setGameFinished(true);
      onComplete?.({
        score,
        totalQuestions: questions.length,
        answers: newAnswers,
        completedAt: new Date().toISOString()
      });
    } else {
      setShowQuestion(false);
      setSelectedSegment(null);
    }
  };

  if (gameFinished) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('all_answered') || 'All Questions Answered!'}</h1>
        <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400">
          {percentage.toFixed(1)}% {t('score') || 'Score'}
        </div>
      </div>
    );
  }

  if (showQuestion) {
    const currentQuestion = questions[currentIndex];
    return (
      <div className="max-w-4xl mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          {currentQuestion.image && (
            <img src={currentQuestion.image} alt="Question" className="max-w-full max-h-[300px] rounded-xl mb-6 block mx-auto object-contain" />
          )}
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {currentQuestion.question}
          </h2>

          <div className="grid gap-3">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.text)}
                className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-lg font-semibold text-left transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-4 group"
              >
                {option.image && <img src={option.image} alt="Option" className="w-16 h-16 object-cover rounded-lg" />}
                <span className="text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-lg font-semibold text-gray-500 dark:text-gray-400">
          {t('score') || 'Score'}: {score} | {t('remaining') || 'Remaining'}: {questions.length - answers.length}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">{t('spin_wheel') || 'Spin the Wheel'}</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
        {t('score') || 'Score'}: {score} | {t('questions_left') || 'Questions left'}: {questions.length - answers.length}
      </p>

      {/* Wheel Container */}
      <div className="relative w-[500px] h-[500px] mx-auto mb-8">
        {/* Arrow Pointer */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 z-10 drop-shadow-md" />

        {/* Wheel */}
        <svg
          ref={wheelRef}
          width="500"
          height="500"
          viewBox="0 0 500 500"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
          }}
        >
          <circle cx="250" cy="250" r="240" fill="white" stroke="#ddd" strokeWidth="2" />

          {questions.map((question, index) => {
            const segmentAngle = 360 / questions.length;
            const startAngle = index * segmentAngle - 90;
            const endAngle = startAngle + segmentAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 250 + 240 * Math.cos(startRad);
            const y1 = 250 + 240 * Math.sin(startRad);
            const x2 = 250 + 240 * Math.cos(endRad);
            const y2 = 250 + 240 * Math.sin(endRad);

            const largeArc = segmentAngle > 180 ? 1 : 0;

            const pathData = `M 250 250 L ${x1} ${y1} A 240 240 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // Text position
            const textAngle = startAngle + segmentAngle / 2;
            const textRad = (textAngle * Math.PI) / 180;
            const textX = 250 + 160 * Math.cos(textRad);
            const textY = 250 + 160 * Math.sin(textRad);

            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="3"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                >
                  {question.question.substring(0, 20)}...
                </text>
              </g>
            );
          })}

          {/* Center Circle */}
          <circle cx="250" cy="250" r="40" fill="white" stroke="#ddd" strokeWidth="3" />
          <text x="250" y="255" fill="#667eea" fontSize="20" fontWeight="800" textAnchor="middle">
            SPIN
          </text>
        </svg>
      </div>

      {/* Spin Button */}
      <button
        onClick={spinWheel}
        disabled={spinning}
        className={`px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 inline-flex items-center gap-2 transition-all ${spinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        <RotateCw size={20} className={spinning ? 'animate-spin' : ''} />
        {spinning ? (t('spinning') || 'Spinning...') : (t('spin_it') || 'Spin It!')}
      </button>
    </div>
  );
}
