import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CareersService } from './careers.service';
import { CreateCareerDto, UpdateCareerDto, ReviewPromoteDto } from './dto/career.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Public()
  @Get()
  async getCareers(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.careersService.findAll(category, search);
  }

  @Public()
  @Get('categories')
  async getCategories() {
    return this.careersService.findCategories();
  }

  @Public()
  @Get('by-codes')
  async getCareersByCodes(@Query('codes') codesString?: string) {
    const codes = codesString ? codesString.split(',').map((c) => c.trim()) : [];
    return this.careersService.findByCodes(codes);
  }

  @Public()
  @Get('related/:careerCode')
  async getRelated(@Param('careerCode') careerCode: string) {
    return this.careersService.findRelated(careerCode);
  }

  @Public()
  @Get(':careerCode')
  async getOne(@Param('careerCode') careerCode: string) {
    return this.careersService.findOne(careerCode);
  }

  // Saved / bookmarked careers (requires authentication)
  @Post('save')
  async saveCareer(@Request() req: any, @Body('career_code') careerCode: string) {
    return this.careersService.saveCareer(req.user.user_id, careerCode);
  }

  @Delete('save/:careerCode')
  async unsaveCareer(@Request() req: any, @Param('careerCode') careerCode: string) {
    return this.careersService.unsaveCareer(req.user.user_id, careerCode);
  }

  @Get('saved')
  async getSaved(@Request() req: any) {
    return this.careersService.getSavedCareers(req.user.user_id);
  }

  @Get('saved/status/:careerCode')
  async getSavedStatus(@Request() req: any, @Param('careerCode') careerCode: string) {
    return this.careersService.getSavedStatus(req.user.user_id, careerCode);
  }

  // ============ Admin Endpoints (Phase 10) ============

  private checkAdminRole(user: any) {
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admin users can perform this action');
    }
  }

  @Get('admin/careers')
  async adminListCareers(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category_code') categoryCode?: string,
    @Query('backfill_status') backfillStatus?: string,
    @Query('needs_enrichment') needsEnrichment?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: string,
  ) {
    this.checkAdminRole(req.user);
    return this.careersService.adminFindAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      category_code: categoryCode,
      backfill_status: backfillStatus,
      needs_enrichment: (() => {
        const ne = (needsEnrichment || '').toLowerCase();
        return ne === 'true' ? true : ne === 'false' ? false : undefined;
      })(),
      is_active: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      sort_by: sortBy || 'name',
      sort_order: sortOrder === 'desc' ? -1 : 1,
    });
  }

  @Get('admin/careers/:careerCode')
  async adminGetCareer(@Request() req: any, @Param('careerCode') careerCode: string) {
    this.checkAdminRole(req.user);
    return this.careersService.adminFindOne(careerCode);
  }

  @Put('admin/careers/:careerCode')
  async adminUpdateCareer(
    @Request() req: any,
    @Param('careerCode') careerCode: string,
    @Body() body: any,
  ) {
    this.checkAdminRole(req.user);
    return this.careersService.adminUpdate(careerCode, body);
  }

  @Post('admin/careers/:careerCode/publish-draft')
  async adminPublishDraft(@Request() req: any, @Param('careerCode') careerCode: string) {
    this.checkAdminRole(req.user);
    return this.careersService.adminPublishDraft(careerCode);
  }

  @Post('admin/careers/:careerCode/reject-draft')
  async adminRejectDraft(@Request() req: any, @Param('careerCode') careerCode: string) {
    this.checkAdminRole(req.user);
    return this.careersService.adminRejectDraft(careerCode);
  }

  @Post('admin/careers/bulk-publish')
  async adminBulkPublish(
    @Request() req: any,
    @Body() body: { filter?: Record<string, any> },
  ) {
    this.checkAdminRole(req.user);
    return this.careersService.adminBulkPublish(body.filter || {});
  }

  @Get('admin/careers/import-audit')
  async adminGetImportAudit(@Request() req: any) {
    this.checkAdminRole(req.user);
    return this.careersService.adminGetImportAudit();
  }

  @Patch('admin/careers/:careerCode/toggle-active')
  async adminToggleActive(@Request() req: any, @Param('careerCode') careerCode: string) {
    this.checkAdminRole(req.user);
    return this.careersService.adminToggleActive(careerCode);
  }
}
