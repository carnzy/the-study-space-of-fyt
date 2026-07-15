import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CalendarProps {
  onSelectDate?: (date: string) => void;
}

export default function Calendar({ onSelectDate }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [postDates, setPostDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const { data } = await supabase.from('posts')
        .select('post_date').gte('post_date', `${prefix}-01`).lte('post_date', `${prefix}-31`);
      const dates = [...new Set(data?.map(p => p.post_date) || [])];
      setPostDates(dates);
    })();
  }, [year, month]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDay = firstDay.getDay();

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelected(todayStr); };

  const handleSelect = (d: number) => {
    const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    setSelected(ds);
    if (onSelectDate) onSelectDate(ds);
    else window.location.href = `/?date=${ds}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-sm font-semibold">{year}年 {month}月</span>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekDays.map(d => <div key={d} className="text-[11px] text-slate-400 font-semibold py-1">{d}</div>)}
        {/* 空白格 */}
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
        {/* 日期 */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const has = postDates.includes(ds);
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          return (
            <button key={d} onClick={() => handleSelect(d)}
              className={`aspect-square text-xs rounded-full flex items-center justify-center relative transition-colors
                ${isSel ? 'bg-indigo-500 text-white' : isToday ? 'font-bold text-indigo-500' : 'hover:bg-slate-100'}
              `}>
              {d}
              {has && !isSel && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </div>

      <button onClick={goToday} className="w-full mt-3 py-1.5 text-xs text-indigo-500 border border-slate-200 rounded-lg hover:bg-indigo-50">
        📍 回到今天
      </button>
    </div>
  );
}
