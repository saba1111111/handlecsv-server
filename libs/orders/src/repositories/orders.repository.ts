import { InjectRepository } from '@nestjs/typeorm';
import { OrdersEntity } from '../entities';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OrderValidationDto } from '../dtos';
import { IGetOrdersCredentials } from '../interfaces';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(OrdersEntity)
    private readonly repository: Repository<OrdersEntity>,
  ) {}

  async createOrder(order: OrderValidationDto) {
    const { id, order_id, ...rest } = order;
    return this.repository.save({ ...rest, id: order_id, product_id: id });
  }

  async getOrders(data: IGetOrdersCredentials) {
    const options = { ...data.Pagination };

    return this.repository.findAndCount(options);
  }

  async findOrder(orderId: number) {
    return this.repository.findOne({ where: { id: orderId } });
  }

  async deleteOrders() {
    return this.repository.delete({});
  }

  async getMinProductPrice(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('orders')
      .select('MIN(orders.price)', 'minPrice')
      .getRawOne();

    return result.minPrice ? parseFloat(result.minPrice) : 0;
  }
}
