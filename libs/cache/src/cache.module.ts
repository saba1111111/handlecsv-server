import { Module } from '@nestjs/common';
import { CacheModuleProviders } from './providers';

@Module({
  imports: [],
  providers: [...CacheModuleProviders],
  exports: [...CacheModuleProviders],
})
export class CacheModule {}
