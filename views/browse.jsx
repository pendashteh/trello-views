// Browse view - searchable card list with fuzzy matching

const { useState } = React;

// View metadata for registration
const BrowseViewMeta = {
  name: 'Browse',
  icon: Search,
  key: 'browse'
};

// Main view component
function BrowseView({ cards }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCards = cards.filter(card => 
    fuzzyMatch(card.name, searchQuery) || 
    fuzzyMatch(card.desc || '', searchQuery) ||
    fuzzyMatch(card.list || '', searchQuery)
  );
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search cards... (try fuzzy search like 'bgt rpt' for 'Budget Report')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            {filteredCards.length} result{filteredCards.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No cards found matching your search' : 'No cards available'}
          </div>
        ) : (
          filteredCards.map(card => <a key={card.id} href={card.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {card.name}
                  </h3>
                  {card.list && (
                    <p className="text-sm text-gray-500 mt-1">
                      📋 {card.list}
                    </p>
                  )}
                  {card.labels.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {card.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: label.color ? `${label.color}40` : '#e5e7eb',
                            color: label.color || '#6b7280'
                          }}
                        >
                          {label.name || label.color}
                        </span>
                      ))}
                    </div>
                  )}
                  {(card.due || card.start) && (
                    <div className="text-xs text-gray-500 mt-2">
                      {card.start && `Start: ${card.start.toLocaleDateString()}`}
                      {card.start && card.due && ' • '}
                      {card.due && `Due: ${card.due.toLocaleDateString()}`}
                    </div>
                  )}
                </div>
                <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                  <ExternalLink size={18} />
                </div>
              </div>
            </a>)
        )}
      </div>
    </div>
  );
}
