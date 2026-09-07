'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthPicker({ onChange }) {
  const [date, setDate] = useState(() => {
    const now = new Date();
    return { mes: now.getMonth() + 1, ano: now.getFullYear() };
  });

  const handlePrev = () => {
    setDate(prev => {
      let newMes = prev.mes - 1;
      let newAno = prev.ano;
      if (newMes < 1) {
        newMes = 12;
        newAno -= 1;
      }
      if (onChange) onChange(newAno, newMes);
      return { mes: newMes, ano: newAno };
    });
  };

  const handleNext = () => {
    setDate(prev => {
      let newMes = prev.mes + 1;
      let newAno = prev.ano;
      if (newMes > 12) {
        newMes = 1;
        newAno += 1;
      }
      if (onChange) onChange(newAno, newMes);
      return { mes: newMes, ano: newAno };
    });
  };

  return (
    <div className="flex-center gap-4" style={{ marginBottom: '2rem' }}>
      <button className="btn btn-ghost" onClick={handlePrev}>
        <ChevronLeft size={24} />
      </button>
      <h2 style={{ minWidth: '200px', textAlign: 'center', margin: 0 }}>
        {months[date.mes - 1]} {date.ano}
      </h2>
      <button className="btn btn-ghost" onClick={handleNext}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
