import React from 'react';
import { CodeBlock } from './CodeBlock';
import { SearchResult } from './SearchResult';
import { TableView } from './TableView';
import type { ToolType, ToolMessageProps } from './index';

export const ToolMessage: React.FC<ToolMessageProps> = ({ type, data }) => {
  switch (type) {
    case 'code':
      return (
        <CodeBlock
          code={data.code}
          language={data.language}
        />
      );

    case 'search':
      return (
        <SearchResult
          query={data.query}
          results={data.results}
        />
      );

    case 'table':
      return (
        <TableView
          columns={data.columns}
          data={data.rows}
          caption={data.caption}
        />
      );

    case 'chart':
      // TODO: Implement ChartView component
      return (
        <div className="tool-message chart-view">
          <p>Chart view coming soon...</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );

    default:
      return (
        <div className="tool-message unknown-type">
          <p>Unknown tool type: {type}</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
  }
};
