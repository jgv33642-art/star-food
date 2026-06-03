/**
 * Valida se o estabelecimento está aberto baseado no horário atual e no JSON de configuração.
 * O JSON de opening_hours tem a estrutura:
 * {
 *   "monday": [{ "open": "18:00", "close": "23:59" }],
 *   "friday": [{ "open": "18:00", "close": "02:00" }]
 * }
 */
export function checkIfCurrentTimeIsInSchedule(
  openingHours: Record<string, Array<{ open: string; close: string }>>,
  currentTimeDate?: Date
): boolean {
  if (!openingHours) return true; // Se não houver configuração, assume aberto

  const now = currentTimeDate || new Date();
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayStr = days[now.getDay()];
  const previousDayStr = days[(now.getDay() + 6) % 7]; // Dia anterior para checar madrugada

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Função auxiliar para converter "HH:MM" em minutos totais
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // 1. Checar horários configurados para HOJE
  const todaySchedules = openingHours[currentDayStr] || [];
  for (const shift of todaySchedules) {
    if (!shift.open || !shift.close) continue;
    const openMins = timeToMinutes(shift.open);
    const closeMins = timeToMinutes(shift.close);

    if (closeMins >= openMins) {
      // Turno normal (ex: 10:00 às 22:00)
      if (currentTotalMinutes >= openMins && currentTotalMinutes <= closeMins) {
        return true;
      }
    } else {
      // Turno que vira a madrugada para o dia seguinte (ex: 18:00 às 02:00)
      // Se estamos HOJE, a loja está aberta a partir das 18:00 até as 23:59
      if (currentTotalMinutes >= openMins) {
        return true;
      }
    }
  }

  // 2. Checar horários configurados para ONTEM (que podem ter virado a madrugada de hoje)
  const yesterdaySchedules = openingHours[previousDayStr] || [];
  for (const shift of yesterdaySchedules) {
    if (!shift.open || !shift.close) continue;
    const openMins = timeToMinutes(shift.open);
    const closeMins = timeToMinutes(shift.close);

    // Se o turno de ontem fechava DEPOIS da meia-noite (closeMins < openMins)
    if (closeMins < openMins) {
      // Estamos na madrugada do dia de hoje (ex: 01:00 am). O limite de fechamento é closeMins.
      if (currentTotalMinutes <= closeMins) {
        return true;
      }
    }
  }

  return false;
}
