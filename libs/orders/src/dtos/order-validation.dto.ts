import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class OrderValidationDto {
  @IsNotEmpty({ message: 'Order ID is required' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  order_id: number;

  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  customer_id: number;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === '' ? null : parseFloat(value)), {
    toClassOnly: true,
  })
  price?: number;

  @IsString()
  @IsNotEmpty({ message: 'Order date is required' })
  order_date: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNotEmpty({ message: 'ID is required' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  id: number;
}
