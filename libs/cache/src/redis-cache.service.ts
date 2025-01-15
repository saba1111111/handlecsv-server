import { Injectable } from '@nestjs/common';
import { ICacheService } from './interfaces';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheService implements ICacheService {
  private redisClient: Redis;

  public constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: Number(configService.get<string>('REDIS_PORT')),
    });

    this.redisClient.on('error', (error) => {
      this.redisClient = null;
      console.log(`Failed connection to redis: ${error.message}!`);
    });

    this.redisClient.on('connect', () => {
      console.log('Successfully connect redis!');
    });
  }

  public async add<T>(key: string, value: T): Promise<'OK'>;
  public async add<T>(key: string, value: T, expiration: number): Promise<'OK'>;
  public async add<T>(key: string, value: T, expiration?: number) {
    const stringifyValue = JSON.stringify(value);

    if (expiration !== undefined && expiration > 0) {
      return this.redisClient.set(key, stringifyValue, 'EX', expiration);
    } else {
      return this.redisClient.set(key, stringifyValue);
    }
  }

  public async addHash(key: string, value: Record<string, any>): Promise<'OK'> {
    const entries = Object.entries(value);

    // Use Redis pipeline for batch operations
    const pipeline = this.redisClient.multi();
    entries.forEach(([field, fieldValue]) => {
      pipeline.hset(key, field, JSON.stringify(fieldValue)); // Convert values to JSON strings
    });

    await pipeline.exec();
    return 'OK';
  }

  public async getHash<T>(key: string): Promise<T | null> {
    const result = await this.redisClient.hgetall(key);

    if (!result || Object.keys(result).length === 0) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(result).map(([field, value]) => [
        field,
        JSON.parse(value),
      ]),
    ) as T;
  }

  public async get<T>(key: string): Promise<T> {
    const data = await this.redisClient.get(key);
    const parsedData = data ? (JSON.parse(data) as T) : null;

    return parsedData;
  }

  public remove(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  public async setProperty(key: string, property: string, value: any) {
    const valueToStore = JSON.stringify(value);
    return this.redisClient.hset(key, property, valueToStore);
  }

  public async incrementProperty(
    key: string,
    property: string,
    incrementNumber: number,
  ) {
    return this.redisClient.hincrby(key, property, incrementNumber);
  }
}
