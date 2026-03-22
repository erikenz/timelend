import { Controller, Get } from "@nestjs/common";

// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { ContractService } from "./blockchain/contract.service";
import { getGeminiApiKey } from "./config/env";
// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { DatabaseService } from "./database/database.service";

@Controller()
export class AppController {
  constructor(
    private readonly contractService: ContractService,
    private readonly databaseService: DatabaseService
  ) {}

  @Get()
  async getInfo() {
    const contract = await this.contractService.getRuntimeStatus();

    return {
      aiConfigured: Boolean(getGeminiApiKey()),
      contract,
      name: "TimeLend API",
      ok: true,
    };
  }

  @Get("health")
  async getHealth() {
    await this.databaseService.ping();

    const contract = await this.contractService.getRuntimeStatus();

    return {
      aiConfigured: Boolean(getGeminiApiKey()),
      blockchain: contract,
      database: "up",
      ok: true,
    };
  }
}
