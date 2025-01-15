import { IOrdersFileRow } from './order.interface';

export interface IOrderProcessData {
  order: IOrdersFileRow;
  fileName: string;
  isFirstFileRow: boolean;
}
