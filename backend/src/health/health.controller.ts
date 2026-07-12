import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public() // Mark as public so JwtAuthGuard ignores it
  check() {
    return { status: 'OK', uptime: process.uptime() };
  }
}
