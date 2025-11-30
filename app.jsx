const { useState } = React;

// Lucide icons as simple SVG components
const Calendar = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const Upload = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const ChevronLeft = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

// Utility: Parse Trello JSON
function parseTrelloData(json) {
  const cards = json.cards.filter(c => !c.closed);
  const lists = json.lists.reduce((acc, list) => {
    acc[list.id] = list.name;
    return acc;
  }, {});
  
  return cards.map(card => ({
    id: card.id,
    name: card.name,
    desc: card.desc,
    list: lists[card.idList],
    listId: card.idList,
    due: card.due ? new Date(card.due) : null,
    start: card.start ? new Date(card.start) : null,
    labels: card.labels || [],
    url: card.shortUrl
  }));
}

// Calendar View Component
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

// Base architecture: ViewRegistry pattern
const ViewRegistry = {
  calendar: {
    name: 'Calendar View',
    icon: Calendar,
    component: CalendarView
  }
  // Add more views here as you build them
};

// Main App Component
function TrelloViewApp() {
  const [trelloData, setTrelloData] = useState(null);
  const [activeView, setActiveView] = useState('calendar');
  const [error, setError] = useState(null);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const cards = parseTrelloData(json);
        setTrelloData({ raw: json, cards });
        setError(null);
      } catch (err) {
        setError('Failed to parse JSON file. Make sure it\'s a valid Trello export.');
      }
    };
    reader.readAsText(file);
  };
  
  if (!trelloData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Trello View Framework</h1>
          <p className="text-gray-600 mb-4">Upload your Trello JSON export to begin</p>
          <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Choose JSON File
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>
    );
  }
  
  const ViewComponent = ViewRegistry[activeView].component;
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trello Views</h1>
          <p className="text-sm text-gray-600">{trelloData.cards.length} cards loaded</p>
        </div>
        
        <div className="flex gap-2">
          {Object.entries(ViewRegistry).map(([key, view]) => {
            const Icon = view.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeView === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                {view.name}
              </button>
            );
          })}
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <ViewComponent cards={trelloData.cards} rawData={trelloData.raw} />
      </main>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TrelloViewApp));
