import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommitmentModule } from "./commitment/commitment.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [UsersModule, CommitmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
