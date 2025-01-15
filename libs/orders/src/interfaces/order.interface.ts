export interface IOrdersFileRow {
  order_id: string;
  customer_id: string;
  product_name: string;
  quantity: string;
  price: string;
  order_date: string;
  category: string;
  id: string;
}

export interface IOrder {
  order_id: number;
  customer_id: number;
  product_name: string;
  quantity: number;
  price: number;
  order_date: string;
  category: string;
  id: number;
}
