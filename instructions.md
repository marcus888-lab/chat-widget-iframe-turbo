# Development Instructions

## Setup Requirements

1. **Node.js Environment**

   - Node.js >= 18
   - PNPM >= 8.15.4 (required for monorepo management)
   - Enable corepack: `corepack enable`

2. **Python Environment**

   - Python >= 3.11
   - virtualenv or venv for isolation

3. **Docker Environment**
   - Docker Engine
   - Docker Compose V2

## Initial Setup

1. **Clone and Install**

   ```bash
   # Clone repository
   git clone <repository-url>
   cd pydantic-ai-django

   # Install dependencies
   pnpm install
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template
   cp infrastructure/.env.example infrastructure/.env

   # Edit environment variables
   vim infrastructure/.env
   ```

3. **Infrastructure Setup**
   ```bash
   # Start Docker services
   cd infrastructure
   docker-compose up -d
   ```

## Application Setup

1. **Django Backend Setup**

   ```bash
   # Create Python virtual environment
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate

   # Install Django and dependencies
   cd src/apps/backend
   pip install django djangorestframework django-cors-headers
   pip install psycopg2-binary python-dotenv

   # Create Django project
   django-admin startproject config .
   python manage.py startapp api

   # Run migrations
   python manage.py migrate
   ```

2. **Next.js Frontend Setup**

   ```bash
   # Create Next.js app with TypeScript and Tailwind
   cd src/apps/frontend
   pnpm create next-app . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"

   # Install additional dependencies
   pnpm add @tanstack/react-query axios
   pnpm add -D @types/node @types/react @typescript-eslint/eslint-plugin
   ```

3. **Turborepo v2 Setup**

   ```bash
   # Install latest Turborepo
   pnpm add -D turbo@latest

   # Initialize Turborepo (if needed)
   pnpm dlx create-turbo@latest

   # Install shared dependencies
   pnpm add -D @repo/eslint-config @repo/typescript-config -w
   ```

## Development Workflow

1. **Running Development Servers**

   ```bash
   # Start all services
   pnpm dev

   # Start specific service
   pnpm dev --filter=frontend
   pnpm dev --filter=backend
   ```

2. **Building Packages**

   ```bash
   # Build all packages
   pnpm build

   # Build specific package
   pnpm build --filter=@repo/ui
   ```

3. **Testing**

   ```bash
   # Run all tests
   pnpm test

   # Test specific package
   pnpm test --filter=@repo/chat-widget
   ```

4. **Linting**

   ```bash
   # Lint all code
   pnpm lint

   # Lint specific package
   pnpm lint --filter=frontend
   ```

## Package Development

1. **Creating New Package**

   ```bash
   cd src/packages
   mkdir my-package
   cd my-package
   pnpm init
   ```

2. **Adding Dependencies**

   ```bash
   # Add to specific package
   pnpm add <package> --filter=@repo/ui

   # Add as dev dependency
   pnpm add -D <package> --filter=@repo/types
   ```

## Project Structure

```
src/
├── apps/
│   ├── backend/              # Django application
│   │   ├── api/             # REST API
│   │   ├── config/          # Django settings
│   │   └── manage.py
│   └── frontend/            # Next.js application
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       └── next.config.js
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/              # Shared TypeScript types
│   └── chat-widget/        # Chat widget package
└── infrastructure/         # Docker configs
```

## Troubleshooting

1. **Clean Build**

   ```bash
   pnpm clean
   pnpm install
   pnpm build
   ```

2. **Cache Issues**

   ```bash
   # Clear Turborepo cache
   rm -rf ./node_modules/.cache/turbo
   ```

3. **Django Issues**

   ```bash
   # Reset migrations
   find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
   find . -path "*/migrations/*.pyc" -delete
   python manage.py makemigrations
   python manage.py migrate --fake-initial
   ```

4. **Next.js Issues**

   ```bash
   # Clear Next.js cache
   rm -rf .next
   rm -rf node_modules/.cache
   ```

## Common Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm build                  # Build all packages
pnpm lint                   # Lint all code
pnpm test                   # Run all tests

# Django
python manage.py shell      # Django shell
python manage.py dbshell    # Database shell
python manage.py createsuperuser  # Create admin user

# Next.js
pnpm dlx next info         # Show Next.js info
pnpm run build --filter=frontend  # Build frontend only

# Turborepo
pnpm turbo run build --filter=frontend  # Run specific task
pnpm turbo gen workspace    # Generate new workspace
```
