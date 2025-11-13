import React, { useState, useEffect } from 'react';
import { Shuffle, Check, X, Trophy, SkipForward } from 'lucide-react';

export default function AnagramGame({ questions, settings, onComplete }) {
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>All Words Unscrambled!</h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#8b5cf6', marginBottom: '1rem' }}>
          {score} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)' }}>
          {percentage.toFixed(1)}% Score
        </div>

        {settings?.showCorrectAnswers && (
          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Review</h3>
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
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
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{q.hint}</div>
                  <div style={{ fontSize: 14 }}>
                    Your answer: {userAnswer?.answer || '(skipped)'} {userAnswer?.correct ? '✓' : '✗'}
                  </div>
                  {!userAnswer?.correct && (
                    <div style={{ fontSize: 14, marginTop: '0.25rem' }}>
                      Correct answer: {q.answer.toUpperCase()}
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
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '0.5rem' }}>
          Question {currentIndex + 1} of {questions.length}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1rem' }}>
          {currentQuestion.hint || 'Unscramble the word'}
        </h2>
        {currentQuestion.image && (
          <img
            src={currentQuestion.image}
            alt="Hint"
            style={{ maxWidth: 200, borderRadius: 12, marginBottom: '1rem' }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#8b5cf6' }}>
            Score: {score}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--muted)' }}>
            Skips: {skips}
          </div>
        </div>
      </div>

      {/* Answer Area */}
      <div style={{ marginBottom: '2rem', padding: '2rem', background: 'white', borderRadius: 16, border: '2px solid var(--border)', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {selectedLetters.length === 0 ? (
          <div style={{ fontSize: 16, color: 'var(--muted)' }}>
            Click letters below to build your answer
          </div>
        ) : (
          selectedLetters.map((letter, idx) => (
            <div
              key={`selected-${idx}`}
              onClick={() => handleSelectedLetterClick(letter, idx)}
              style={{
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#8b5cf6',
                color: 'white',
                fontSize: 28,
                fontWeight: 800,
                borderRadius: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {letter.letter}
            </div>
          ))
        )}
      </div>

      {/* Scrambled Letters */}
      <div style={{ marginBottom: '2rem', padding: '2rem', background: '#f9fafb', borderRadius: 16, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {scrambledLetters.map(letter => (
          <div
            key={letter.id}
            onClick={() => handleLetterClick(letter)}
            style={{
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              border: '2px solid var(--border)',
              fontSize: 28,
              fontWeight: 800,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {letter.letter}
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: feedback === 'correct' ? '#d1fae5' : '#fee2e2',
            border: `3px solid ${feedback === 'correct' ? '#10b981' : '#ef4444'}`,
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 800,
            color: feedback === 'correct' ? '#065f46' : '#991b1b'
          }}
        >
          {feedback === 'correct' ? (
            <>
              <Check size={32} style={{ marginBottom: '0.5rem' }} />
              <div>Correct!</div>
            </>
          ) : (
            <>
              <X size={32} style={{ marginBottom: '0.5rem' }} />
              <div>Wrong! The answer was: {correctAnswer}</div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={handleShuffle}
          disabled={feedback !== null}
          style={{
            padding: '1rem 2rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: feedback ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Shuffle size={18} />
          Shuffle
        </button>
        <button
          onClick={handleSkip}
          disabled={skips === 0 || feedback !== null}
          style={{
            padding: '1rem 2rem',
            background: skips === 0 ? '#e5e7eb' : '#f59e0b',
            color: skips === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: skips === 0 || feedback ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <SkipForward size={18} />
          Skip ({skips})
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedLetters.length !== correctAnswer.length || feedback !== null}
          style={{
            padding: '1rem 2rem',
            background: selectedLetters.length !== correctAnswer.length || feedback ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedLetters.length !== correctAnswer.length || feedback ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: selectedLetters.length === correctAnswer.length && !feedback ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
          }}
        >
          <Check size={18} />
          Submit Answer
        </button>
      </div>
    </div>
  );
}
