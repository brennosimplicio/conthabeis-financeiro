'use client';
import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colorMap = {
    blue: 'var(--accent-blue)',
    green: 'var(--accent-green)',
    amber: 'var(--accent-amber)',
    red: 'var(--accent-red)',
    purple: 'var(--accent-purple)'
  };

  return (
    <div className={`card stat-card ${color}`}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
        {Icon && <div style={{ 
          background: `rgba(${color === 'green' ? '16,185,129' : color === 'amber' ? '245,158,11' : color === 'red' ? '239,68,68' : '59,130,246'}, 0.1)`, 
          padding: '0.5rem', 
          borderRadius: '50%',
          display: 'flex'
        }}>
          <Icon size={20} color={colorMap[color]} />
        </div>}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
