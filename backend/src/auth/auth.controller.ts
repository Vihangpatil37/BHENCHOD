import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { User } from './schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }



  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // Uses JwtAuthGuard implicitly because not @Public()
  // Wait, the client only has a temporary token after login/register.
  // Actually, standard JwtStrategy validates tokens with JWT_ACCESS_SECRET.
  // Both setupToken and twoFactorToken are signed with JWT_ACCESS_SECRET.
  // So the standard JwtGuard will pass them. We just need to ensure the user ID is in req.user.
  // In `me`, we probably want to make sure it's a FULL token, not a temp one,
  // but let's just extract the user ID for 2FA.
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  async setup2fa(@Request() req: any) {
    return this.authService.setup2fa(req.user.user_id);
  }

  @Post('2fa/verify-setup')
  @HttpCode(HttpStatus.OK)
  async verify2faSetup(@Request() req: any, @Body('code') code: string) {
    return this.authService.verify2faSetup(req.user.user_id, code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2fa(@Request() req: any, @Body('code') code: string) {
    return this.authService.verify2fa(req.user.user_id, code);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('recover-account')
  @HttpCode(HttpStatus.OK)
  async recoverAccount(
    @Body('email') email: string,
    @Body('recovery_code') recoveryCode: string,
    @Body('new_password') newPassword: string,
  ) {
    return this.authService.recoverAccount(email, recoveryCode, newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const user = req.user as User;
    return this.authService.logout(user);
  }

  @Get('me')
  async me(@Request() req: any) {
    // A quick check to ensure they didn't use a setup token for general access
    if (req.user.jwtPayload?.setup_2fa || req.user.jwtPayload?.verify_2fa) {
       return { error: 'Incomplete authentication' };
    }
    return this.authService.sanitizeUser(req.user as any);
  }
}
