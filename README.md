# Pydantic AI Django Project - In Progress

A modern web application built with Django, Pydantic, and ASGI, utilizing FastAPI-style typing with Django's powerful ORM.

## Project Structure

```
.
├── apps/
│   ├── backend/           # Django + ASGI backend application
│   │   ├── api/          # REST API endpoints
│   │   ├── chat/         # WebSocket chat functionality
│   │   └── config/       # Project settings and ASGI configuration
│   └── frontend/         # Next.js frontend application
├── packages/
│   ├── chat-widget/      # Reusable chat widget component
│   ├── types/            # Shared TypeScript types
│   └── ui/              # Shared UI component library
└── infrastructure/       # Docker and deployment configurations
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- Docker and Docker Compose
- pnpm (Package manager)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd pydantic-ai-django
```

2. Install dependencies and build packages:

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all JavaScript dependencies
pnpm install

# Build all packages
pnpm build

# Install Python dependencies
cd apps/backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
# Copy example env file
cp infrastructure/.env.example infrastructure/.env
```

4. Start the development environment:

```bash
# Start infrastructure services
cd infrastructure
docker-compose up -d

# Start backend
cd ../apps/backend
uvicorn config.asgi:application --reload --host 0.0.0.0 --port 8000

# Start frontend (in a new terminal)
cd ../frontend
pnpm dev
```

## Development

### Package Development

Before running the applications, ensure all packages are built:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @your-scope/package-name build
```

Watch mode for package development:

```bash
pnpm --filter @your-scope/package-name watch
```

### Backend (Django + ASGI)

The backend combines Django's ORM with ASGI for high-performance async operations:

- REST API endpoints with Pydantic models for type safety
- WebSocket-based chat functionality
- PostgreSQL database
- MinIO for object storage

Key features:

- FastAPI-style type hints and validation using Pydantic
- ASGI for handling both HTTP and WebSocket connections
- Django ORM for database operations
- Async support throughout the application

To run tests:

```bash
cd apps/backend
pytest
```

### Frontend (Next.js)

The frontend is built with Next.js and includes:

- Modern React with TypeScript
- TailwindCSS for styling
- Integration with the chat widget

To run tests:

```bash
cd apps/frontend
pnpm test
```

### Packages

#### chat-widget

A reusable chat widget component that can be integrated into any React application.

To build:

```bash
pnpm --filter @your-scope/chat-widget build
```

#### types

Shared TypeScript types used across the frontend applications.

To build:

```bash
pnpm --filter @your-scope/types build
```

#### ui

A shared UI component library with:

- Common UI components (Button, Input, etc.)
- Consistent styling using TailwindCSS

To build:

```bash
pnpm --filter @your-scope/ui build
```

## Infrastructure

The project uses Docker Compose for local development infrastructure:

- PostgreSQL database
- MinIO object storage

Configuration files are located in the `infrastructure/` directory.

## API Documentation

The API documentation is automatically generated and can be accessed at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## WebSocket Endpoints

WebSocket connections are available at:

- Chat: ws://localhost:8000/ws/chat/

## Message Format Documentation

### WebSocket Messages

Messages sent and received through the WebSocket connection follow this format:

```typescript
interface WebSocketMessage {
  type: string; // Message type identifier
  role: string; // 'user' or 'assistant'
  message: string; // The actual message content
  timestamp: Date | string; // Message timestamp
  metadata?: {
    context_used?: boolean; // Whether context was used in generating the response
    confidence?: number; // Confidence score of the response (0.0 to 1.0)
    error?: "timeout" | "cancelled" | "system_error"; // Error type if applicable
    tool_results?: ToolResult[]; // Results from tool operations
    selected_product?: ProductResult; // Selected product information
  };
}
```

### Chat Messages

Internal message representation in the chat widget:

```typescript
interface Message {
  id: string; // Unique message identifier
  type: "message" | "loading"; // Message type
  content: string; // Message content
  sender: string; // Message sender
  timestamp: Date; // Message timestamp
  status: "sent" | "sending" | "error"; // Message status
  metadata?: {
    context_used?: boolean;
    confidence?: number;
    error?: "timeout" | "cancelled" | "system_error";
    tool_results?: ToolResult[];
    selected_product?: ProductResult;
  };
}
```

### Tool Results

Format for tool operation results:

```typescript
interface ToolResult {
  tool: string; // Name of the tool used
  result: string; // Result of the tool operation
}
```

### Product Results

Format for individual product results:

```typescript
interface ProductResult {
  category: string; // Product category
  name: string; // Product name
  description: string; // Product description
  price: number; // Product price
  signed_url?: string; // Optional URL for product image
  scores: {
    hybrid: number; // Hybrid search score
  };
}
```

### Product Search Results

Format for product search results:

```typescript
interface ProductSearchResult {
  data: ProductResult[]; // Array of product results
  metadata: {
    search_type: string; // Type of search performed
    total_results: number; // Total number of results
    weights?: {
      text: number; // Text search weight
      vector: number; // Vector search weight
    };
    error?: "timeout" | "cancelled" | "system_error";
  };
}
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Build all packages (`pnpm build`)
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
