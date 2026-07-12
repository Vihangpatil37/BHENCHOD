import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Career, CareerSchema } from './schemas/career.schema';
import { SavedCareer, SavedCareerSchema } from './schemas/saved-career.schema';
import { CareersService } from './careers.service';
import { CareerSeedService } from './import/seed.service';
import { CareersController } from './careers.controller';
import { AIServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Career.name, schema: CareerSchema },
      { name: SavedCareer.name, schema: SavedCareerSchema },
    ]),
    AIServiceModule,
  ],
  controllers: [CareersController],
  providers: [CareersService, CareerSeedService],
  exports: [CareersService, CareerSeedService, MongooseModule],
})
export class CareersModule {}
