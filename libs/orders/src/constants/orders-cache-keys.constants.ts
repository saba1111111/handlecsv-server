export const OrdersCacheKeys = {
  fileColumnNames: (file: string) => `orders-file-column-names-${file}`,
  orderProcessingStats: (file: string) =>
    `orders-order-processing-stats-${file}`,
};
