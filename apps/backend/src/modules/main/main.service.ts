import { Injectable } from "@nestjs/common";

@Injectable()
export class MainService {
    healthCheck(): string {
        return "OK";
    }
}
