import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Nếu data đã có format response, giữ nguyên
        if (data && typeof data === 'object' && 'message' in data) {
          return data;
        }
        // Nếu chưa có format, wrap lại
        return {
          message: 'Thành công',
          data,
        };
      }),
    );
  }
}

