import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateStaff(email: string, pass: string) {
    const staff = await this.prisma.staff.findUnique({ where: { email } });
    if (!staff) return null;

    // Compare plaintext password with hashed password in DB
    const isMatch = await bcrypt.compare(pass, staff.password);
    if (!isMatch) return null;

    // Omit password from the returned object
    const { password, ...result } = staff;
    return result;
  }

  async login(dto: LoginDto) {
    const staff = await this.validateStaff(dto.email, dto.password);
    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: staff.id, 
      email: staff.email, 
      isAdmin: staff.isAdmin,
      role: staff.role, // <-- ADD THIS
      deptId: staff.deptId, // <-- ADD THIS
      teamId: staff.teamId, // <-- ADD THIS
      kbRole: staff.kbRole
    };

    return {
      access_token: this.jwtService.sign(payload),
      staff: staff,
    };
  }
  
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    const { password, ...result } = user;
    return result;
  }

  async loginUser(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Payload includes role: 'user' to distinguish from staff
    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.orgId };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

    async registerUser(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        orgId: dto.orgId || null,
        // Cast the string to the Prisma Enum
        role: (dto.role as UserRole) || 'USER',
      },
    });
  }

  async requestPasswordReset(email: string) {
    // Check if email exists in User or Staff tables
    const user = await this.prisma.user.findUnique({ where: { email } });
    const staff = await this.prisma.staff.findUnique({ where: { email } });

    if (!user && !staff) {
      // For security, don't reveal that the email doesn't exist.
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    await this.prisma.passwordReset.create({
      data: { email, token, expiresAt },
    });

    // Send the email (Use your frontend URL here)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    await this.emailService.sendDynamicEmail(
      email,
      'PASSWORD_RESET',
      { resetLink }
    );

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired token.');
    }

    if (resetRecord.expiresAt < new Date()) {
      await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      throw new BadRequestException('Token has expired. Please request a new reset link.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password for User or Staff
    const user = await this.prisma.user.findUnique({ where: { email: resetRecord.email } });
    const staff = await this.prisma.staff.findUnique({ where: { email: resetRecord.email } });

    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    } else if (staff) {
      await this.prisma.staff.update({ where: { id: staff.id }, data: { password: hashedPassword } });
    }

    // Delete the used token
    await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    return { message: 'Password reset successfully. You can now log in.' };
  }
}