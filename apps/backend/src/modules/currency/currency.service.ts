import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { CacheUtil } from "@repo/utils";
import {
    ExchangeRateHostResponse,
    ExchangeRateApiResponse,
} from "../../types/currency";
import { GeneralError } from "src/errors";

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);
    private readonly cache: CacheUtil<number>;
    private readonly CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
    private readonly exchangeRateApiKey: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.cache = new CacheUtil<number>(this.CACHE_TTL_SECONDS);
        this.exchangeRateApiKey =
            this.configService.get<string>("EXCHANGERATE_API_KEY") || "";
    }

    /**
     * Convert a price from one currency to another
     * @param sourcePrice The price in the source currency
     * @param sourceCurrency The source currency code (e.g., 'USD')
     * @param targetCurrency The target currency code (e.g., 'EUR')
     * @returns The converted price in the target currency
     */
    async convertCurrency(
        sourcePrice: number,
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        // Validate input
        this.validateCurrencyCode(sourceCurrency);
        this.validateCurrencyCode(targetCurrency);

        if (sourcePrice < 0) {
            throw new GeneralError("Source price cannot be negative");
        }

        // If same currency, return the same price
        if (sourceCurrency === targetCurrency) {
            return sourcePrice;
        }

        const cacheKey = `${sourceCurrency}_${targetCurrency}`;

        // Check cache first
        let exchangeRate = this.cache.get(cacheKey);

        if (exchangeRate !== undefined) {
            this.logger.debug(
                `Using cached exchange rate for ${cacheKey}: ${exchangeRate}`
            );
            return sourcePrice * exchangeRate;
        }

        // Fetch exchange rate with retry logic
        exchangeRate = await this.fetchExchangeRateWithRetry(
            sourceCurrency,
            targetCurrency
        );

        // Cache the rate
        this.cache.set(cacheKey, exchangeRate);
        this.logger.debug(
            `Cached exchange rate for ${cacheKey}: ${exchangeRate}`
        );

        return sourcePrice * exchangeRate;
    }

    /**
     * Validate currency code format (3-letter ISO codes)
     */
    private validateCurrencyCode(code: string): void {
        if (!code || !/^[A-Z]{3}$/.test(code)) {
            throw new GeneralError(
                `Invalid currency code: ${code}. Must be a 3-letter uppercase ISO code.`
            );
        }
    }

    /**
     * Fetch exchange rate with retry logic:
     * 1. Try primary API
     * 2. Retry primary API once
     * 3. Try secondary API
     * 4. Retry secondary API once
     * 5. Throw error if all fail
     */
    private async fetchExchangeRateWithRetry(
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        // Try primary API
        try {
            this.logger.debug(
                `Fetching exchange rate from primary API: ${sourceCurrency} -> ${targetCurrency}`
            );
            return await this.fetchFromPrimaryApi(
                sourceCurrency,
                targetCurrency
            );
        } catch (error) {
            this.logger.warn(
                `Primary API failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        // Retry primary API once
        try {
            this.logger.debug(
                `Retrying primary API: ${sourceCurrency} -> ${targetCurrency}`
            );
            return await this.fetchFromPrimaryApi(
                sourceCurrency,
                targetCurrency
            );
        } catch (error) {
            this.logger.warn(
                `Primary API retry failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        // Try secondary API
        try {
            this.logger.debug(
                `Fetching exchange rate from secondary API: ${sourceCurrency} -> ${targetCurrency}`
            );
            return await this.fetchFromSecondaryApi(
                sourceCurrency,
                targetCurrency
            );
        } catch (error) {
            this.logger.warn(
                `Secondary API failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        // Retry secondary API once
        try {
            this.logger.debug(
                `Retrying secondary API: ${sourceCurrency} -> ${targetCurrency}`
            );
            return await this.fetchFromSecondaryApi(
                sourceCurrency,
                targetCurrency
            );
        } catch (error) {
            this.logger.error(
                `Secondary API retry failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        // All attempts failed
        throw new Error(
            `Unable to fetch exchange rate for ${sourceCurrency} -> ${targetCurrency}. All API attempts failed.`
        );
    }

    /**
     * Fetch exchange rate from primary API (exchangerate.host)
     * Free, no API key required
     */
    private async fetchFromPrimaryApi(
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        const url = `https://api.exchangerate.host/convert?from=${sourceCurrency}&to=${targetCurrency}&amount=1`;

        const response = await firstValueFrom(
            this.httpService.get<ExchangeRateHostResponse>(url, {
                timeout: 5000,
            })
        );

        if (!response.data.success || !response.data.info?.rate) {
            throw new Error("Invalid response from primary API");
        }

        return response.data.info.rate;
    }

    /**
     * Fetch exchange rate from secondary API (exchangerate-api.com)
     * Requires API key
     */
    private async fetchFromSecondaryApi(
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        if (!this.exchangeRateApiKey) {
            throw new Error("Secondary API key not configured");
        }

        const url = `https://v6.exchangerate-api.com/v6/${this.exchangeRateApiKey}/pair/${sourceCurrency}/${targetCurrency}/1`;

        const response = await firstValueFrom(
            this.httpService.get<ExchangeRateApiResponse>(url, {
                timeout: 5000,
            })
        );

        if (
            response.data.result !== "success" ||
            !response.data.conversion_rate
        ) {
            throw new Error("Invalid response from secondary API");
        }

        return response.data.conversion_rate;
    }

    /**
     * Get cache statistics (useful for monitoring)
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Clear the cache (useful for testing or manual refresh)
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.log("Currency exchange rate cache cleared");
    }
}
