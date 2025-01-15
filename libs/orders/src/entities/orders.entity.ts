import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'orders' })
export class OrdersEntity {
  @PrimaryColumn({ type: 'bigint' })
  public id: number;

  @Column({ type: 'bigint', nullable: false })
  public customer_id: number;

  @Column({ type: 'bigint', nullable: false })
  public product_id: number;

  @Column({ type: 'varchar', nullable: false })
  public product_name: string;

  @Column({ type: 'int', nullable: false })
  public quantity: number;

  @Column({ type: 'float', nullable: false })
  public price: number;

  @Column({ type: 'varchar', nullable: false })
  public order_date: string;

  @Column({ type: 'varchar', nullable: false })
  public category: string;
}
