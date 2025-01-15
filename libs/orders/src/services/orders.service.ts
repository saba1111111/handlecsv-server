import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IHandleUploadFileChunk, IOrdersFileRow } from '../interfaces';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { ICacheService } from 'libs/cache/interfaces';
import { CACHE_SERVICE_TOKEN } from 'libs/cache/constants';
import {
  EOrderProcessingStatus,
  ORDER_FILE_COLUMNS,
  OrdersCacheKeys,
} from '../constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { IFileOrdersProcessData } from '../interfaces/file-orders-process-data.interface';
import { OrdersRepository } from '../repositories';

@Injectable()
export class OrdersService {
  private redisClient: Redis;

  constructor(
    @Inject(CACHE_SERVICE_TOKEN) private readonly cacheService: ICacheService,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  public async getOrderProcessingStats(fileName: string) {
    try {
      const key = OrdersCacheKeys.orderProcessingStats(fileName);
      const stats: IFileOrdersProcessData =
        await this.cacheService.getHash(key);

      if (!stats) {
        throw new NotFoundException();
      }

      const numberOfProcessedOrders =
        stats.duplicateOrdersCount +
        stats.successfullyProcessedCount +
        stats.validationFailedOrdersCount;

      if (numberOfProcessedOrders === stats.totalOrders) {
        await this.setOrderProcessingStatus(
          fileName,
          EOrderProcessingStatus.COMPLETED,
        );

        stats.status = EOrderProcessingStatus.COMPLETED;
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  public async handleUploadFileChunk(
    data: IHandleUploadFileChunk,
  ): Promise<void> {
    const { file, fileChunkIndex, fileName } = data;

    const chunkStream = Readable.from(file.buffer);
    const fileColumnNames = await this.getFileColumnNames(fileName);

    const isFirstChunk = fileChunkIndex === 0;
    let isFirstRow = true;
    let totalRows = 0;

    if (isFirstChunk) {
      await this.createOrderProcessingStats(fileName);
    }

    await new Promise<void>((resolve, reject) => {
      chunkStream
        .pipe(
          csvParser({
            headers: !isFirstChunk ? fileColumnNames : undefined,
          }),
        )
        .on('data', (row) => {
          try {
            const isFirstRowForMessage = isFirstChunk && isFirstRow;
            if (isFirstChunk && isFirstRow) {
              isFirstRow = false;
              this.checkFileColumnsValidity(row);
              this.saveFileColumnNames(Object.keys(row), fileName);
            }

            totalRows++;
            this.ordersQueue.add(
              'process',
              {
                order: row,
                fileName,
                isFirstFileRow: isFirstRowForMessage,
              },
              { removeOnComplete: true },
            );
          } catch (error) {
            reject(error);
          }
        })
        .on('end', async () => {
          try {
            await this.incrementTotalOrders(fileName, totalRows);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    }).catch((error) => {
      throw error;
    });
  }

  private async saveFileColumnNames(columnNames: string[], fileName: string) {
    return this.cacheService.add(
      OrdersCacheKeys.fileColumnNames(fileName),
      columnNames,
    );
  }

  private async getFileColumnNames(fileName: string): Promise<string[]> {
    return this.cacheService.get(OrdersCacheKeys.fileColumnNames(fileName));
  }

  private async createOrderProcessingStats(fileName: string) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);

    await this.cacheService.remove(key);
    return this.cacheService.addHash(key, {
      totalOrders: 0,
      duplicateOrdersCount: 0,
      validationFailedOrdersCount: 0,
      successfullyProcessedCount: 0,
      status: EOrderProcessingStatus.PENDING,
    });
  }

  private checkFileColumnsValidity(row: IOrdersFileRow) {
    const missingColumns = [];

    ORDER_FILE_COLUMNS.forEach((column) => {
      if (typeof row[column] !== 'string') {
        missingColumns.push(column);
      }
    });

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Missing columns: ${missingColumns.join(', ')}`,
      );
    }
  }

  private async incrementTotalOrders(
    fileName: string,
    incrementNumber: number,
  ) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);
    return this.cacheService.incrementProperty(
      key,
      'totalOrders',
      incrementNumber,
    );
  }

  public async incrementSuccessfullyProcessedOrders(fileName: string) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);
    return this.cacheService.incrementProperty(
      key,
      'successfullyProcessedCount',
      1,
    );
  }

  public async incrementDuplicateOrders(fileName: string) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);
    return this.cacheService.incrementProperty(key, 'duplicateOrdersCount', 1);
  }

  public async incrementValidationFailedOrders(fileName: string) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);
    return this.cacheService.incrementProperty(
      key,
      'validationFailedOrdersCount',
      1,
    );
  }

  public async setOrderProcessingStatus(
    fileName: string,
    status: EOrderProcessingStatus,
  ) {
    const key = OrdersCacheKeys.orderProcessingStats(fileName);
    return this.cacheService.setProperty(key, 'status', status);
  }

  public async getOrders(data: { page: number; numberOfItemsPerPage: number }) {
    try {
      const { page, numberOfItemsPerPage } = data;

      const PaginationData = {
        take: numberOfItemsPerPage,
        skip: page ? (page - 1) * numberOfItemsPerPage : 0,
      };

      const [orders, totalNumberOfOrders] =
        await this.ordersRepository.getOrders({
          Pagination: PaginationData,
        });

      const response = {
        orders,
        page: page || 1,
        maxNumberOfItemsPerPage: numberOfItemsPerPage,
        totalNumberOfPages:
          Math.ceil(totalNumberOfOrders / numberOfItemsPerPage) || 1,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }
}
