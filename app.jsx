// app.jsx
// Main application - loads and manages views

const { useState, useEffect } = React;

// View Registry - Add new views here
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
};

// Settings Modal Component
function SettingsModal({ sources, onClose, onSourcesChange }) {
  const [localSources, setLocalSources] = useState(sources);
  const [isScanning, setIsScanning] = useState(false);

  const handleToggleSource = (sourceId) => {
    setLocalSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleRemoveSource = (sourceId) => {
    setLocalSources(prev => prev.filter(s => s.id !== sourceId));
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const newSource = {
          id: `uploaded_${Date.now()}`,
          name: json.name || file.name.replace('.json', ''),
          filename: file.name,
          type: 'uploaded',
          enabled: true,
          data: json
        };
        setLocalSources(prev => [...prev, newSource]);
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };
  
  const handleScanLocal = async () => {
    setIsScanning(true);
    const found = await scanLocalBoards();
    if (found.length > 0) {
      setLocalSources(prev => {
        const existing = prev.filter(s => s.type !== 'local');
        const newLocal = found.map(f => ({ ...f, enabled: true }));
        return [...existing, ...newLocal];
      });
    } else {
      alert('No .trello.json files found in ./data/ directory');
    }
    setIsScanning(false);
  };
  
  const handleSave = () => {
    onSourcesChange(localSources);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Data Sources</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-auto flex-1">
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Add Sources</h3>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 flex items-center gap-2">
                <Upload size={18} />
                Upload JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleScanLocal}
                disabled={isScanning}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                <File size={18} />
                {isScanning ? 'Scanning...' : 'Scan ./data/'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Place *.trello.json files in ./data/ directory and click Scan
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Available Sources ({localSources.length})</h3>
            {localSources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sources available. Upload a JSON or scan ./data/ directory.
              </div>
            ) : (
              <div className="space-y-2">
                {localSources.map(source => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={() => handleToggleSource(source.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-gray-500">
                          {source.type === 'local' ? '📁 Local' : '📤 Uploaded'} • {source.filename}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSource(source.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function TrelloViewApp() {
  const [sources, setSources] = useState([]);
  const [trelloData, setTrelloData] = useState(null);
  const [activeView, setActiveView] = useState('browse');
  const [showSettings, setShowSettings] = useState(false);
  
  // Load sources from localStorage on mount
  useEffect(() => {
    const stored = Storage.getSources();
    setSources(stored);
    
    // If no stored sources, scan for local boards
    if (stored.length === 0) {
      scanLocalBoards().then(found => {
        if (found.length > 0) {
          const withEnabled = found.map(f => ({ ...f, enabled: true }));
          setSources(withEnabled);
          Storage.saveSources(withEnabled);
        }
      });
    }
  }, []);
  
  // Combine enabled sources whenever sources change
  useEffect(() => {
    const enabled = sources.filter(s => s.enabled);
    if (enabled.length === 0) {
      setTrelloData(null);
      return;
    }
    
    // Merge all enabled sources
    const allCards = [];
    const allLists = {};
    
    enabled.forEach(source => {
      const parsed = parseTrelloData(source.data);
      allCards.push(...parsed);
      
      // Also merge lists
      source.data.lists.forEach(list => {
        allLists[list.id] = list.name;
      });
    });
    
    setTrelloData({
      cards: allCards,
      raw: enabled.length === 1 ? enabled[0].data : null,
      sources: enabled
    });
  }, [sources]);
  
  const handleSourcesChange = (newSources) => {
    setSources(newSources);
    Storage.saveSources(newSources);
  };
  
  if (!trelloData || sources.filter(s => s.enabled).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Trello View Framework</h1>
          <p className="text-gray-600 mb-4">
            No data sources enabled. Click Settings to add boards.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Settings size={20} />
            Open Settings
          </button>
          {sources.length > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              You have {sources.length} source(s) available but disabled
            </p>
          )}
        </div>
        
        {showSettings && (
          <SettingsModal
            sources={sources}
            onClose={() => setShowSettings(false)}
            onSourcesChange={handleSourcesChange}
          />
        )}
      </div>
    );
  }
  
  const ViewComponent = ViewRegistry[activeView].component;
  const enabledCount = sources.filter(s => s.enabled).length;
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trello Views</h1>
          <p className="text-sm text-gray-600">
            {trelloData.cards.length} cards from {enabledCount} source{enabledCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 mr-4">
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
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <ViewComponent cards={trelloData.cards} rawData={trelloData.raw} />
      </main>
      
      {showSettings && (
        <SettingsModal
          sources={sources}
          onClose={() => setShowSettings(false)}
          onSourcesChange={handleSourcesChange}
        />
      )}
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TrelloViewApp));