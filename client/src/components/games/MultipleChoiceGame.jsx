import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MultipleChoiceGame({ questions, settings, onComplete }) {
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: '1rem' }}>📝</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>Multiple Choice Quiz</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
          {totalQuestions} questions • {settings?.timeLimit ? `${settings.timeLimit / 60} minutes` : 'No time limit'}
        </p>
        <button
          onClick={() => {
            setGameStarted(true);
            setTimeLeft(settings?.timeLimit || 0);
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
          START QUIZ
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
              const userAnswer = answers[q.id];
              const correctOption = q.options.find(opt => opt.correct);
              const userOption = q.options.find(opt => opt.id === userAnswer?.answer);
              
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '1rem',
                    background: userAnswer?.correct ? '#d1fae5' : '#fee2e2',
                    borderRadius: 8,
                    marginBottom: '0.5rem'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    Q{idx + 1}: {q.question}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    Your answer: {userOption?.text || '(No answer)'} {userAnswer?.correct ? '✓' : '✗'}
                  </div>
                  {!userAnswer?.correct && (
                    <div style={{ fontSize: 14, marginTop: '0.25rem', color: '#065f46' }}>
                      Correct answer: {correctOption?.text}
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'white',
        borderRadius: 12,
        border: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '0.25rem' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            Score: {score}
          </div>
        </div>
        {settings?.timeLimit > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: '0.5rem 1rem',
            background: timeLeft < 60 ? '#fee2e2' : '#f3f4f6',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            color: timeLeft < 60 ? '#dc2626' : '#374151'
          }}>
            <Clock size={18} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Question Card */}
      <div style={{ 
        padding: '2rem', 
        background: 'white', 
        borderRadius: 16, 
        border: '1px solid var(--border)',
        marginBottom: '2rem'
      }}>
        {currentQuestion.image && (
          <img
            src={currentQuestion.image}
            alt="Question"
            style={{ 
              maxWidth: '100%', 
              maxHeight: 300, 
              borderRadius: 12, 
              marginBottom: '1.5rem',
              display: 'block',
              margin: '0 auto 1.5rem'
            }}
          />
        )}
        <h2 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, marginBottom: '1.5rem' }}>
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'grid', gap: 12 }}>
          {currentQuestion.options?.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.correct;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={showFeedback}
                style={{
                  padding: '1.5rem',
                  background: showCorrect ? '#d1fae5' : showWrong ? '#fee2e2' : isSelected ? '#e0e7ff' : 'white',
                  border: `2px solid ${showCorrect ? '#10b981' : showWrong ? '#ef4444' : isSelected ? '#667eea' : 'var(--border)'}`,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: showFeedback ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
                onMouseEnter={(e) => {
                  if (!showFeedback && !isSelected) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#f0f4ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showFeedback && !isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {option.image && (
                  <img
                    src={option.image}
                    alt="Option"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <span style={{ flex: 1 }}>{option.text}</span>
                {showCorrect && <Check size={24} style={{ color: '#10b981' }} />}
                {showWrong && <X size={24} style={{ color: '#ef4444' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={moveToPrevious}
          disabled={currentIndex === 0 || showFeedback}
          style={{
            padding: '0.75rem 1.5rem',
            background: currentIndex === 0 || showFeedback ? '#e5e7eb' : '#f3f4f6',
            color: currentIndex === 0 || showFeedback ? '#9ca3af' : '#374151',
            border: 'none',
            borderRadius: 8,
            cursor: currentIndex === 0 || showFeedback ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600
          }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        {!showFeedback && (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            style={{
              padding: '1rem 3rem',
              background: !selectedAnswer ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: !selectedAnswer ? 'not-allowed' : 'pointer',
              boxShadow: !selectedAnswer ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
