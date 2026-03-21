import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { CommitmentModule } from './commitment/commitment.module';

@Module({
	imports: [UsersModule, CommitmentModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
