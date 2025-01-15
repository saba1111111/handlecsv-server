import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IOrderProcessData } from '../interfaces';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderValidationDto } from '../dtos';
import { OrdersService } from './orders.service';
import { EOrderProcessingStatus } from '../constants';
import { OrdersRepository } from '../repositories';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Processor('orders')
export class OrderProcessorService extends WorkerHost {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersRepository: OrdersRepository,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  public async process(job: Job<IOrderProcessData>): Promise<void> {
    const { fileName, isFirstFileRow, order } = job.data;

    try {
      if (isFirstFileRow) {
        await this.updateProcessingStatus(
          fileName,
          EOrderProcessingStatus.PROCESSING,
        );
      }

      const { isValid, orderDto } = await this.validateOrder(order);
      if (!isValid) {
        await this.handleValidationFailed(fileName, order);
        return;
      }

      const isDuplicate = await this.checkForDuplicateOrder(orderDto.order_id);
      if (isDuplicate) {
        await this.handleDuplicateOrder(fileName, order);
        return;
      }

      await this.saveOrder(fileName, orderDto);
    } catch (error) {
      console.error('Error processing job', { fileName, order, error });
      throw error;
    }
  }

  private async updateProcessingStatus(
    fileName: string,
    status: EOrderProcessingStatus,
  ): Promise<void> {
    await this.ordersService.setOrderProcessingStatus(fileName, status);
  }

  private async validateOrder(order: unknown) {
    const orderDto = plainToInstance(OrderValidationDto, order);
    const errors = await validate(orderDto);

    if (errors.length > 0) {
      console.log(errors);
    }

    return { isValid: errors.length === 0, orderDto };
  }

  private async handleValidationFailed(
    fileName: string,
    order: unknown,
  ): Promise<void> {
    await this.ordersService.incrementValidationFailedOrders(fileName);
    console.error('Validation failed for order', { fileName, order });
  }

  private async checkForDuplicateOrder(orderId: number): Promise<boolean> {
    const existingOrder = await this.ordersRepository.findOrder(orderId);
    return !!existingOrder;
  }

  private async handleDuplicateOrder(
    fileName: string,
    order: unknown,
  ): Promise<void> {
    await this.ordersService.incrementDuplicateOrders(fileName);
    console.error('Duplicate order detected', { fileName, order });
  }

  private async saveOrder(
    fileName: string,
    order: OrderValidationDto,
  ): Promise<void> {
    await this.fetchOrderMissingProperties(order);
    if (!order.price) {
      await this.setMinProductPrice(order);
    }
    await this.ordersRepository.createOrder(order);
    await this.ordersService.incrementSuccessfullyProcessedOrders(fileName);
  }

  public async fetchOrderMissingProperties(order: OrderValidationDto) {
    try {
      if (!order.category || !order.price || !order.product_name) {
        const fetchedOrder = await lastValueFrom(
          this.httpService.get(`https://fakestoreapi.com/products/${order.id}`),
        );

        if (fetchedOrder.data) {
          order.category = fetchedOrder.data.category;
          order.price = fetchedOrder.data.price;
          order.product_name = fetchedOrder.data.title;
        }

        return order;
      }
    } catch (error) {
      console.error('Error fetching order', { order, error });
      return order;
    }
  }

  public async setMinProductPrice(order: OrderValidationDto) {
    try {
      const minProductPrice = await this.ordersRepository.getMinProductPrice();
      order.price = minProductPrice;

      return order;
    } catch (error) {
      console.error('Error fetching order', { order, error });
      return order;
    }
  }
}
