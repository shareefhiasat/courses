import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy } from 'lucide-react';

export default function TrueFalseGame({ questions, settings, onComplete }) {
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: '1rem' }}>✓✗</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>True or False</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
          {questions.length} questions • {settings?.timePerQuestion ? `${settings.timePerQuestion}s per question` : 'No time limit'}
        </p>
        <button
          onClick={() => {
            setGameStarted(true);
            setTimeLeft(settings?.timePerQuestion || 0);
          }}
          style={{
            padding: '1rem 3rem',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
        >
          START
        </button>
      </div>
    );
  }

  if (gameFinished) {
    const percentage = (score / questions.reduce((sum, q) => sum + (q.points || 1), 0)) * 100;
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>Quiz Complete!</h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#667eea', marginBottom: '1rem' }}>
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
          {percentage.toFixed(1)}% Score
        </div>
        
        {settings?.showCorrectAnswers && (
          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Review Answers</h3>
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              return (
                <div key={q.id} style={{ padding: '1rem', background: userAnswer?.correct ? '#d1fae5' : '#fee2e2', borderRadius: 8, marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Q{idx + 1}: {q.question}</div>
                  <div style={{ fontSize: 14 }}>
                    Your answer: {userAnswer?.answer === true ? 'True' : userAnswer?.answer === false ? 'False' : 'No answer'} 
                    {userAnswer?.correct ? ' ✓' : ' ✗'}
                  </div>
                  {!userAnswer?.correct && (
                    <div style={{ fontSize: 14, marginTop: '0.25rem' }}>
                      Correct answer: {q.correctAnswer ? 'True' : 'False'}
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Question {currentIndex + 1} of {questions.length}</span>
          {settings?.timePerQuestion > 0 && (
            <span style={{ fontSize: 14, fontWeight: 600, color: timeLeft < 10 ? '#ef4444' : '#667eea', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={16} />
              {timeLeft}s
            </span>
          )}
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '2rem', background: 'white', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '2rem', textAlign: 'center' }}>
        {currentQuestion.image && (
          <img src={currentQuestion.image} alt="Question" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, marginBottom: '1.5rem' }} />
        )}
        <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4 }}>
          {currentQuestion.question}
        </h2>
      </div>

      {/* True/False Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <button
          onClick={() => handleAnswer(true)}
          style={{
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            fontSize: 32,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Check size={48} style={{ marginBottom: '0.5rem' }} />
          <div>True</div>
        </button>
        <button
          onClick={() => handleAnswer(false)}
          style={{
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            fontSize: 32,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={48} style={{ marginBottom: '0.5rem' }} />
          <div>False</div>
        </button>
      </div>

      {/* Score Display */}
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>
        Current Score: {score}
      </div>
    </div>
  );
}
