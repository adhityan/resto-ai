# Stripe Monorepo API Documentation

Complete API documentation for the Payments Admin application backend.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication & Authorization](#authentication--authorization)
  - [Applications](#applications)
  - [Products](#products)
  - [Customers](#customers)
  - [Sessions](#sessions)
  - [Payments](#payments)
  - [Users](#users)
  - [Statistics](#statistics)

---

## Overview

This API provides endpoints for managing applications, products, customers, checkout sessions, users, and viewing statistics for a Stripe-based payment system.

**Base URL:** `http://localhost:3000` (development)

**API Version:** 1.0

**Date Format:** All timestamps follow ISO 8601 format (e.g., `2024-12-16T10:30:00Z`)

---

## Authentication

Most endpoints require authentication using JWT tokens. There are two types of authentication:

### 1. User Authentication (Admin)
Used for admin panel access.

**How to authenticate:**
```
Authorization: Bearer <jwt_token>
```

### 2. App Authentication
Used for application-to-application communication.

**How to authenticate:**
```
Authorization: Bearer <app_jwt_token>
```

---

## Error Handling

### Standard Error Responses

All endpoints may return the following error responses:

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Invalid or missing authentication token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error - Server error |

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "statusCode": 401,
  "message": "Detailed error message (optional)"
}
```

---

## API Endpoints

---

## Health Check

### GET `/`

**Description:** Health check endpoint to verify the API is running.

**Authentication:** Public

**Response:**
```
Payments Admin API is running
```

**Status Codes:**
- `200` - API is running successfully

---

## Authentication & Authorization

### POST `/auth/user/login`

**Description:** Authenticate a user (admin) with email and password.

**Authentication:** Public

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiryDate": "2024-12-17T10:30:00Z",
  "entity": {
    "id": "user_abc123",
    "name": "John Admin",
    "email": "admin@example.com",
    "type": "ADMIN",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials

---

### POST `/auth/user/register`

**Description:** Register a new user (admin only).

**Authentication:** Admin only

**Request Body:**
```json
{
  "name": "Jane Admin",
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `name` is required, must be less than 100 characters, and contain only letters and spaces
- `email` is required and must be a valid email (less than 255 characters)
- `password` is required, must be 8-128 characters, and contain at least one uppercase letter, one lowercase letter, and one number

**Response:**
```json
{
  "id": "user_new123",
  "user": {
    "id": "user_new123",
    "name": "Jane Admin",
    "email": "jane@example.com",
    "type": "ADMIN",
    "createdAt": "2024-12-16T10:30:00Z"
  }
}
```

**Status Codes:**
- `200` - User created successfully
- `400` - Invalid input data
- `409` - User already exists

---

### POST `/auth/app/token`

**Description:** Get an access token for application authentication.

**Authentication:** Public

**Request Body:**
```json
{
  "clientId": "client_abc123",
  "clientSecret": "secret_xyz789"
}
```

**Validation:**
- `clientId` is required, must be a string less than 100 characters
- `clientSecret` is required, must be a string less than 200 characters

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiryDate": "2024-12-17T10:30:00Z",
  "entity": {
    "id": "app_abc123",
    "name": "My Application",
    "basePath": "/my-app",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-12-15T14:20:00Z"
  }
}
```

**Status Codes:**
- `200` - Authentication successful
- `401` - Invalid client credentials

---

### POST `/auth/app/authentication`

**Description:** Create new authentication credentials for an application.

**Authentication:** Admin only

**Request Body:**
```json
{
  "appId": "app_abc123"
}
```

**Response:**
```json
{
  "id": "auth_new789",
  "clientId": "client_generated123",
  "clientSecret": "secret_generated456",
  "appId": "app_abc123",
  "createdAt": "2024-12-16T10:15:00Z"
}
```

**Notes:**
- Client credentials are auto-generated
- Client secret is only returned once during creation
- Store the client secret securely
- New authentications are created as active by default

**Status Codes:**
- `200` - Authentication created successfully
- `404` - App not found

---

### GET `/auth/refresh`

**Description:** Refresh an existing access token.

**Authentication:** Authenticated (user or app)

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "entityId": "user_abc123",
  "entityType": "ADMIN",
  "expiryDate": "2024-12-17T10:30:00Z"
}
```

**Notes:**
- `entityType` can be "ADMIN", "USER", or "APP"
- `entityId` is the ID of the authenticated user or app

**Status Codes:**
- `200` - Token refreshed successfully
- `401` - Invalid or expired token

---

### PATCH `/auth/user/change-password`

**Description:** Change the password for the authenticated user.

**Authentication:** Authenticated user

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Validation:**
- `currentPassword` is required, must be less than 128 characters
- `newPassword` is required, must be 8-128 characters, and contain at least one uppercase letter, one lowercase letter, and one number

**Response:**
```json
{
  "status": "success"
}
```

**Status Codes:**
- `200` - Password changed successfully
- `401` - Current password is incorrect
- `400` - Invalid new password

---

### GET `/auth/user/`

**Description:** Get the currently authenticated user's profile.

**Authentication:** Authenticated user

**Response:**
```json
{
  "id": "user_abc123",
  "name": "John Admin",
  "email": "admin@example.com",
  "type": "ADMIN",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated

---

## Applications

### GET `/apps`

**Description:** List all applications with their active product counts.

**Authentication:** Admin only

**Response:**
```json
[
  {
    "id": "app_abc123",
    "name": "My Application",
    "basePath": "/my-app",
    "isActive": true,
    "activeProductsCount": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-12-15T14:20:00Z"
  },
  {
    "id": "app_def456",
    "name": "Another App",
    "basePath": "/another",
    "isActive": true,
    "activeProductsCount": 3,
    "createdAt": "2024-02-20T11:00:00Z",
    "updatedAt": "2024-12-10T09:15:00Z"
  }
]
```

**Notes:**
- `activeProductsCount`: Count of related products where `isActive = true`
- Use `GET /products?appId=:appId` to fetch the actual products

**Status Codes:**
- `200` - Success

---

### GET `/apps/:id`

**Description:** Get details of a specific application.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Application ID

**Response:**
```json
{
  "id": "app_abc123",
  "name": "My Application",
  "basePath": "/my-app",
  "isActive": true,
  "activeProductsCount": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-15T14:20:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Application not found

---

### POST `/apps`

**Description:** Create a new application.

**Authentication:** Admin only

**Request Body:**
```json
{
  "name": "My New App",
  "basePath": "/new-app"
}
```

**Validation:**
- `name` is required and must be less than 100 characters
- `basePath` is required and must be less than 500 characters

**Response:**
```json
{
  "id": "app_new123",
  "name": "My New App",
  "basePath": "/new-app",
  "isActive": true,
  "activeProductsCount": 0,
  "createdAt": "2024-12-16T09:15:00Z",
  "updatedAt": "2024-12-16T09:15:00Z"
}
```

**Status Codes:**
- `201` - Application created successfully
- `400` - Invalid input data

---

### PATCH `/apps/:id`

**Description:** Update an application's details.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Application ID

**Request Body:**
```json
{
  "name": "Updated App Name",
  "basePath": "/updated-path",
  "isActive": false
}
```

**Validation:**
- All fields are optional
- `name` must be less than 100 characters if provided
- `basePath` must be less than 500 characters if provided
- `isActive` must be a boolean if provided

**Notes:**
- All fields are optional
- You can update any combination of fields

**Response:**
```json
{
  "id": "app_abc123",
  "name": "Updated App Name",
  "basePath": "/updated-path",
  "isActive": false,
  "activeProductsCount": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-16T10:00:00Z"
}
```

**Status Codes:**
- `200` - Application updated successfully
- `404` - Application not found
- `400` - Invalid input data

---

### GET `/apps/:id/authentications`

**Description:** Get all authentication credentials for a specific application.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Application ID

**Response:**
```json
[
  {
    "id": "auth_456",
    "clientId": "client_abc123",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "auth_789",
    "clientId": "client_def456",
    "isActive": true,
    "createdAt": "2024-03-20T14:00:00Z"
  }
]
```

**Notes:**
- Client secrets are never returned for security reasons (except on creation)
- Only returns authentications that belong to the specified app
- `appId` is not included in the response since it's already known from the request path

**Status Codes:**
- `200` - Success
- `404` - Application not found

---

## Products

### GET `/products`

**Description:** Get a paginated list of all products with optional filtering by application.

**Authentication:** Admin only

**Query Parameters:**
- `appId` (string, optional) - Filter products by application ID
- `skip` (number, optional) - Number of items to skip for pagination (default: 0)
- `take` (number, optional) - Number of items to return (default: 10)

**Example Request:**
```
GET /products
GET /products?appId=app_abc123
GET /products?skip=0&take=20
GET /products?appId=app_abc123&skip=10&take=10
```

**Response:**
```json
{
  "items": [
    {
      "id": "prod_xyz789",
      "name": "Premium Plan",
      "description": "Full access to all features",
      "isActive": true,
      "remoteProductId": "remote_prod_123",
      "activePrice": {
        "id": "price_123",
        "price": 99.99,
        "currency": "USD",
        "interval": "MONTHLY"
      }
    },
    {
      "id": "prod_abc456",
      "name": "Basic Plan",
      "description": "Basic access",
      "isActive": true,
      "remoteProductId": "remote_prod_456",
      "activePrice": {
        "id": "price_456",
        "price": 29.99,
        "currency": "USD",
        "interval": "MONTHLY"
      }
    }
  ],
  "total": 2
}
```

**Notes:**
- Returns active products with pagination support
- If `appId` is provided, only returns products for that application
- Includes nested active price for each product
- Pagination is supported through `skip` and `take` parameters
- Total count is included in the response for pagination purposes

**Status Codes:**
- `200` - Success

---

### GET `/products/:id`

**Description:** Get details of a specific product.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Product ID

**Response:**
```json
{
  "id": "prod_xyz789",
  "name": "Premium Plan",
  "description": "Full access to all features",
  "isActive": true,
  "remoteProductId": "remote_prod_123",
  "activePrice": {
          "id": "price_123",
          "price": 99.99,
          "currency": "USD",
          "interval": "MONTHLY"
        }
}
```

**Status Codes:**
- `200` - Success
- `404` - Product not found

---

### POST `/products`

**Description:** Create a new product with pricing.

**Authentication:** App only (requires app authentication token)

**Request Body:**
```json
{
  "name": "Pro Plan",
  "description": "Professional tier with advanced features",
  "remoteProductId": "remote_prod_789",
  "price": {
    "price": 149.99,
    "currency": "USD",
    "interval": "MONTHLY"
  },
  "metadata": {
    "features": "advanced",
    "tier": "professional"
  }
}
```

**Validation:**
- `name` is required and must be less than 200 characters
- `description` is required and must be less than 1000 characters
- `remoteProductId` is required and must be less than 100 characters
- `price` is required object with:
  - `price` (number, required): must be >= 0
  - `currency` (string, required): currency code
  - `interval` (enum, required): SUBSCRIPTION_INTERVAL enum value
- `metadata` is required and must be an object with string key-value pairs

**Price Intervals:**
- `ONE_TIME` - One-time purchase
- `DAILY` - Daily subscription
- `WEEKLY` - Weekly subscription
- `MONTHLY` - Monthly subscription
- `YEARLY` - Yearly subscription

**Response:**
```json
{
  "id": "prod_new123",
  "name": "Pro Plan",
  "description": "Professional tier with advanced features",
  "isActive": true,
  "remoteProductId": "remote_prod_789",
  "activePrice": {
    "id": "price_new456",
    "price": 149.99,
    "currency": "USD",
    "interval": "MONTHLY"
  }
}
```

**Notes:**
- Product is automatically associated with the authenticated app
- Stripe product and price are created automatically
- The product is created as active by default

**Status Codes:**
- `201` - Product created successfully
- `400` - Invalid input data
- `401` - App authentication required
- `404` - App not found

---

### PATCH `/products/:id`

**Description:** Update a product's details.

**Authentication:** App only (requires app authentication token)

**Path Parameters:**
- `id` (string, required) - Product ID

**Request Body:**
```json
{
  "name": "Updated Pro Plan",
  "description": "Updated description",
  "isActive": false,
  "price": {
    "price": 159.99,
    "currency": "USD",
    "interval": "MONTHLY"
  },
  "metadata": {
    "features": "premium",
    "tier": "professional"
  }
}
```

**Validation:**
- All fields are optional
- `name` must be less than 200 characters if provided
- `description` must be less than 1000 characters if provided
- `isActive` must be a boolean if provided
- `price` object (if provided) must contain:
  - `price` (number, required): must be >= 0
  - `currency` (string, required): currency code
  - `interval` (enum, required): SUBSCRIPTION_INTERVAL enum value
- `metadata` is required and must be an object with string key-value pairs

**Notes:**
- All fields are optional except `metadata`
- Updating price will create a new price entry (prices are immutable)
- Old prices remain for historical records
- Product is updated in both local database and Stripe

**Response:**
```json
{
  "id": "prod_xyz789",
  "name": "Updated Pro Plan",
  "description": "Updated description",
  "isActive": false,
  "remoteProductId": "remote_prod_789",
  "activePrice": {
    "id": "price_new789",
    "price": 159.99,
    "currency": "USD",
    "interval": "MONTHLY"
  }
}
```

**Status Codes:**
- `200` - Product updated successfully
- `404` - Product not found
- `400` - Invalid input data
- `401` - App authentication required

---

## Customers

### GET `/customers`

**Description:** Get a paginated list of all customers with optional filtering.

**Authentication:** Admin only

**Query Parameters:**
- `applications` (string, optional) - Comma-separated application IDs
- `products` (string, optional) - Comma-separated product IDs
- `skip` (number, optional) - Number of items to skip for pagination (default: 0)
- `take` (number, optional) - Number of items to return (default: 10)

**Example Request:**
```
GET /customers
GET /customers?applications=app_abc123
GET /customers?products=prod_xyz789
GET /customers?applications=app_abc123&products=prod_xyz789&skip=0&take=20
```

**Response:**
```json
[
  {
    "id": "cust_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St, City, Country",
    "remoteCustomerId": "remote_cust_123",
    "stripeCustomerId": "cus_stripe123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-12-15T14:20:00Z"
  }
]
```

**Filter Details:**

- **applications**: Filter customers by application ID(s)
  - Filters customers that belong to the specified application(s)

- **products**: Filter customers by product ID(s)
  - Filters customers who have purchased or have sessions with the specified product(s)
  - Uses the session-price-product relationship to find matching customers

**Notes:**
- `address` field can be `null` or `undefined` if not provided during customer creation
- Results are ordered by creation date in descending order (newest first)
- Pagination is supported through `skip` and `take` parameters

**Status Codes:**
- `200` - Success

---

### GET `/customers/:id`

**Description:** Get details of a specific customer.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Customer ID

**Response:**
```json
{
  "id": "cust_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St, City, Country",
  "remoteCustomerId": "remote_cust_123",
  "stripeCustomerId": "cus_stripe123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-15T14:20:00Z"
}
```

**Notes:**
- `address` field can be `null` or `undefined` if not provided during creation

**Status Codes:**
- `200` - Success
- `404` - Customer not found

---

### POST `/customers`

**Description:** Create a new customer.

**Authentication:** App only (requires app authentication token)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "address": "456 Oak Ave, City, Country",
  "remoteCustomerId": "remote_cust_456",
  "metadata": {
    "source": "website",
    "campaign": "summer2024"
  }
}
```

**Validation:**
- `name` is required and must be less than 100 characters
- `email` is required and must be a valid email (less than 255 characters)
- `address` is **optional** and must be less than 500 characters (can be omitted or null)
- `remoteCustomerId` is required and must be less than 100 characters
- `metadata` is required and must be an object with string key-value pairs

**Response:**
```json
{
  "id": "cust_new789",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "address": "456 Oak Ave, City, Country",
  "remoteCustomerId": "remote_cust_456",
  "stripeCustomerId": "cus_stripe789",
  "createdAt": "2024-12-16T10:30:00Z",
  "updatedAt": "2024-12-16T10:30:00Z"
}
```

**Notes:**
- The customer is automatically associated with the authenticated app
- Stripe customer is created automatically

**Status Codes:**
- `201` - Customer created successfully
- `400` - Invalid input data
- `401` - App authentication required

---

### PUT `/customers/:id`

**Description:** Update a customer's information.

**Authentication:** App only (requires app authentication token)

**Path Parameters:**
- `id` (string, required) - Customer ID

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "address": "789 New Street, City, Country"
}
```

**Validation:**
- All fields are optional
- `name` must be less than 100 characters if provided
- `email` must be a valid email less than 255 characters if provided
- `address` must be less than 500 characters if provided

**Notes:**
- All fields are optional
- Cannot update `remoteCustomerId` or `stripeCustomerId`
- Customer is updated in both local database and Stripe

**Response:**
```json
{
  "id": "cust_abc123",
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "address": "789 New Street, City, Country",
  "remoteCustomerId": "remote_cust_456",
  "stripeCustomerId": "cus_stripe456",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-16T11:00:00Z"
}
```

**Status Codes:**
- `200` - Customer updated successfully
- `404` - Customer not found
- `400` - Invalid input data
- `401` - App authentication required

---

## Sessions

### POST `/session`

**Description:** Create a new checkout session for purchasing products.

**Authentication:** App only

**Request Body:**
```json
{
  "uiMode": "embedded",
  "customerId": "cust_def456",
  "remoteSaleId": "sale_xyz789",
  "returnPath": "/success",
  "products": [
    {
      "productId": "prod_123",
      "quantity": 1
    },
    {
      "productId": "prod_456",
      "quantity": 2
    }
  ],
  "metadata": {
    "orderId": "order_123",
    "source": "mobile_app"
  }
}
```

**Validation:**
- `uiMode` is required and must be either "embedded" or "hosted"
- `customerId` is required and must be less than 100 characters
- `remoteSaleId` is required, cannot be empty/whitespace, and must be less than 200 characters
- `returnPath` is required and must be less than 500 characters
- `products` is required array with at least one product
  - Each product must have `productId` (less than 100 characters) and `quantity` (1-1000)
- `metadata` is required and must be an object with string key-value pairs

**Response:**
```json
{
  "clientSecret": "pi_3ABC123_secret_XYZ789",
  "sessionId": "session_new123"
}
```

**UI Mode Options:**
- `embedded` - Use Stripe's embedded checkout UI
- `hosted` - Use Stripe's hosted checkout page

**Notes:**
- `clientSecret` is used by Stripe.js on the frontend to complete payment
- `sessionId` is used for tracking the session
- Session creates a Stripe Payment Intent with the specified products
- The `returnPath` is where the customer will be redirected after payment

**Status Codes:**
- `201` - Session created successfully
- `400` - Invalid input data
- `404` - App, customer, or product not found

---

### GET `/session/track`

**Description:** Track a session and redirect to the return path.

**Authentication:** Public

**Query Parameters:**
- `session` (string, required) - Session ID to track

**Example:**
```
GET /session/track?session=session_abc123
```

**Response:**
- HTTP 302 redirect to the return path configured when creating the session

**Notes:**
- This endpoint is typically called by Stripe after payment completion
- Automatically redirects to the application's return path
- Updates session status based on payment result

**Status Codes:**
- `302` - Redirect to return path
- `404` - Session not found

---

## Payments

### GET `/payments`

**Description:** Get a paginated list of all payments with optional filtering.

**Authentication:** Admin only

**Query Parameters:**
- `status` (string, optional) - Comma-separated payment statuses (e.g., "PENDING,COMPLETED,DUE")
- `applications` (string, optional) - Comma-separated application IDs
- `products` (string, optional) - Comma-separated product IDs
- `currencies` (string, optional) - Comma-separated currency codes (e.g., "USD,EUR,GBP")
- `type` (string, optional) - Payment type: "one_time", "subscription", or "all" (default: "all")
- `range` (string, optional) - Date range: "today", "week", "month", "year", or "all" (default: "all")
- `customerIds` (string, optional) - Comma-separated customer IDs
- `skip` (number, optional) - Number of items to skip for pagination (default: 0)
- `take` (number, optional) - Number of items to return (default: 10)

**Example Request:**
```
GET /payments?status=COMPLETED&type=subscription&range=month&skip=0&take=20
```

**Response:**
```json
{
  "items": [
    {
      "id": "pay_abc123",
      "amount": 99.99,
      "currency": "USD",
      "status": "COMPLETED",
      "stripePaymentId": "pi_stripe123",
      "createdAt": "2024-12-16T10:30:00Z",
      "updatedAt": "2024-12-16T10:31:00Z",
      "productName": "Premium Subscription",
      "customerName": "John Doe",
      "applicationName": "My App",
      "type": "subscription"
    },
    {
      "id": "pay_def456",
      "amount": 49.99,
      "currency": "EUR",
      "status": "COMPLETED",
      "stripePaymentId": "pi_stripe456",
      "createdAt": "2024-12-15T14:20:00Z",
      "updatedAt": "2024-12-15T14:21:00Z",
      "productName": "One-Time Purchase",
      "customerName": "Jane Smith",
      "applicationName": "My App",
      "type": "one_time"
    }
  ],
  "total": 145
}
```

**Filter Details:**

- **status**: Filter by payment status
  - `PENDING` - Payment is pending
  - `COMPLETED` - Payment completed successfully
  - `DUE` - Payment is due

- **type**: Filter by payment type
  - `one_time` - One-time purchases (payments without subscription)
  - `subscription` - Recurring subscription payments
  - `all` - All payment types (default)

- **range**: Filter by date range
  - `today` - Payments from today
  - `week` - Payments from the last 7 days
  - `month` - Payments from the last 30 days
  - `year` - Payments from the last 365 days
  - `all` - All payments (default)

**Status Codes:**
- `200` - Payments retrieved successfully
- `401` - Unauthorized
- `403` - Forbidden (not an admin)

---

### GET `/payments/:id`

**Description:** Get detailed information about a specific payment.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - Payment ID

**Example:**
```
GET /payments/pay_abc123
```

**Response:**
```json
{
  "id": "pay_abc123",
  "amount": 99.99,
  "currency": "USD",
  "status": "COMPLETED",
  "stripePaymentId": "pi_stripe123",
  "createdAt": "2024-12-16T10:30:00Z",
  "updatedAt": "2024-12-16T10:31:00Z",
  "customer": {
    "id": "cust_456",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "application": {
    "id": "app_789",
    "name": "My App"
  },
  "subscription": {
    "id": "sub_abc",
    "status": "ACTIVE",
    "stripeSubscriptionId": "sub_stripe123"
  },
  "session": {
    "id": "sess_xyz",
    "status": "COMPLETED",
    "stripeSessionId": "cs_stripe789"
  },
  "products": [
    {
      "id": "prod_123",
      "name": "Premium Subscription",
      "description": "Monthly premium subscription with all features",
      "isActive": true,
      "remoteProductId": "remote_prod_123",
      "activePrice": {
          "id": "price_123",
          "price": 99.99,
          "currency": "USD",
          "interval": "MONTHLY"
        }
    }
  ],
  "type": "subscription"
}
```

**Notes:**
- The `subscription` field is `null` for one-time payments
- The `session` field contains the checkout session that created this payment
- The `products` field contains an array of products associated with this payment
- The `type` field is automatically determined: "subscription" if `subscription` is not null, "one_time" otherwise

**Status Codes:**
- `200` - Payment retrieved successfully
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Payment not found

---

## Users

### GET `/users`

**Description:** Get a list of all users (admins).

**Authentication:** Admin only

**Response:**
```json
[
  {
    "id": "user_abc123",
    "name": "John Admin",
    "email": "john@example.com",
    "type": "ADMIN",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "user_def456",
    "name": "Jane Admin",
    "email": "jane@example.com",
    "type": "ADMIN",
    "createdAt": "2024-02-20T11:00:00Z"
  }
]
```

**User Types:**
- `ADMIN` - Administrator with full access
- `USER` - Regular user (if applicable)

**Status Codes:**
- `200` - Success

**Notes:**
- To create new users, use the `POST /auth/user/register` endpoint instead

---

### DELETE `/users/:id`

**Description:** Delete a user.

**Authentication:** Admin only

**Path Parameters:**
- `id` (string, required) - User ID

**Response:**
```json
{
  "id": "user_abc123",
  "name": "Deleted User",
  "email": "deleted@example.com",
  "type": "ADMIN",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Notes:**
- This performs a soft delete (user is marked as inactive)
- Cannot delete yourself
- Returns the deleted user's information

**Status Codes:**
- `200` - User deleted successfully
- `404` - User not found
- `400` - Cannot delete yourself

---

## Statistics

All statistics endpoints support optional filtering by application using the `appId` query parameter.

### GET `/stats/dashboard`

**Description:** Get dashboard metrics with current values and comparison to previous month.

**Authentication:** Admin only

**Query Parameters:**
- `appId` (string, optional) - Filter stats by specific application

**Example:**
```
GET /stats/dashboard
GET /stats/dashboard?appId=app_abc123
```

**Response:**
```json
{
  "totalEarnings": {
    "current": 125430.50,
    "changePct": 15.3
  },
  "numberOfPurchases": {
    "current": 1247,
    "changePct": 8.5
  },
  "numberOfNewSubscriptions": {
    "current": 342,
    "changePct": 22.1
  },
  "newCustomers": {
    "current": 589,
    "changePct": 12.7
  }
}
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `totalEarnings.current` | Total revenue for current month |
| `totalEarnings.changePct` | Percentage change compared to previous month |
| `numberOfPurchases.current` | Count of one-time purchases in current month |
| `numberOfPurchases.changePct` | Percentage change compared to previous month |
| `numberOfNewSubscriptions.current` | Count of new subscriptions in current month |
| `numberOfNewSubscriptions.changePct` | Percentage change compared to previous month |
| `newCustomers.current` | Count of new customers in current month |
| `newCustomers.changePct` | Percentage change compared to previous month |

**Calculation Logic:**
- **totalEarnings**: Sum of all completed sales in the current month
- **numberOfPurchases**: Count of sales with `interval = ONE_TIME`
- **numberOfNewSubscriptions**: Count of sales with `interval != ONE_TIME`
- **newCustomers**: Count of customers created in the current month
- **changePct**: `((current - previous) / previous) * 100`

**Status Codes:**
- `200` - Success

---

### GET `/stats/revenue-overview`

**Description:** Get monthly revenue data for the last 12 months.

**Authentication:** Admin only

**Query Parameters:**
- `appId` (string, optional) - Filter stats by specific application

**Example:**
```
GET /stats/revenue-overview
GET /stats/revenue-overview?appId=app_abc123
```

**Response:**
```json
[
  {
    "month": "Jan 2024",
    "paymentsRevenue": 45230.50,
    "subscriptionsRevenue": 32100.00,
    "totalRevenue": 77330.50
  },
  {
    "month": "Feb 2024",
    "paymentsRevenue": 52100.25,
    "subscriptionsRevenue": 35200.00,
    "totalRevenue": 87300.25
  }
  // ... 10 more months
]
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `month` | Month name and year (e.g., "Jan 2024") |
| `paymentsRevenue` | Total revenue from one-time purchases |
| `subscriptionsRevenue` | Total revenue from subscriptions |
| `totalRevenue` | Sum of payments and subscriptions revenue |

**Calculation Logic:**
- **paymentsRevenue**: Sum of sales where `ProductPrice.interval = ONE_TIME`
- **subscriptionsRevenue**: Sum of sales where `ProductPrice.interval != ONE_TIME`
- **totalRevenue**: Sum of all sales
- Returns data for rolling 12 months from current date

**Status Codes:**
- `200` - Success

---

### GET `/stats/customer-trend`

**Description:** Get new customer signups per month for the last 12 months.

**Authentication:** Admin only

**Query Parameters:**
- `appId` (string, optional) - Filter stats by specific application

**Example:**
```
GET /stats/customer-trend
GET /stats/customer-trend?appId=app_abc123
```

**Response:**
```json
[
  {
    "month": "Jan 2024",
    "newCustomers": 125
  },
  {
    "month": "Feb 2024",
    "newCustomers": 142
  }
  // ... 10 more months
]
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `month` | Month name and year |
| `newCustomers` | Count of customers created in that month |

**Calculation Logic:**
- Count of customers grouped by creation month
- Returns data for rolling 12 months from current date
- If `appId` is provided, only counts customers associated with that app

**Status Codes:**
- `200` - Success

---

### GET `/stats/revenue-app-breakdown`

**Description:** Get monthly revenue breakdown by application for the last 12 months.

**Authentication:** Admin only

**Query Parameters:**
- `appId` (string, optional) - Filter stats by specific application (returns single app data)

**Example:**
```
GET /stats/revenue-app-breakdown
GET /stats/revenue-app-breakdown?appId=app_abc123
```

**Response:**
```json
[
  {
    "month": "Jan 2024",
    "App One": 25430.50,
    "App Two": 32100.00,
    "App Three": 19800.00
  },
  {
    "month": "Feb 2024",
    "App One": 28100.25,
    "App Two": 35200.00,
    "App Three": 24000.00
  }
  // ... 10 more months
]
```

**Notes:**
- Dynamic keys based on application names
- Each app name is a key with its revenue as the value
- Returns data for rolling 12 months from current date
- If `appId` is provided, only that app's data is included

**Calculation Logic:**
- Sum of sales grouped by month and application
- Joins through: `Sale → ProductPrice → Product → App`
- Pivoted response format with app names as dynamic keys

**Status Codes:**
- `200` - Success

---

## Data Models

### Common Field Types

| Field Type | Description | Example |
|------------|-------------|---------|
| `id` | UUID string identifier | `"app_abc123"` |
| `timestamp` | ISO 8601 date-time | `"2024-12-16T10:30:00Z"` |
| `currency` | 3-letter currency code | `"USD"`, `"EUR"`, `"GBP"` |
| `price` | Decimal number | `99.99` |
| `percentage` | Decimal number | `15.3` (represents 15.3%) |

### Product Price Intervals

| Interval | Description |
|----------|-------------|
| `ONE_TIME` | One-time purchase (not recurring) |
| `DAILY` | Daily subscription |
| `WEEKLY` | Weekly subscription |
| `MONTHLY` | Monthly subscription |
| `YEARLY` | Yearly subscription |

### User Types

| Type | Description |
|------|-------------|
| `ADMIN` | Administrator with full access |
| `USER` | Regular user (if applicable) |

---

## Rate Limiting

Currently, there is no rate limiting implemented on the API. However, it's recommended to implement rate limiting in production to prevent abuse.

**Suggested limits:**
- 100 requests per minute for authenticated users
- 10 requests per minute for public endpoints

---

## Versioning

The API currently does not use versioning. Any breaking changes will be communicated in advance.

---

## Support

For API support or questions:
- Create an issue in the repository
- Contact the development team

---

## Changelog

### Version 1.2 (Current - October 21, 2025)
- Added `GET /products` endpoint with optional `appId` query parameter
- Removed `GET /products/app/:appId` endpoint (replaced by `GET /products?appId=`)
- Updated product list response to include `items` array and `total` count
- Added pagination support to `GET /products` endpoint:
  - `skip` - Number of items to skip (default: 0)
  - `take` - Number of items to return (default: 10)
- Added query filter parameters to `GET /customers` endpoint:
  - `applications` - Filter customers by application ID(s)
  - `products` - Filter customers by product ID(s)
  - `skip` and `take` - Pagination support

### Version 1.1 (December 21, 2024)
- Updated authentication response models to use `token`, `expiryDate`, and `entity` fields
- Fixed customer endpoints to use App authentication instead of Admin
- Updated product request body to use `price` instead of `activePrice`
- Removed non-existent `GET /session/:id` endpoint
- Removed non-existent `POST /users` endpoint (use `POST /auth/user/register` instead)
- Added health check endpoint documentation (`GET /`)
- Updated validation rules to match actual contract models
- Fixed address field to be optional in customer creation
- Added comprehensive validation details for all endpoints
- Updated authentication modes response model

### Version 1.0 (December 16, 2024)
- Initial API documentation
- All core endpoints documented
- Authentication and authorization documented
- Statistics endpoints with app filtering support

---

*Last Updated: October 21, 2025*

