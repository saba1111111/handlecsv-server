import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersLibModule } from 'libs/orders';

@Module({
  imports: [OrdersLibModule],
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
