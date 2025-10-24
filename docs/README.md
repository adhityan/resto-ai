# Documentation

This directory contains all documentation for the Stripe Monorepo project.

## Available Documentation

### [API Documentation](./API.md)
Complete API reference for all backend endpoints including:
- Authentication & Authorization
- Application Management
- Product Management
- Customer Management
- Checkout Sessions
- User Management
- Statistics & Analytics

The API documentation provides detailed information about:
- Request/response formats
- Authentication requirements
- Query parameters
- Validation rules
- Error handling
- Example requests and responses

---

## Quick Links

- **[API Documentation](./API.md)** - Complete backend API reference

---

## Getting Started

To use the API, you'll need to:

1. **Authenticate**: Obtain a JWT token via `/auth/user/login` (for admin users) or `/auth/app/token` (for app-to-app communication)
2. **Include token in headers**: Add `Authorization: Bearer <token>` to all authenticated requests
3. **Refer to endpoint documentation**: Check the API.md file for detailed endpoint specifications

---

## Contributing

When adding new endpoints or modifying existing ones:
1. Update the API documentation in `API.md`
2. Follow the existing documentation format
3. Include request/response examples
4. Document all validation rules and error cases

---

*For more information, see the main [project README](../README.md)*

