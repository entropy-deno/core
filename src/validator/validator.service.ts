import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.service.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { ValidationRule } from './interfaces/validation_rule.interface.ts';
import { ValidationRulesList } from './interfaces/validation_rules_list.interface.ts';

export class Validator {
  private readonly configurator = inject(Configurator);

  private readonly localizator = inject(Localizator);

  private readonly rules: ValidationRule[] = [];

  private readonly patterns: Record<string, RegExp> = {
    email:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ipv4:
      /^(?:25[0-5]|2[0-4]\d|[0-1]?\d{1,2})(?:\.(?:25[0-5]|2[0-4]\d|[0-1]?\d{1,2})){3}$/,
    ipv6:
      /^([[:xdigit:]]{1,4}(?::[[:xdigit:]]{1,4}){7}|::|:(?::[[:xdigit:]]{1,4}){1,6}|[[:xdigit:]]{1,4}:(?::[[:xdigit:]]{1,4}){1,5}|(?:[[:xdigit:]]{1,4}:){2}(?::[[:xdigit:]]{1,4}){1,4}|(?:[[:xdigit:]]{1,4}:){3}(?::[[:xdigit:]]{1,4}){1,3}|(?:[[:xdigit:]]{1,4}:){4}(?::[[:xdigit:]]{1,4}){1,2}|(?:[[:xdigit:]]{1,4}:){5}:[[:xdigit:]]{1,4}|(?:[[:xdigit:]]{1,4}:){1,6}:)$/,
    phoneNumber: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    username: /^[a-z][a-z0-9]*(?:[ _-][a-z0-9]*)*$/iu,
  };

  constructor() {
    this.rules = [
      {
        name: 'accepted',
        errorMessage: 'Field :field must be accepted',
        validate: ([value]) => {
          return ['1', 'true', 'on', 'yes'].includes(
            value as string,
          );
        },
      },
      {
        name: 'boolean',
        errorMessage: 'Field :field must be a boolean value',
        validate: ([value]) => {
          return ['0', '1', 'true', 'false'].includes(
            value as string,
          );
        },
      },
      {
        name: 'date',
        errorMessage: 'Field :field must be a valid date format',
        validate: ([value]) => {
          const date = new Date(value ?? '') as string | Date;

          return date !== 'Invalid Date' && !isNaN(date as unknown as number);
        },
      },
      {
        name: 'declined',
        errorMessage: 'Field :field must be declined',
        validate: ([value]) => {
          return [null, '0', 'false', 'off', 'no'].includes(
            value,
          );
        },
      },
      {
        name: 'doesntEndWith',
        errorMessage: `Field :field must not end with ':value'`,
        validate: ([value, search]) => {
          return !value?.endsWith(search as string);
        },
      },
      {
        name: 'doesntStartWith',
        errorMessage: `Field :field must not start with ':value'`,
        validate: ([value, search]) => {
          return !value?.startsWith(search as string);
        },
      },
      {
        name: 'endsWith',
        errorMessage: `Field :field must end with ':value'`,
        validate: ([value, search]) => {
          return value?.endsWith(search as string);
        },
      },
      {
        name: 'email',
        errorMessage: `Field :field must be a valid email`,
        validate: ([value]) => {
          return this.patterns.email.test(value ?? '');
        },
      },
      {
        name: 'float',
        errorMessage: `Field :field must be a floating point number`,
        validate: ([value]) => {
          return !Number.isInteger(value) && !isNaN(parseFloat(value ?? ''));
        },
      },
      {
        name: 'in',
        errorMessage: `Field :field must be a value from [:value]`,
        validate: ([value, array]) => {
          return (array as unknown[]).includes(value);
        },
      },
      {
        name: 'integer',
        errorMessage: `Field :field must be an integer number`,
        validate: ([value]) => {
          return Number.isInteger(value) && !isNaN(parseInt(value ?? ''));
        },
      },
      {
        name: 'ip',
        errorMessage: `Field :field must be a valid IP address`,
        validate: ([value]) => {
          return this.patterns.ipv4.test(value ?? '') ||
            this.patterns.ipv6.test(value ?? '');
        },
      },
      {
        name: 'ipv4',
        errorMessage: `Field :field must be a valid IPv4 address`,
        validate: ([value]) => {
          return this.patterns.ipv4.test(value ?? '');
        },
      },
      {
        name: 'ipv6',
        errorMessage: `Field :field must be a valid IPv6 address`,
        validate: ([value]) => {
          return this.patterns.ipv6.test(value ?? '');
        },
      },
      {
        name: 'json',
        errorMessage: `Field :field must be a valid JSON string`,
        validate: ([value]) => {
          if (!value) {
            return false;
          }

          try {
            JSON.parse(value);
          } catch {
            return false;
          }

          return true;
        },
      },
      {
        name: 'length',
        errorMessage: `Field :field must be a :value characters long`,
        validate: ([value, length]) => {
          return value?.length === (length as number);
        },
      },
      {
        name: 'lowercase',
        errorMessage: `Field :field must be a lowercased string`,
        validate: ([value]) => {
          return value === value?.toLowerCase();
        },
      },
      {
        name: 'max',
        errorMessage: `Field :field must be less than :value`,
        validate: ([value, maxValue]) => {
          return value && value.length < (maxValue as number);
        },
      },
      {
        name: 'maxLength',
        errorMessage: `Field :field must be shorter than :value characters`,
        validate: ([value, length]) => {
          return value && value.length < (length as number);
        },
      },
      {
        name: 'maxOrEqual',
        errorMessage: `Field :field must be less than or equal to :value`,
        validate: ([value, maxValue]) => {
          return value && value.length <= (maxValue as number);
        },
      },
      {
        name: 'maxOrEqualLength',
        errorMessage:
          `Field :field must be shorter than :value characters or equal length`,
        validate: ([value, length]) => {
          return value && value.length <= (length as number);
        },
      },
      {
        name: 'min',
        errorMessage: `Field :field must be greater than :value`,
        validate: ([value, maxValue]) => {
          return value && value.length > (maxValue as number);
        },
      },
      {
        name: 'minLength',
        errorMessage: `Field :field must be longer than :value characters`,
        validate: ([value, length]) => {
          return value && value.length > (length as number);
        },
      },
      {
        name: 'minOrEqual',
        errorMessage: `Field :field must be greater than or equal to :value`,
        validate: ([value, maxValue]) => {
          return value && value.length >= (maxValue as number);
        },
      },
      {
        name: 'minOrEqualLength',
        errorMessage:
          `Field :field must be longer than :value characters or equal length`,
        validate: ([value, length]) => {
          return value && value.length >= (length as number);
        },
      },
      {
        name: 'notIn',
        errorMessage: `Field :field must not be a value from [:value]`,
        validate: ([value, array]) => {
          return !(array as unknown[]).includes(value);
        },
      },
      {
        name: 'numeric',
        errorMessage: `Field :field must be numeric`,
        validate: ([value]) => {
          return !isNaN(parseInt(value ?? '')) ||
            !isNaN(parseFloat(value ?? ''));
        },
      },
      {
        name: 'otherThan',
        errorMessage: `Field :field must be other than :value`,
        validate: ([value, search]) => {
          return value !== (search as string);
        },
      },
      {
        name: 'phoneNumber',
        errorMessage: `Field :field must be a valid phone number`,
        validate: ([value]) => {
          return this.patterns.phoneNumber.test(
            value?.replaceAll(' ', '') ?? '',
          );
        },
      },
      {
        name: 'regexp',
        errorMessage: `Field :field must follow the :value pattern`,
        validate: ([value, pattern]) => {
          return (pattern as RegExp).test(value ?? '');
        },
      },
      {
        name: 'required',
        errorMessage: `Field :field is required`,
        validate: ([value]) => {
          return value && value !== '' && value !== null;
        },
      },
      {
        name: 'startsWith',
        errorMessage: `Field :field must start with ':value'`,
        validate: ([value, search]) => {
          return value?.startsWith(search as string);
        },
      },
      {
        name: 'uppercase',
        errorMessage: `Field :field must be an uppercased string`,
        validate: ([value]) => {
          return value?.toUpperCase() === value;
        },
      },
      {
        name: 'username',
        errorMessage: `Field :field must be a valid user name`,
        validate: ([value]) => {
          return this.patterns.username.test(value ?? '');
        },
      },
      ...(this.configurator.entries.validatorRules ?? []),
    ];
  }

  private async check(
    rule: ValidationRule,
    fieldValue: string | null,
    ruleValue: unknown,
  ): Promise<boolean> {
    const passes = rule.validate.call(
      this,
      [fieldValue instanceof File ? null : fieldValue, ruleValue],
      fieldName,
    );

    return passes instanceof Promise ? await passes : passes;
  }

  public registerRule(rule: ValidationRule): void {
    for (const registeredRule of this.rules) {
      if (registeredRule.name === rule.name) {
        throw new Error(
          `Validator rule '${rule.name}' already exists`,
        );
      }
    }

    this.rules.push(rule);
  }

  public registerRules(rules: ValidationRule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  public async validate(
    rules: Record<
      string,
      Partial<ValidationRulesList> | Record<string, unknown>
    >,
    subject: HttpRequest | Record<string, string | null>,
    errorLocale?: string,
  ): Promise<Record<string, string[]>> {
    const errors: Record<string, string[]> = {};

    for (const [fieldName, ruleSet] of Object.entries(rules)) {
      const fieldValue = subject instanceof HttpRequest
        ? await subject.input(fieldName)
        : subject[fieldName];

      for (const [rule, ruleValue] of Object.entries(ruleSet)) {
        const ruleObject = this.rules.find((ruleData) =>
          ruleData.name === rule
        );

        if (!ruleObject) {
          throw new Error(`Invalid validation rule '${rule}'`);
        }

        if (!await this.check(ruleObject, fieldValue, ruleValue)) {
          if (!(fieldName in errors)) {
            errors[fieldName] = [];
          }

          errors[fieldName].push(
            this.localizator
              .translate(
                subject.locale ?? errorLocale ??
                  this.configurator.entries.locales.default,
                ruleObject.errorMessage,
              )
              .replaceAll(':field', fieldName)
              .replaceAll(
                ':value',
                Array.isArray(ruleValue)
                  ? ruleValue.join(', ')
                  : String(ruleValue),
              ),
          );
        }
      }
    }

    return errors;
  }
}
