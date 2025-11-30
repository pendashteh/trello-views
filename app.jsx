// Main application - loads and manages views

const { useState } = React;

// View Registry - Add new views here
// Each view file exports ViewMeta and a component function
const ViewRegistry = {
  browse: {
    name: BrowseViewMeta.name,
    icon: BrowseViewMeta.icon,
    component: BrowseView
  },
  calendar: {
    name: CalendarViewMeta.name,
    icon: CalendarViewMeta.icon,
    component: CalendarView
  }
  // To add a new view:
  // 1. Create views/myview.jsx following the template
  // 2. Add <script> tag in index.html
  // 3. Add entry here: myview: { name: MyViewMeta.name, icon: MyViewMeta.icon, component: MyView }
};

// Main App Component
function TrelloViewApp() {
  const [trelloData, setTrelloData] = useState(null);
  const [activeView, setActiveView] = useState('browse');
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
