import { Inject, Logger, Module, OnModuleInit } from "@nestjs/common";
import { HttpService, HttpModule as AxiosHttpModule } from "@nestjs/axios";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ObjectUtils } from "@repo/utils";

interface RequestMetadata {
    startDate: Date;
    endDate?: Date;
}

// Extend the AxiosRequestConfig type to include metadata
declare module "axios" {
    export interface InternalAxiosRequestConfig {
        metadata?: RequestMetadata;
    }
}

@Module({})
export class HttpModule extends AxiosHttpModule implements OnModuleInit {
    private readonly logger = new Logger("HttpClient");

    @Inject()
    private readonly httpService: HttpService;

    public onModuleInit() {
        const axios = this.httpService.axiosRef;

        // Request interceptor - capture start time
        axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
            config.metadata = {
                startDate: new Date(),
            };
            return config;
        });

        // Response interceptor - log successful requests
        axios.interceptors.response.use(
            (response: AxiosResponse) => {
                this.logSuccessfulRequest(response);
                return response;
            },
            (error: AxiosError) => {
                this.logFailedRequest(error);
                return Promise.reject(error);
            }
        );
    }

    private logSuccessfulRequest(response: AxiosResponse): void {
        const { config, status, statusText, data } = response;
        const duration = this.calculateDuration(config);

        const method = config.method?.toUpperCase() || "UNKNOWN";
        const url = config.url || "unknown";
        const responseSize = this.getDataSize(data);

        this.logger.log(
            `✓ ${method} ${url} - ${status} ${statusText} - ${duration}ms - ${this.formatBytes(responseSize)}`
        );

        // Log request details in debug mode (if needed, can be controlled via env var)
        if (process.env.HTTP_DEBUG === "true") {
            this.logger.debug(
                `Request Headers:\n${ObjectUtils.toString(config.headers)}`
            );
            this.logger.debug(`Response Data:\n${ObjectUtils.toString(data)}`);
        }
    }

    private logFailedRequest(error: AxiosError): void {
        const { config, response } = error;

        if (!config) {
            this.logger.error(`✗ HTTP Request failed: ${error.message}`);
            return;
        }

        const duration = this.calculateDuration(config);
        const method = config.method?.toUpperCase() || "UNKNOWN";
        const url = config.url || "unknown";

        if (response) {
            // Server responded with error status
            const { status, statusText, data } = response;
            this.logger.error(
                `✗ ${method} ${url} - ${status} ${statusText} - ${duration}ms`
            );
            this.logger.error(`Response:\n${ObjectUtils.toString(data)}`);
        } else if (error.request) {
            // Request was made but no response received
            this.logger.error(
                `✗ ${method} ${url} - No response received - ${duration}ms`
            );
            this.logger.error(`Error: ${error.message}`);
        } else {
            // Error in request configuration
            this.logger.error(`✗ ${method} ${url} - Request setup failed`);
            this.logger.error(`Error: ${error.message}`);
        }

        // Log full error stack in debug mode
        if (process.env.HTTP_DEBUG === "true") {
            this.logger.debug(error.stack || "No stack trace available");
        }
    }

    private calculateDuration(config: InternalAxiosRequestConfig): number {
        if (!config.metadata?.startDate) {
            return 0;
        }

        const endDate = new Date();
        return endDate.getTime() - config.metadata.startDate.getTime();
    }

    private getDataSize(data: any): number {
        try {
            return JSON.stringify(data).length;
        } catch {
            return 0;
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
}
