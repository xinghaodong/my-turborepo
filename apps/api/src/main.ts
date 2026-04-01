import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
// @ts-ignore
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局响应转换1
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局错误处理
  app.useGlobalFilters(new AllExceptionsFilter());

  // 设置 WebSocket 适配器为 WsAdapter（用于 Yjs 兼容）
  app.useWebSocketAdapter(new WsAdapter(app));

  // 全局 API 前缀
  app.setGlobalPrefix('api');

  // 启用 CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // 全局数据校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离 DTO 中未定义的属性
      forbidNonWhitelisted: true, // 如果传了未定义的属性则报错
      transform: true, // 自动类型转换
    }),
  );

  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0'); // 显式监听 0.0.0.0 以允许外部访问
  console.log(`🚀 API 服务已启动: http://localhost:${port}/api`);
}
bootstrap();
