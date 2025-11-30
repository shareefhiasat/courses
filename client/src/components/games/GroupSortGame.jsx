import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function GroupSortGame({ data, settings, onComplete }) {
  const { t, lang } = useLang();
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
      <div className="max-w-3xl mx-auto p-8 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">{t('sorting_complete') || 'Sorting Complete!'}</h1>
        <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
          {score} / {totalItems}
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          {percentage.toFixed(1)}% {t('correct') || 'Correct'}
        </div>

        {settings?.showCorrectAnswers && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('review') || 'Review'}</h3>
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <div className="text-base font-semibold mb-2" style={{ color: group.color }}>
                  {group.name}
                </div>
                {group.items.map(item => {
                  const isCorrect = item.correctGroup === groupIndex;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg mb-2 flex items-center gap-2 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                    >
                      {item.image && <img src={item.image} alt="" className="w-10 h-10 object-cover rounded" />}
                      <span className="text-gray-900 dark:text-white">{item.text}</span>
                      <span className="ml-auto font-semibold text-gray-900 dark:text-white">
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
            className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw size={18} />
            {t('try_again') || 'Try Again'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">{t('group_sort') || 'Group Sort'}</h1>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {t('drag_drop_instruction') || 'Drag and drop each item into its correct box'}
        </p>
        {settings?.timeLimit > 0 && (
          <div className={`mt-4 text-lg font-semibold ${timeLeft < 30 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {t('time_left') || 'Time Left'}: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Items Pool */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToItems}
          className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 min-h-[400px]"
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
                {item.image && <img src={item.image} alt="" className="w-8 h-8 object-cover rounded" />}
                <span className="text-gray-900 dark:text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="grid gap-4">
          {groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(groupIndex)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border-[3px] min-h-[150px] transition-colors"
              style={{ borderColor: group.color }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: group.color }}>
                {group.name}
              </h3>
              <div className="grid gap-2">
                {group.items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, groupIndex)}
                    className="p-4 rounded-lg cursor-grab text-sm font-semibold flex items-center gap-2 border-2"
                    style={{
                      backgroundColor: `${group.color}15`,
                      borderColor: group.color,
                      color: 'inherit'
                    }}
                  >
                    {item.image && <img src={item.image} alt="" className="w-8 h-8 object-cover rounded" />}
                    <span className="text-gray-900 dark:text-white">{item.text}</span>
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
          className={`px-12 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all ${items.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30 hover:scale-105'}`}
        >
          {items.length > 0 ? `${t('sort_all_first') || 'Sort all items first'} (${items.length} ${t('remaining') || 'remaining'})` : (t('submit_answers') || 'Submit Answers')}
        </button>
      </div>
    </div>
  );
}
