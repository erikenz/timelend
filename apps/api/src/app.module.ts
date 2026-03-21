import { Module } from "@nestjs/common";
import { database, PrismaClient } from "@repo/database";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommitmentModule } from "./commitment/commitment.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [UsersModule, CommitmentModule],
  controllers: [AppController],
  providers: [
    AppService,
    // Provide the Prisma client instance from the shared database package so it can be injected by type.
    {
      provide: PrismaClient,
      useValue: database,
    },
  ],
  exports: [PrismaClient],
})
export class AppModule {}
