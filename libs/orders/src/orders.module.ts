import { Module } from '@nestjs/common';
import { CacheModule } from 'libs/cache';
import { OrdersService } from './services';
import { BullModule } from '@nestjs/bullmq';
import { OrderProcessorService } from './services/order-processor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersEntity } from './entities';
import { OrdersRepository } from './repositories';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    CacheModule,
    BullModule.registerQueue({
      name: 'orders',
    }),
    TypeOrmModule.forFeature([OrdersEntity]),
    HttpModule,
  ],
  providers: [OrdersService, OrderProcessorService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersLibModule {}
