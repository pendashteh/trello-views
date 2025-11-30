// Calendar view - displays cards on calendar based on start/due dates

const { useState } = React;

// View metadata for registration
const CalendarViewMeta = {
  name: 'Calendar',
  icon: Calendar,
  key: 'calendar'
};

// Main view component
function CalendarView({ cards }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const current = new Date(startDate);
  
  while (days.length < 42) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  const getCardsForDate = (date) => {
    return cards.filter(card => {
      if (!card.due && !card.start) return false;
      
      const dateStr = date.toDateString();
      const dueMatch = card.due && card.due.toDateString() === dateStr;
      const startMatch = card.start && card.start.toDateString() === dateStr;
      
      // Show card on dates between start and due
      if (card.start && card.due) {
        const time = date.getTime();
        const startTime = new Date(card.start).setHours(0,0,0,0);
        const dueTime = new Date(card.due).setHours(23,59,59,999);
        return time >= startTime && time <= dueTime;
      }
      
      return dueMatch || startMatch;
    });
  };
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 flex-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
        
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const dayCards = getCardsForDate(day);
          
          return (
            <div
              key={i}
              className={`bg-white p-2 min-h-24 ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
              <div className="space-y-1">
                {dayCards.map(card => {
                  const isStart = card.start && card.start.toDateString() === day.toDateString();
                  const isDue = card.due && card.due.toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={card.id}
                      className="text-xs p-1 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      title={card.name}
                    >
                      <div className="truncate font-medium">{card.name}</div>
                      {(isStart || isDue) && (
                        <div className="text-[10px] text-gray-600">
                          {isStart && '▶ Start'} {isDue && '◀ Due'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
