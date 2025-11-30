// Shared utilities for all views

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

// Utility: Fuzzy search function
function fuzzyMatch(text, search) {
  if (!search) return true;
  
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Simple substring match
  if (textLower.includes(searchLower)) return true;
  
  // Fuzzy match: all characters in search appear in order in text
  let searchIndex = 0;
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === searchLower.length;
}

// Storage utilities for settings persistence
const Storage = {
  SOURCES_KEY: 'trello_view_sources',
  
  getSources() {
    try {
      const stored = localStorage.getItem(this.SOURCES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load sources from localStorage:', e);
      return [];
    }
  },
  
  saveSources(sources) {
    try {
      localStorage.setItem(this.SOURCES_KEY, JSON.stringify(sources));
    } catch (e) {
      console.error('Failed to save sources to localStorage:', e);
    }
  }
};

// Fetch JSON from ./data/ directory
async function loadLocalBoard(filename) {
  try {
    const response = await fetch(`./data/${filename}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error);
    return null;
  }
}

// Scan ./data/ directory for *.trello.json files
async function scanLocalBoards() {
  try {
    // Load the index.txt file that lists all board files
    const indexResponse = await fetch('./data/index.txt');
    if (!indexResponse.ok) {
      console.log('No data/index.txt found. Run ./update-data.sh to generate it.');
      return [];
    }
    
    const indexText = await indexResponse.text();
    const filenames = indexText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.endsWith('.trello.json'));
    
    if (filenames.length === 0) {
      console.log('No .trello.json files found in data/index.txt');
      return [];
    }
    
    const found = [];
    for (const filename of filenames) {
      const data = await loadLocalBoard(filename);
      if (data) {
        found.push({
          id: `local_${filename}`,
          name: data.name || filename.replace('.trello.json', ''),
          filename: filename,
          type: 'local',
          enabled: true,
          data: data
        });
      } else {
        console.warn(`Failed to load ${filename} - file may not exist`);
      }
    }
    return found;
  } catch (error) {
    console.error('Failed to scan local boards:', error);
    return [];
  }
}

// Common icon components
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

const Search = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ExternalLink = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const Settings = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6m0-6h6m-6 0H6m9.4-6.4l4.2-4.2m-4.2 4.2l-4.2-4.2m4.2 14.8l4.2 4.2m-4.2-4.2l-4.2 4.2"></path>
  </svg>
);

const File = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

const X = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);