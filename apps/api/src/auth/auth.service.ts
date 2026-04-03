import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    /** 用户注册 */
    async register(dto: RegisterDto) {
        // 1. 检查邮箱是否已注册
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingEmail) {
            throw new ConflictException('该邮箱已被注册');
        }

        // 2. 检查用户名是否已存在
        const existingUsername = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });
        if (existingUsername) {
            throw new ConflictException('该用户名已被使用');
        }

        // 3. 角色判断逻辑
        let targetRole: any = 'USER'; // 默认是普通用户

        // 只有当请求尝试注册为管理员时，才校验 secret
        if (dto.role === 'ADMIN' || dto.role === 'SUPER_ADMIN') {
            const secret = this.configService.get<string>('ADMIN_REGISTRATION_SECRET') || 'my-top-secret-key';
            if (dto.adminSecret !== secret) {
                throw new ForbiddenException('管理员注册密钥不正确，无法注册为管理员身份！');
            }
            targetRole = dto.role;
        }

        // 4. 密码加密并创建用户
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
                role: targetRole,
            },
        });

        // 5. 生成 Tokens
        const tokens = this.generateTokens(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            ...tokens,
        };
    }

    /** 用户登录 */
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('账户已被封禁，请联系管理员');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        const tokens = this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            ...tokens,
        };
    }

    /** 刷新 Token */
    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('无效的刷新令牌');
            }

            return this.generateTokens(user.id, user.email, user.role);
        } catch (e) {
            throw new UnauthorizedException('刷新令牌已过期或无效');
        }
    }

    /** 获取当前用户信息 */
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('用户不存在');
        }

        return user;
    }

    /** 更新个人资料：如头像 */
    async updateProfile(userId: string, data: { username?: string; avatar?: string }) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
            },
        });
        return user;
    }

    /** 生成双 Token */
    private generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };
        return {
            accessToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret',
                expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '2h') as any,
            }),
            refreshToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
                expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
            }),
        };
    }
}
