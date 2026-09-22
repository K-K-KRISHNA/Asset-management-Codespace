import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logging/app-logger.service';

@Injectable()
export class HealthService {
    constructor(private readonly logger: AppLoggerService) { }

    check() {
        this.logger.log('Health check requested', HealthService.name);

        return {
            status: 'ok',
        };
    }
}