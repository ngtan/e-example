// src/lib/config/schema.ts
// src/lib/config/schema.ts
import { ConfigSchema, ConfigValue } from './types';

export class SchemaValidator {
  constructor(private schema: ConfigSchema) {}

  validate(config: ConfigValue): boolean {
    return this.validateObject(config, this.schema);
  }

  private validateObject(
    value: ConfigValue,
    schema: ConfigSchema,
    path: string = ''
  ): boolean {
    for (const [key, schemaProps] of Object.entries(schema)) {
      const fullPath = path ? `${path}.${key}` : key;
      const currentValue = value[key];

      if (schemaProps.required && currentValue === undefined) {
        throw new Error(`Missing required config key: ${fullPath}`);
      }

      if (currentValue === undefined && 'default' in schemaProps) {
        continue;
      }

      if (currentValue !== undefined) {
        if (!this.validateType(currentValue, schemaProps, fullPath)) {
          return false;
        }

        if (schemaProps.validate && !schemaProps.validate(currentValue)) {
          throw new Error(`Invalid value for config key: ${fullPath}`);
        }

        if (schemaProps.type === 'object' && schemaProps.properties) {
          if (!this.validateObject(currentValue as ConfigValue, schemaProps.properties, fullPath)) {
            return false;
          }
        }

        if (schemaProps.type === 'array' && schemaProps.items) {
          if (!this.validateArray(currentValue as Array<any>, schemaProps.items, fullPath)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private validateArray(
    array: Array<any>,
    itemSchema: ConfigSchema,
    path: string
  ): boolean {
    return array.every((item, index) => {
      const itemPath = `${path}[${index}]`;
      return this.validateObject({ item }, { item: itemSchema }, itemPath);
    });
  }

  private validateType(
    value: any,
    schema: ConfigSchema[string],
    path: string
  ): boolean {
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`${path} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`${path} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`${path} must be a boolean`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error(`${path} must be an object`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`${path} must be an array`);
        }
        break;
      default:
        throw new Error(`Unknown type in schema for ${path}`);
    }
    return true;
  }
}

// export class ConfigSchema {
//   constructor(private schema: Record<string, SchemaDefinition>) {}

//   validate(config: Record<string, any>): ValidationResult {
//     const errors: ValidationError[] = [];

//     for (const [key, definition] of Object.entries(this.schema)) {
//       const value = config[key];
//       const error = this.validateField(key, value, definition);
//       if (error) {
//         errors.push(error);
//       }
//     }

//     return {
//       valid: errors.length === 0,
//       errors
//     };
//   }

//   private validateField(
//     key: string,
//     value: any,
//     definition: SchemaDefinition
//   ): ValidationError | null {
//     if (definition.required && value === undefined) {
//       return new ValidationError(
//         key,
//         'required',
//         'Field is required'
//       );
//     }

//     if (value !== undefined) {
//       if (definition.type && typeof value !== definition.type) {
//         return new ValidationError(
//           key,
//           'type',
//           `Expected ${definition.type}, got ${typeof value}`
//         );
//       }

//       if (definition.validate) {
//         const result = definition.validate(value);
//         if (!result.valid) {
//           return new ValidationError(
//             key,
//             'validation',
//             result.message
//           );
//         }
//       }
//     }

//     return null;
//   }
// }
