import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'awake',
      timestamp: new Date().toISOString(),
      message: 'Sistema ITESCA operativo'
    };
  }
  
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
