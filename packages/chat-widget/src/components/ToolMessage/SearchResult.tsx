import React from "react";
import { SearchResultProps } from "./types";

export const SearchResult: React.FC<SearchResultProps> = ({
  query,
  results,
  sender,
  timestamp,
  onProductSelect,
}) => {
  if (!results || results.length === 0) {
    return (
      <div
        className={`search-result empty ${sender === "assistant" ? "ml-8" : "mr-8"}`}
      >
        <p className="text-secondary-600 dark:text-secondary-300">
          No matching products were found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div
      className={`search-result ${sender === "assistant" ? "ml-8" : "mr-8"}`}
    >
      <div className="search-results-content text-secondary-900 dark:text-secondary-100">
        <p className="mb-4">Here are some products that might interest you:</p>

        <div className="space-y-4">
          {results.map((product, index) => (
            <div key={`${product.name}-${index}`} className="product-item">
              <p className="text-base">
                {index + 1}.{" "}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onProductSelect?.(product);
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline cursor-pointer"
                  role="link"
                  aria-label={`View details for ${product.name}`}
                >
                  {product.name}
                </button>{" "}
                - {product.description} Price: ${product.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400">
          Please note that these are the results based on the search term "
          {query}".
        </p>
      </div>
      <div className="text-xs text-secondary-400 mt-2">
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SearchResult;
