import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从请求中提取当前登录用户信息
 * 使用方式: @CurrentUser() user
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
