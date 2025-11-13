import React, { useEffect, useState, useRef } from 'react';

/* Lightweight draggable grid with localStorage persistence
Props:
- widgets: Array<{ id: string, title: string, render: () => React.ReactNode }>
- storageKey: string
*/
export default function DragGrid({ widgets = [], storageKey = 'drag_grid_layout' }) {
  const [order, setOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return widgets.map(w => w.id);
  });
  const draggingId = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(order));
  }, [order, storageKey]);

  // keep order in sync when widgets list changes
  useEffect(() => {
    const ids = widgets.map(w => w.id);
    const merged = order.filter(id => ids.includes(id)).concat(ids.filter(id => !order.includes(id)));
    if (merged.join(',') !== order.join(',')) setOrder(merged);
  }, [widgets]);

  const onDragStart = (id) => (e) => {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (id) => (e) => {
    e.preventDefault();
    const from = draggingId.current;
    if (!from || from === id) return;
    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(id);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = order.slice();
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, from);
    setOrder(newOrder);
  };
  const onDrop = () => {
    draggingId.current = null;
  };

  const orderedWidgets = order.map(id => widgets.find(w => w.id === id)).filter(Boolean);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {orderedWidgets.map(w => (
        <div
          key={w.id}
          draggable
          onDragStart={onDragStart(w.id)}
          onDragOver={onDragOver(w.id)}
          onDrop={onDrop}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'grab', fontWeight: 700, color: '#374151' }}>
            {w.title}
          </div>
          <div style={{ padding: 12 }}>
            {w.render?.()}
          </div>
        </div>
      ))}
    </div>
  );
}
