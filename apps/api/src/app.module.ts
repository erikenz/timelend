import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { CommitmentsModule } from "./commitments/commitments.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [DatabaseModule, CommitmentsModule],
  controllers: [AppController],
})
export class AppModule {}
