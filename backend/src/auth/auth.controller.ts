import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    try {
      const result = await this.authService.login(dto);
      await this.auditService.log(result.staff, 'STAFF_LOGIN_SUCCESS', 'Auth', result.staff.id, `Staff logged in: ${dto.email}`, req.ip);
      return result;
    } catch (error) {
      await this.auditService.log(null, 'STAFF_LOGIN_FAILED', 'Auth', null, `Failed staff login attempt for email: ${dto.email}`, req.ip);
      throw error;
    }
  }

  @Post('user-login')
  async userLogin(@Body() dto: LoginDto, @Req() req: any) {
    try {
      const result = await this.authService.loginUser(dto);
      await this.auditService.log(result.user, 'USER_LOGIN_SUCCESS', 'Auth', result.user.id, `User logged in: ${dto.email}`, req.ip);
      return result;
    } catch (error) {
      await this.auditService.log(null, 'USER_LOGIN_FAILED', 'Auth', null, `Failed user login attempt for email: ${dto.email}`, req.ip);
      throw error;
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterUserDto, @Req() req: any) {
    const user = await this.authService.registerUser(dto);
    await this.auditService.log(user, 'USER_REGISTERED', 'User', user.id, `New user registered: ${user.email}`, req.ip);
    await this.emailService.sendDynamicEmail(
      user.email,
      'USER_REGISTERED',
      { name: user.name }
    );
    return user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: any) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: any) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}