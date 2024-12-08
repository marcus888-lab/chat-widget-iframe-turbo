import React from 'react';

interface SearchResultItem {
  title: string;
  description: string;
  url?: string;
  score?: number;
}

interface SearchResultProps {
  query: string;
  results: SearchResultItem[];
}

export const SearchResult: React.FC<SearchResultProps> = ({ query, results }) => {
  return (
    <div className="tool-message search-result">
      <div className="search-header">
        <span className="search-icon">🔍</span>
        <span className="search-query">Search results for: {query}</span>
      </div>
      <div className="search-results">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            {result.url ? (
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-title">
                {result.title}
              </a>
            ) : (
              <div className="result-title">{result.title}</div>
            )}
            <p className="result-description">{result.description}</p>
            {result.score !== undefined && (
              <div className="result-score">
                Relevance: {Math.round(result.score * 100)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
