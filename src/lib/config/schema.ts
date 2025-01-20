// src/lib/config/schema.ts
export class ConfigSchema {
  constructor(private schema: Record<string, SchemaDefinition>) {}

  validate(config: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [key, definition] of Object.entries(this.schema)) {
      const value = config[key];
      const error = this.validateField(key, value, definition);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateField(
    key: string,
    value: any,
    definition: SchemaDefinition
  ): ValidationError | null {
    if (definition.required && value === undefined) {
      return new ValidationError(
        key,
        'required',
        'Field is required'
      );
    }

    if (value !== undefined) {
      if (definition.type && typeof value !== definition.type) {
        return new ValidationError(
          key,
          'type',
          `Expected ${definition.type}, got ${typeof value}`
        );
      }

      if (definition.validate) {
        const result = definition.validate(value);
        if (!result.valid) {
          return new ValidationError(
            key,
            'validation',
            result.message
          );
        }
      }
    }

    return null;
  }
}
