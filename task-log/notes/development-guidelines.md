# Development Guidelines

## TypeScript Best Practices

### Type Definitions

```typescript
// Use explicit types
const user: User = {
  id: string;
  name: string;
};

// Avoid any
function processData<T>(data: T): T {
  // Implementation
}
```

### React Components

```typescript
// Use functional components
const Button: React.FC<ButtonProps> = ({
  children,
  ...props
}) => {
  return <button {...props}>{children}</button>;
};

// Use proper prop types
interface Props {
  required: string;
  optional?: number;
}
```

## Python Best Practices

### Django Views

```python
# Use class-based views
from rest_framework.viewsets import ModelViewSet

class UserViewSet(ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
```

### API Responses

```python
# Consistent response format
def api_response(data, status=200, message=None):
    return Response({
        'data': data,
        'status': status,
        'message': message
    })
```

## Testing Guidelines

### Frontend Tests

```typescript
// Component testing
import { render, screen } from '@testing-library/react';

test('button renders correctly', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Backend Tests

```python
# API testing
class TestUserAPI(APITestCase):
    def test_create_user(self):
        response = self.client.post('/api/users/', {
            'username': 'test',
            'email': 'test@example.com'
        })
        self.assertEqual(response.status_code, 201)
```

## Git Workflow

### Commit Messages

```
feat: add user authentication
fix: resolve chat message ordering
docs: update API documentation
test: add user registration tests
```

### Branch Naming

```
feature/user-auth
bugfix/message-order
docs/api-docs
test/user-registration
```
