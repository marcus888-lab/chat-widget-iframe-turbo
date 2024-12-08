export interface BaseToolProps {
  sender: "user" | "assistant" | "system";
  timestamp: Date;
}

export interface CodeBlockProps extends BaseToolProps {
  language: string;
  code: string;
}

export interface ProductResult {
  category: string;
  name: string;
  description: string;
  price: number;
  signed_url?: string;
  scores: {
    hybrid: number;
  };
}

export interface SearchResultProps extends BaseToolProps {
  query: string;
  results: ProductResult[];
  onProductSelect?: (product: ProductResult) => void;
}

export interface ProductDetailProps extends BaseToolProps {
  product: ProductResult;
}

export interface TableViewProps extends BaseToolProps {
  headers: string[];
  rows: string[][];
}

export interface ToolMessageProps extends BaseToolProps {
  content: string;
}

export interface ToolResult {
  tool: string;
  result: string | Record<string, any>;
}
