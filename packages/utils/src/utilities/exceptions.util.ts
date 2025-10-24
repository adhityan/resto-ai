import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    Logger,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
} from "@nestjs/common";
import { BaseError } from "../base/base.error";
import { ObjectUtils } from "./object.util";

@Catch()
export class ExceptionHandler implements ExceptionFilter {
    private readonly logger = new Logger(ExceptionHandler.name);

    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if ((<any>exception).logger) delete (<any>exception).logger;

        if (exception instanceof BaseError) {
            response.status(200).send(JSON.parse(JSON.stringify(exception)));
            return;
        }

        if (exception instanceof BadRequestException) {
            response.status(200).send(exception.getResponse());
            return;
        }

        if (exception instanceof UnauthorizedException) {
            response.status(403).send(exception.getResponse());
            return;
        }

        if (exception instanceof ForbiddenException) {
            response.status(403).send({ statusCode: 403, message: "Forbidden" });
            return;
        }

        if (exception instanceof NotFoundException) {
            response.status(404).send(JSON.parse(JSON.stringify(exception)));
            return;
        }

        const status = (<any>exception).status || (<any>exception).statusCode || 500;
        this.logger.error(`Internal server error: ${ObjectUtils.toString(exception)}`);
        response.status(status).send({
            statusCode: status,
            message: "Internal server error",
        });
        return;
    }
}
