import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Request, Response } from "express";

type ErrorBody = {
  code?: string;
  message?: string | string[];
  details?: unknown;
};

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body = this.normalizeBody(exceptionResponse);

    response.status(status).json({
      data: null,
      meta: {
        requestId: request.requestId
      },
      error: {
        code: body.code ?? this.codeForStatus(status),
        message: body.message ?? "Unexpected error",
        details: body.details ?? []
      }
    });
  }

  private normalizeBody(exceptionResponse: unknown): ErrorBody {
    if (typeof exceptionResponse === "string") {
      return { message: exceptionResponse };
    }
    if (exceptionResponse && typeof exceptionResponse === "object") {
      const typed = exceptionResponse as Record<string, unknown>;
      return {
        code: typeof typed.error === "string" ? typed.error : undefined,
        message: typed.message as string | string[] | undefined,
        details: typed.details ?? typed.message
      };
    }
    return {};
  }

  private codeForStatus(status: number) {
    if (status === HttpStatus.BAD_REQUEST) return "VALIDATION_ERROR";
    if (status === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
    if (status === HttpStatus.FORBIDDEN) return "FORBIDDEN";
    if (status === HttpStatus.NOT_FOUND) return "NOT_FOUND";
    return "INTERNAL_ERROR";
  }
}
