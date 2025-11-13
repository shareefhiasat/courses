import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

export default function GroupSortGame({ data, settings, onComplete }) {
  // data structure: { groups: [{name: 'True', items: ['item1', 'item2']}, {name: 'False', items: [...]}] }
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings?.timeLimit || 0);

  useEffect(() => {
    // Shuffle and initialize items
    const allItems = [];
    data.groups.forEach((group, groupIndex) => {
      group.items.forEach(item => {
        allItems.push({
          id: `${groupIndex}-${item}`,
          text: item,
          image: item.image || null,
          correctGroup: groupIndex,
          currentGroup: null
        });
      });
    });
    
    // Shuffle items
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    setItems(shuffled);
    
    // Initialize empty groups
    setGroups(data.groups.map((g, idx) => ({
      name: g.name,
      color: g.color || getGroupColor(idx),
      items: []
    })));
  }, [data]);

  useEffect(() => {
    if (!settings?.timeLimit || timeLeft === 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const getGroupColor = (index) => {
    const colors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  const handleDragStart = (item, fromGroup = null) => {
    setDraggedItem({ item, fromGroup });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (groupIndex) => {
    if (!draggedItem) return;

    const { item, fromGroup } = draggedItem;

    // Remove from source
    if (fromGroup === null) {
      setItems(items.filter(i => i.id !== item.id));
    } else {
      setGroups(groups.map((g, idx) => 
        idx === fromGroup ? { ...g, items: g.items.filter(i => i.id !== item.id) } : g
      ));
    }

    // Add to target group
    setGroups(groups.map((g, idx) => 
      idx === groupIndex ? { ...g, items: [...g.items, { ...item, currentGroup: groupIndex }] } : g
    ));

    setDraggedItem(null);
  };

  const handleDropToItems = () => {
    if (!draggedItem || draggedItem.fromGroup === null) return;

    const { item, fromGroup } = draggedItem;

    // Remove from group
    setGroups(groups.map((g, idx) => 
      idx === fromGroup ? { ...g, items: g.items.filter(i => i.id !== item.id) } : g
    ));

    // Add back to items
    setItems([...items, { ...item, currentGroup: null }]);

    setDraggedItem(null);
  };

  const handleSubmit = () => {
    let correctCount = 0;
    let totalCount = 0;

    groups.forEach((group, groupIndex) => {
      group.items.forEach(item => {
        totalCount++;
        if (item.correctGroup === groupIndex) {
          correctCount++;
        }
      });
    });

    const finalScore = correctCount;
    setScore(finalScore);
    setSubmitted(true);

    onComplete?.({
      score: finalScore,
      totalQuestions: totalCount,
      percentage: (correctCount / totalCount) * 100,
      completedAt: new Date().toISOString()
    });
  };

  const handleReset = () => {
    // Move all items back
    const allItems = [];
    groups.forEach(group => {
      group.items.forEach(item => {
        allItems.push({ ...item, currentGroup: null });
      });
    });
    
    setItems([...items, ...allItems].sort(() => Math.random() - 0.5));
    setGroups(groups.map(g => ({ ...g, items: [] })));
    setSubmitted(false);
    setScore(0);
    setTimeLeft(settings?.timeLimit || 0);
  };

  if (submitted) {
    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
    const percentage = totalItems > 0 ? (score / totalItems) * 100 : 0;

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>Sorting Complete!</h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#667eea', marginBottom: '1rem' }}>
          {score} / {totalItems}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
          {percentage.toFixed(1)}% Correct
        </div>

        {settings?.showCorrectAnswers && (
          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Review</h3>
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: group.color }}>
                  {group.name}
                </div>
                {group.items.map(item => {
                  const isCorrect = item.correctGroup === groupIndex;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.75rem',
                        background: isCorrect ? '#d1fae5' : '#fee2e2',
                        borderRadius: 8,
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      {item.image && <img src={item.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                      <span>{item.text}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {settings?.allowRetake && (
          <button
            onClick={handleReset}
            style={{
              marginTop: '2rem',
              padding: '1rem 2rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <RotateCcw size={18} />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>Group Sort</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)' }}>
          Drag and drop each item into its correct box
        </p>
        {settings?.timeLimit > 0 && (
          <div style={{ marginTop: '1rem', fontSize: 18, fontWeight: 600, color: timeLeft < 30 ? '#ef4444' : '#667eea' }}>
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Items Pool */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToItems}
          style={{
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: 12,
            border: '2px dashed var(--border)',
            minHeight: 400
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1rem', color: 'var(--muted)' }}>
            Items ({items.length})
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, null)}
                style={{
                  padding: '1rem',
                  background: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'grab',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {item.image && <img src={item.image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div style={{ display: 'grid', gap: 16 }}>
          {groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(groupIndex)}
              style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: 12,
                border: `3px solid ${group.color}`,
                minHeight: 150
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem', color: group.color }}>
                {group.name}
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {group.items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, groupIndex)}
                    style={{
                      padding: '1rem',
                      background: `${group.color}15`,
                      border: `2px solid ${group.color}`,
                      borderRadius: 8,
                      cursor: 'grab',
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {item.image && <img src={item.image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={items.length > 0}
          style={{
            padding: '1rem 3rem',
            background: items.length > 0 ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: items.length > 0 ? 'not-allowed' : 'pointer',
            boxShadow: items.length > 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          {items.length > 0 ? `Sort all items first (${items.length} remaining)` : 'Submit Answers'}
        </button>
      </div>
    </div>
  );
}
