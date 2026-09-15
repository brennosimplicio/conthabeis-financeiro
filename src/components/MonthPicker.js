'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthPicker({ ano, mes, onChange }) {
  // If not provided, fallback to current
  const currentAno = ano || new Date().getFullYear();
  const currentMes = mes || new Date().getMonth() + 1;

  const handlePrev = () => {
    let newMes = currentMes - 1;
    let newAno = currentAno;
    if (newMes < 1) {
      newMes = 12;
      newAno -= 1;
    }
    if (onChange) onChange(newAno, newMes);
  };

  const handleNext = () => {
    let newMes = currentMes + 1;
    let newAno = currentAno;
    if (newMes > 12) {
      newMes = 1;
      newAno += 1;
    }
    if (onChange) onChange(newAno, newMes);
  };

  return (
    <div className="flex-center gap-4" style={{ marginBottom: '2rem' }}>
      <button className="btn btn-ghost" onClick={handlePrev}>
        <ChevronLeft size={24} />
      </button>
      <h2 style={{ minWidth: '200px', textAlign: 'center', margin: 0 }}>
        {months[currentMes - 1]} {currentAno}
      </h2>
      <button className="btn btn-ghost" onClick={handleNext}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
