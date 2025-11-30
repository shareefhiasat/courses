import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function CategorizeGame({ data, settings, onComplete }) {
  const { t, lang } = useLang();
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
      <div className="max-w-3xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('categorization_complete') || 'Categorization Complete!'}</h1>
        <div className="text-5xl font-extrabold text-cyan-500 dark:text-cyan-400 mb-4">
          {score} / {totalItems}
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          {percentage.toFixed(1)}% {t('correct') || 'Correct'}
        </div>

        {settings?.showCorrectAnswers && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('review') || 'Review'}</h3>
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6">
                <div
                  className="text-lg font-bold mb-3 inline-block px-4 py-2 rounded-lg"
                  style={{
                    color: category.color,
                    background: `${category.color}20`
                  }}
                >
                  {category.name}
                </div>
                <div className="grid gap-2">
                  {category.items.map(item => {
                    const isCorrect = item.correctCategory === categoryIndex;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl flex items-center gap-3 border-2 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : 'bg-red-100 dark:bg-red-900/30 border-red-500'}`}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <span className="flex-1 font-semibold text-gray-900 dark:text-white">{item.text}</span>
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white">
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
            className="mt-8 px-8 py-4 bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-cyan-700 transition-colors"
          >
            <RotateCcw size={18} />
            {t('try_again') || 'Try Again'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">{t('categorize') || 'Categorize'}</h1>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {t('drag_category_instruction') || 'Drag each item into its correct category'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Items Pool */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToItems}
          className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 min-h-[500px] lg:sticky lg:top-5 h-fit"
        >
          <h3 className="text-base font-bold mb-4 text-gray-500 dark:text-gray-400">
            {t('items') || 'Items'} ({items.length})
          </h3>
          <div className="grid gap-2">
            {items.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, null)}
                className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-grab text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] active:cursor-grabbing shadow-sm"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span className="flex-1 text-gray-900 dark:text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(categoryIndex)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border-[3px] min-h-[200px] transition-colors"
              style={{ borderColor: category.color }}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: category.color }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold"
                  style={{ background: category.color }}
                >
                  {category.items.length}
                </div>
                {category.name}
              </h3>
              <div className="grid gap-2">
                {category.items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, categoryIndex)}
                    className="p-4 rounded-lg cursor-grab text-sm font-semibold flex items-center gap-2 border-2"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: category.color,
                      color: 'inherit'
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span className="flex-1 text-gray-900 dark:text-white">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={items.length > 0}
          className={`px-12 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all ${items.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:shadow-cyan-500/30 hover:scale-105'}`}
        >
          {items.length > 0 ? `${t('categorize_all_first') || 'Categorize all items first'} (${items.length} ${t('remaining') || 'remaining'})` : (t('submit_answers') || 'Submit Answers')}
        </button>
      </div>
    </div>
  );
}
