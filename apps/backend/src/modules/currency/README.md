# Currency Conversion Module

A high-availability currency conversion service with dual-API fallback and 24-hour caching.

## Features

- **Dual-API Fallback**: Uses two free APIs for redundancy
  - Primary: [Exchangerate.host](https://exchangerate.host/) (no API key required)
  - Secondary: [ExchangeRate-API.com](https://www.exchangerate-api.com/) (requires free API key)
- **24-Hour Caching**: Exchange rates cached in-memory for 24 hours
- **Retry Logic**: Automatically retries failed requests before switching APIs
- **Input Validation**: Validates currency codes (3-letter ISO codes)
- **Logging**: Comprehensive logging for monitoring and debugging

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
# Optional: Required only if primary API fails and secondary API is needed
EXCHANGERATE_API_KEY=your_api_key_here
```

To get a free API key for the secondary API:
1. Visit [https://www.exchangerate-api.com/](https://www.exchangerate-api.com/)
2. Sign up for a free account (1,500 requests/month)
3. Copy your API key

**Note**: The primary API (exchangerate.host) doesn't require an API key and should handle most requests. The secondary API is only used as a fallback.

## Usage

### Basic Usage

Inject the `CurrencyService` into your service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class StatsService {
    constructor(private readonly currencyService: CurrencyService) {}

    async getConvertedRevenue() {
        const revenueInUSD = 1000;
        
        // Convert USD to EUR
        const revenueInEUR = await this.currencyService.convertCurrency(
            revenueInUSD,
            'USD',
            'EUR'
        );
        
        return revenueInEUR;
    }
}
```

### Method Signature

```typescript
async convertCurrency(
    sourcePrice: number,      // Amount to convert
    sourceCurrency: string,   // Source currency (3-letter ISO code, e.g., 'USD')
    targetCurrency: string    // Target currency (3-letter ISO code, e.g., 'EUR')
): Promise<number>           // Returns converted amount
```

### Example Conversions

```typescript
// Convert $100 USD to EUR
const eurAmount = await currencyService.convertCurrency(100, 'USD', 'EUR');

// Convert £50 GBP to JPY
const jpyAmount = await currencyService.convertCurrency(50, 'GBP', 'JPY');

// Same currency returns same amount
const usdAmount = await currencyService.convertCurrency(100, 'USD', 'USD'); // Returns 100
```

## Error Handling

The service throws errors in the following cases:

1. **Invalid currency code**: Must be 3-letter uppercase ISO codes
2. **Negative price**: Source price cannot be negative
3. **API failures**: If both APIs fail after retries

```typescript
try {
    const converted = await currencyService.convertCurrency(100, 'USD', 'EUR');
} catch (error) {
    // Handle error (e.g., log, return default value, etc.)
    console.error('Currency conversion failed:', error.message);
}
```

## Cache Management

### View Cache Statistics

```typescript
const stats = currencyService.getCacheStats();
console.log(stats);
```

### Clear Cache (useful for testing)

```typescript
currencyService.clearCache();
```

## How It Works

### Retry Flow

1. Check cache for existing exchange rate
2. If not cached or expired, try primary API
3. If primary API fails, retry once
4. If still fails, try secondary API
5. If secondary API fails, retry once
6. If all attempts fail, throw error
7. On success, cache the rate for 24 hours

### Caching Strategy

- Exchange rates are cached for 24 hours
- Cache key format: `{sourceCurrency}_{targetCurrency}`
- Cached rates are stored in-memory using the `CacheUtil` from `@repo/utils`
- Cache automatically expires after TTL

### API Details

**Primary API (Exchangerate.host)**
- Endpoint: `https://api.exchangerate.host/convert`
- No API key required
- 170+ currencies supported
- 99.99% uptime

**Secondary API (ExchangeRate-API.com)**
- Endpoint: `https://v6.exchangerate-api.com/v6/{API_KEY}/pair/{from}/{to}`
- Requires free API key
- 1,500 requests/month (free tier)
- Updates daily

## Supported Currencies

Both APIs support 170+ currencies including:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CNY (Chinese Yuan)
- INR (Indian Rupee)
- And many more...

For a complete list, refer to the API documentation.

## Security Considerations

- API keys stored in environment variables only
- All requests use HTTPS
- Input validation prevents injection attacks
- Error messages don't expose sensitive data

## Monitoring

The service uses NestJS Logger for comprehensive logging:

- `DEBUG`: Cache hits, API calls, retry attempts
- `WARN`: API failures before retry
- `ERROR`: Final failures after all retries
- `LOG`: Cache clearing events

Monitor these logs to track API health and usage patterns.

## Performance

- **First request**: ~200-500ms (API call + cache write)
- **Cached requests**: ~1-5ms (memory lookup)
- **Cache hit rate**: Expected >99% for typical usage patterns (24-hour TTL)

## Testing

When testing, you can clear the cache to ensure fresh data:

```typescript
beforeEach(() => {
    currencyService.clearCache();
});
```