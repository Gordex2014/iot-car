import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SensorsModule } from './sensors/sensors.module';

@Module({
  imports: [SensorsModule, ScheduleModule.forRoot()],
})
export class IotModule {}
