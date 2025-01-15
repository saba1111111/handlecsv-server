import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetOrdersDataDto, UploadOrdersDto } from 'libs/orders/dtos';
import { OrdersService } from 'libs/orders/services';
import * as Multer from 'multer';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('fileChunk'))
  async uploadOrdersFile(
    @UploadedFile() file: Multer.File,
    @Body() uploadOrdersDto: UploadOrdersDto,
  ) {
    const { fileName, fileChunkIndex } = uploadOrdersDto;

    await this.ordersService.handleUploadFileChunk({
      file,
      fileChunkIndex,
      fileName,
    });

    return { message: 'ok' };
  }

  @Get('/processing/:fileName')
  async getOrdersProcessingStats(@Param('fileName') fileName: string) {
    return this.ordersService.getOrderProcessingStats(fileName);
  }

  @Get()
  async getOrders(@Query() data: GetOrdersDataDto) {
    return this.ordersService.getOrders(data);
  }
}
