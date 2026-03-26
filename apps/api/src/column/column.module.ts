import { Module } from '@nestjs/common';
import { ColumnService } from './column.service.js';
import { ColumnController } from './column.controller.js';

@Module({
  controllers: [ColumnController],
  providers: [ColumnService],
  exports: [ColumnService],
})
export class ColumnModule {}
