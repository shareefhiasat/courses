import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

export default function CategorizeGame({ data, settings, onComplete }) {
  // data structure: { categories: [{name: 'Yes', items: [...]}, {name: 'No', items: [...]}, {name: 'Maybe', items: [...]}] }
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Shuffle and initialize items
    const allItems = [];
    data.categories.forEach((category, categoryIndex) => {
      category.items.forEach(item => {
        allItems.push({
          id: `${categoryIndex}-${item.text || item}`,
          text: item.text || item,
          image: item.image || null,
          correctCategory: categoryIndex,
          currentCategory: null
        });
      });
    });
    
    // Shuffle items
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    setItems(shuffled);
    
    // Initialize empty categories
    setCategories(data.categories.map((c, idx) => ({
      name: c.name,
      color: c.color || getCategoryColor(idx),
      items: []
    })));
  }, [data]);

  const getCategoryColor = (index) => {
    const colors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[index % colors.length];
  };

  const handleDragStart = (item, fromCategory = null) => {
    setDraggedItem({ item, fromCategory });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (categoryIndex) => {
    if (!draggedItem) return;

    const { item, fromCategory } = draggedItem;

    // Remove from source
    if (fromCategory === null) {
      setItems(items.filter(i => i.id !== item.id));
    } else {
      setCategories(categories.map((c, idx) => 
        idx === fromCategory ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c
      ));
    }

    // Add to target category
    setCategories(categories.map((c, idx) => 
      idx === categoryIndex ? { ...c, items: [...c.items, { ...item, currentCategory: categoryIndex }] } : c
    ));

    setDraggedItem(null);
  };

  const handleDropToItems = () => {
    if (!draggedItem || draggedItem.fromCategory === null) return;

    const { item, fromCategory } = draggedItem;

    // Remove from category
    setCategories(categories.map((c, idx) => 
      idx === fromCategory ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c
    ));

    // Add back to items
    setItems([...items, { ...item, currentCategory: null }]);

    setDraggedItem(null);
  };

  const handleSubmit = () => {
    let correctCount = 0;
    let totalCount = 0;

    categories.forEach((category, categoryIndex) => {
      category.items.forEach(item => {
        totalCount++;
        if (item.correctCategory === categoryIndex) {
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
    categories.forEach(category => {
      category.items.forEach(item => {
        allItems.push({ ...item, currentCategory: null });
      });
    });
    
    setItems([...items, ...allItems].sort(() => Math.random() - 0.5));
    setCategories(categories.map(c => ({ ...c, items: [] })));
    setSubmitted(false);
    setScore(0);
  };

  if (submitted) {
    const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
    const percentage = totalItems > 0 ? (score / totalItems) * 100 : 0;

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={64} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>Categorization Complete!</h1>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#06b6d4', marginBottom: '1rem' }}>
          {score} / {totalItems}
        </div>
        <div style={{ fontSize: 18, color: 'var(--muted)', marginBottom: '2rem' }}>
          {percentage.toFixed(1)}% Correct
        </div>

        {settings?.showCorrectAnswers && (
          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>Review</h3>
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  marginBottom: '0.75rem', 
                  color: category.color,
                  padding: '0.5rem 1rem',
                  background: `${category.color}20`,
                  borderRadius: 8,
                  display: 'inline-block'
                }}>
                  {category.name}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {category.items.map(item => {
                    const isCorrect = item.correctCategory === categoryIndex;
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '1rem',
                          background: isCorrect ? '#d1fae5' : '#fee2e2',
                          border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt="" 
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} 
                          />
                        )}
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.text}</span>
                        <span style={{ fontSize: 20, fontWeight: 800 }}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
              background: '#06b6d4',
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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>Categorize</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)' }}>
          Drag each item into its correct category
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Items Pool */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToItems}
          style={{
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: 12,
            border: '2px dashed var(--border)',
            minHeight: 500,
            position: 'sticky',
            top: 20
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
                {item.image && (
                  <img 
                    src={item.image} 
                    alt="" 
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} 
                  />
                )}
                <span style={{ flex: 1 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {categories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(categoryIndex)}
              style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: 12,
                border: `3px solid ${category.color}`,
                minHeight: 200
              }}
            >
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                marginBottom: '1rem', 
                color: category.color,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: category.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 800
                }}>
                  {category.items.length}
                </div>
                {category.name}
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {category.items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, categoryIndex)}
                    style={{
                      padding: '1rem',
                      background: `${category.color}15`,
                      border: `2px solid ${category.color}`,
                      borderRadius: 8,
                      cursor: 'grab',
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt="" 
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} 
                      />
                    )}
                    <span style={{ flex: 1 }}>{item.text}</span>
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
            background: items.length > 0 ? '#9ca3af' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: items.length > 0 ? 'not-allowed' : 'pointer',
            boxShadow: items.length > 0 ? 'none' : '0 4px 12px rgba(6, 182, 212, 0.4)'
          }}
        >
          {items.length > 0 ? `Categorize all items first (${items.length} remaining)` : 'Submit Answers'}
        </button>
      </div>
    </div>
  );
}
