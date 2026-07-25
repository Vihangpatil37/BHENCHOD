import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const userId = randomUUID().replace(/-/g, ''); // Hyphen-stripped UUID

    const user = new this.userModel({
      user_id: userId,
      email: dto.email.toLowerCase(),
      full_name: dto.full_name,
      password_hash: passwordHash,
      role: 'student',
      provider: 'local',
      email_verified: false,
      failed_login_attempts: 0,
    });

    await user.save();
    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lock status
    if (user.locked_until && user.locked_until > new Date()) {
      const waitTime = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 1000 / 60,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${waitTime} minutes.`,
      );
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatch) {
      // Increment failed attempts
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save();
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset attempts on successful login
    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    user.last_login = new Date();
    await user.save();

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123',
      });
      const user = await this.userModel
        .findOne({ user_id: payload.sub })
        .exec();
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(user: User) {
    // In stateless JWT auth, logout usually just clears client-side state.
    // If needed, token blacklist can be implemented. For now, returning success is sufficient.
    return { success: true };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.user_id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_123',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123',
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  sanitizeUser(user: User) {
    return {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.get('created_at'),
      updated_at: user.get('updated_at'),
    };
  }
}
