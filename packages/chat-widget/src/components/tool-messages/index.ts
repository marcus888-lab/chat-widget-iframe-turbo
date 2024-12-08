export { CodeBlock } from './CodeBlock';
export { SearchResult } from './SearchResult';
export { TableView } from './TableView';
export { ToolMessage } from './ToolMessage';

// Define and export types
export type ToolType = 'code' | 'search' | 'table' | 'chart';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export interface SearchResultItem {
  title: string;
  description: string;
  url?: string;
  score?: number;
}

export interface SearchResultProps {
  query: string;
  results: SearchResultItem[];
}

export interface Column {
  key: string;
  title: string;
  width?: number;
}

export interface TableViewProps {
  columns: Column[];
  data: Record<string, any>[];
  caption?: string;
}

export interface ToolMessageProps {
  type: ToolType;
  data: any;
}
