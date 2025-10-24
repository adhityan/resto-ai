# Environment Variables Setup Guide

This document describes all required environment variables for the backend service.

## Quick Start

Create a `.env` file in the `apps/backend` directory with the following variables:

```bash
# Application Settings
NODE_ENV=development
PORT=3000
GLOBAL_PATH_PREFIX=/api
BASE_URL=http://localhost:3000

# Security Settings
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long-change-me
JWT_TOKEN_EXPIRY=86400000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/stripe_db

# Zenchef Integration (for reservation management)
ZENCHEF_API_BASE_URL_V1=https://api.zenchef.com/api/v1
ZENCHEF_API_BASE_URL_V2=https://api.zenchef.com/api/v2
ZENCHEF_PUBLISHER_NAME=YourPublisherName
```

## Required Environment Variables

### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Node environment (`development`, `production`, `test`) |
| `PORT` | No | `3000` | Server port |
| `GLOBAL_PATH_PREFIX` | No | `/api` | Global API path prefix |
| `BASE_URL` | No | - | Base URL of the application (used for Stripe redirects) |

### Security Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET_KEY` | **YES** | - | JWT secret key (**minimum 32 characters**) |
| `JWT_TOKEN_EXPIRY` | **YES** | - | JWT token expiry in milliseconds (e.g., `86400000` for 24 hours) |

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://localhost:3001` | Comma-separated list of allowed origins |

### Stripe Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | **YES** | - | Stripe API secret key (test: `sk_test_...`, live: `sk_live_...`) |

### Zenchef Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZENCHEF_API_BASE_URL_V1` | **YES** | - | Zenchef API v1 base URL (prod: `https://api.zenchef.com/api/v1`, test: `https://api.preproduction.zenchef.io/api/v1`) |
| `ZENCHEF_API_BASE_URL_V2` | **YES** | - | Zenchef API v2 base URL (prod: `https://api.zenchef.com/api/v2`, test: `https://api.preproduction.zenchef.io/api/v2`) |
| `ZENCHEF_PUBLISHER_NAME` | **YES** | - | Publisher name provided by Zenchef |

**Note**: Each restaurant also needs `zenchefId` and `apiToken` configured in the database. Restaurants can find these credentials in their Zenchef dashboard under Settings > Partners.

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **YES** | - | PostgreSQL connection URL |

## Security Best Practices

### 1. JWT Secret Key

- **MUST** be at least 32 characters long (enforced by validation)
- Generate using: `openssl rand -base64 32`
- Use different secrets for development, staging, and production
- Rotate regularly (at least every 90 days)
- **NEVER** commit to version control

### 2. JWT Token Expiry

- Development: 24 hours (`86400000` ms) is acceptable
- Production: Consider shorter expiry (1-4 hours: `3600000` - `14400000` ms)
- Balance security with user experience

### 3. CORS Configuration

- **Development**: Use specific localhost URLs (e.g., `http://localhost:5173,http://localhost:3001`)
- **Production**: Only include your production domains (e.g., `https://app.example.com,https://admin.example.com`)
- **NEVER** use `*` in production

### 4. Stripe Keys

- **Development/Staging**: Use test keys (`sk_test_...`)
- **Production**: Use live keys (`sk_live_...`)
- Rotate keys if compromised
- Monitor Stripe dashboard for suspicious activity
- **NEVER** commit live keys to version control

### 5. Database Security

- Use strong passwords (minimum 16 characters, mixed case, numbers, special characters)
- Apply principle of least privilege to database user
- Use SSL/TLS for database connections in production
- Regular backups and point-in-time recovery

## Production Deployment Checklist

Before deploying to production, verify:

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET_KEY` is at least 32 characters and randomly generated
- [ ] `JWT_TOKEN_EXPIRY` is set to 1-4 hours (3600000-14400000 ms)
- [ ] `ALLOWED_ORIGINS` contains only production domains (no localhost, no `*`)
- [ ] `STRIPE_SECRET_KEY` is a live key (`sk_live_...`)
- [ ] `DATABASE_URL` points to production database with SSL enabled
- [ ] HTTPS is configured at load balancer/reverse proxy level
- [ ] All secrets are unique and not shared with other environments
- [ ] Rate limiting is enabled (100 req/15min)
- [ ] Helmet security headers are enabled
- [ ] Database user has minimal required privileges
- [ ] Regular automated backups are configured
- [ ] Monitoring and alerting are set up
- [ ] Error logging is configured (but doesn't log sensitive data)
- [ ] Swagger UI is disabled in production (automatic)

## Security Features Implemented

The following security measures are automatically enforced by the backend:

### Request Security
- ✅ Rate limiting: 100 requests per 15 minutes per IP
- ✅ Request body size limit: 1MB (prevents DoS attacks)
- ✅ Input validation with whitelist (rejects unknown properties)
- ✅ Input length validation (prevents buffer overflow attacks)

### Password Security
- ✅ Minimum 8 characters required
- ✅ Must contain uppercase, lowercase, and number
- ✅ Bcrypt hashing with 10 salt rounds
- ✅ Password never logged or exposed in errors

### Authentication Security
- ✅ JWT with HS256 algorithm
- ✅ Configurable token expiry
- ✅ Bearer token authentication
- ✅ Global authentication guard

### Headers Security (Helmet)
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (prevents clickjacking)
- ✅ X-Content-Type-Options (prevents MIME sniffing)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-XSS-Protection

### Data Security
- ✅ No SQL injection (Prisma ORM type-safe queries)
- ✅ CORS with origin validation
- ✅ Error handler prevents stack trace leakage
- ✅ Sensitive data sanitization in logs

## Troubleshooting

### Environment Validation Errors

If you see validation errors on startup:

```
Environment validation failed:
JWT_SECRET_KEY must be at least 32 characters long for security
```

**Solution**: Ensure your `JWT_SECRET_KEY` is at least 32 characters. Generate a new one:
```bash
openssl rand -base64 32
```

### CORS Errors

If you see CORS errors in the browser:

```
Not allowed by CORS
```

**Solution**: Add your frontend URL to `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,https://yourfrontend.com
```

### Rate Limit Errors

If you see "Too Many Requests" (429):

```
Rate limit exceeded. Please try again later.
```

**Solution**: Wait 15 minutes or adjust rate limits in `apps/backend/src/main.ts` if needed for development.

## Additional Resources

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

