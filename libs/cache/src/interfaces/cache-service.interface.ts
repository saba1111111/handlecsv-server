export interface ICacheService {
  get<ValueType>(key: string): Promise<ValueType>;

  remove(key: string): Promise<string | boolean | number>;

  add<ValueType>(
    key: string,
    value: ValueType,
    expiration?: number,
  ): Promise<string | boolean | number>;

  setProperty(
    key: string,
    property: string,
    value: string,
  ): Promise<string | boolean | number>;

  incrementProperty(
    key: string,
    property: string,
    incrementNumber: number,
  ): Promise<number>;

  addHash(key: string, value: Record<string, any>): Promise<'OK'>;

  getHash<T>(key: string): Promise<T | null>;
}
