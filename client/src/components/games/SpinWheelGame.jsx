import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trophy } from 'lucide-react';

export default function SpinWheelGame({ questions, settings, onComplete }) {
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>All Questions Answered!</h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#667eea', marginBottom: '1rem' }}>
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)' }}>
          {percentage.toFixed(1)}% Score
        </div>
      </div>
    );
  }

  if (showQuestion) {
    const currentQuestion = questions[currentIndex];
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div style={{ padding: '2rem', background: 'white', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '2rem' }}>
          {currentQuestion.image && (
            <img src={currentQuestion.image} alt="Question" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, marginBottom: '1.5rem' }} />
          )}
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1.5rem' }}>
            {currentQuestion.question}
          </h2>
          
          <div style={{ display: 'grid', gap: 12 }}>
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.text)}
                style={{
                  padding: '1.5rem',
                  background: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f0f4ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'white';
                }}
              >
                {option.image && <img src={option.image} alt="Option" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginRight: 12, float: 'left' }} />}
                {option.text}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>
          Score: {score} | Remaining: {questions.length - answers.length}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>Spin the Wheel</h1>
      <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
        Score: {score} | Questions left: {questions.length - answers.length}
      </p>

      {/* Wheel Container */}
      <div style={{ position: 'relative', width: 500, height: 500, margin: '0 auto 2rem' }}>
        {/* Arrow Pointer */}
        <div style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderTop: '40px solid #ef4444',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }} />

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
        style={{
          padding: '1rem 3rem',
          background: spinning ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 700,
          cursor: spinning ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <RotateCw size={20} className={spinning ? 'animate-spin' : ''} />
        {spinning ? 'Spinning...' : 'Spin It!'}
      </button>
    </div>
  );
}
