import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./common/database/prisma.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { ConsentsModule } from "./modules/consents/consents.module";
import { SkinProfileModule } from "./modules/skin-profile/skin-profile.module";
import { ProductsModule } from "./modules/products/products.module";
import { envValidationSchema } from "./common/config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema
    }),
    JwtModule.register({ global: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ConsentsModule,
    SkinProfileModule,
    ProductsModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
