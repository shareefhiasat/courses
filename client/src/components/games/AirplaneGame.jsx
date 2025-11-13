import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trophy } from 'lucide-react';

export default function AirplaneGame({ questions, settings, onComplete }) {
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: '1rem' }}>✈️</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>Airplane Game</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '1rem' }}>
          Fly your plane into the correct answers!
        </p>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: '2rem' }}>
          {questions.length} questions • 3 lives
        </p>
        <button
          onClick={() => setGameStarted(true)}
          style={{
            padding: '1rem 3rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}
        >
          START FLYING
        </button>
      </div>
    );
  }

  if (gameOver) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>
          {lives > 0 ? 'Mission Complete!' : 'Game Over'}
        </h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#3b82f6', marginBottom: '1rem' }}>
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '1rem' }}>
          {percentage.toFixed(1)}% Score
        </div>
        <div style={{ fontSize: 16, color: 'var(--muted)' }}>
          Lives remaining: {lives}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '0.25rem' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {currentQuestion.question}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[...Array(3)].map((_, idx) => (
              <Heart
                key={idx}
                size={24}
                fill={idx < lives ? '#ef4444' : 'none'}
                stroke={idx < lives ? '#ef4444' : '#d1d5db'}
              />
            ))}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
            Score: {score}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          width: '100%',
          height: 600,
          background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {/* Clouds with answers */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            onClick={() => handleCloudClick(cloud)}
            style={{
              position: 'absolute',
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              transform: 'translate(-50%, -50%)',
              padding: '1rem 1.5rem',
              background: 'white',
              borderRadius: 999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              transition: 'transform 0.2s',
              zIndex: 5
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
          >
            {cloud.text}
          </div>
        ))}

        {/* Airplane */}
        <div
          style={{
            position: 'absolute',
            left: `${planePosition}%`,
            bottom: '10%',
            transform: 'translateX(-50%)',
            fontSize: 48,
            transition: 'left 0.1s',
            zIndex: 10,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          ✈️
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '2rem 3rem',
              background: showFeedback.correct ? '#d1fae5' : '#fee2e2',
              border: `3px solid ${showFeedback.correct ? '#10b981' : '#ef4444'}`,
              borderRadius: 16,
              fontSize: 24,
              fontWeight: 800,
              color: showFeedback.correct ? '#065f46' : '#991b1b',
              zIndex: 20,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            {showFeedback.correct ? '✓ Correct!' : '✗ Wrong!'}
          </div>
        )}

        {/* Instruction */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--muted)',
            zIndex: 15
          }}
        >
          Move your mouse to fly the plane
        </div>
      </div>
    </div>
  );
}
