import { useState } from 'react';
import { Power, Plus, Trash2 } from 'lucide-react';

export const WorkingHoursTab = ({ initialSettings }: any) => {
  const [isOpenManual, setIsOpenManual] = useState(initialSettings?.is_open_manual ?? true);
  const [hours, setHours] = useState<any>(initialSettings?.opening_hours || { 
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] 
  });

  const addShift = (day: string) => {
    setHours((prev: any) => ({
      ...prev,
      [day]: [...(prev[day] || []), { open: '18:00', close: '23:59' }]
    }));
  };

  return (
    <div className="space-y-10">
      {/* MASTER SWITCH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Status Manual da Loja</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sobrepõe os horários programados. Útil para emergências.
          </p>
        </div>
        <button 
          onClick={() => setIsOpenManual(!isOpenManual)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-900 dark:text-white transition-all w-full md:w-auto
            ${isOpenManual ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          <Power className="w-5 h-5" />
          {isOpenManual ? 'LOJA ABERTA' : 'LOJA FECHADA'}
        </button>
      </div>

      {/* GRADE DE HORÁRIOS */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Horários de Funcionamento</h3>
        <p className="text-sm text-amber-500 mb-6 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
          Dica: Se a sua loja vira a noite (ex: abre 18h e fecha 02h), não tem problema! 
          O nosso sistema entende automaticamente que 02h já faz parte da madrugada do dia seguinte.
        </p>

        {Object.keys(hours).map(day => (
          <div key={day} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-32 capitalize font-bold text-slate-700 dark:text-slate-300 pt-2">
              {day === 'monday' && 'Segunda-feira'}
              {day === 'tuesday' && 'Terça-feira'}
              {day === 'wednesday' && 'Quarta-feira'}
              {day === 'thursday' && 'Quinta-feira'}
              {day === 'friday' && 'Sexta-feira'}
              {day === 'saturday' && 'Sábado'}
              {day === 'sunday' && 'Domingo'}
            </div>
            
            <div className="flex-1 space-y-3">
              {(hours[day] || []).map((shift: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <input 
                    type="time" 
                    value={shift.open}
                    onChange={(e) => {
                      const newHours = {...hours};
                      newHours[day][index].open = e.target.value;
                      setHours(newHours);
                    }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-slate-500">até</span>
                  <input 
                    type="time" 
                    value={shift.close}
                    onChange={(e) => {
                      const newHours = {...hours};
                      newHours[day][index].close = e.target.value;
                      setHours(newHours);
                    }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => {
                      const newHours = {...hours};
                      newHours[day].splice(index, 1);
                      setHours(newHours);
                    }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addShift(day)}
                className="text-indigo-400 text-sm font-bold flex items-center gap-1 hover:text-indigo-300"
              >
                <Plus className="w-4 h-4" /> Adicionar Turno
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
