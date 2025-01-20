// src/lib/config/validator.ts
export class ConfigValidator {
  constructor(
    private schema: ConfigSchema,
    private monitoring: MonitoringSystem
  ) {}

  async validate(config: Record<string, any>): Promise<ValidationResult> {
    const spanId = this.monitoring.tracer.startSpan('config.validate');

    try {
      const result = this.schema.validate(config);

      if (!result.valid) {
        this.monitoring.logger.log('warn', 'Config validation failed', {
          errors: result.errors
        });
      }

      return result;
    } finally {
      this.monitoring.tracer.endSpan(spanId);
    }
  }
}
