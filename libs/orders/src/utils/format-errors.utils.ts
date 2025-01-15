import { ValidationError } from 'class-validator';

export function formatErrorMessages(errors: ValidationError[]) {
  return errors
    .map((err) => Object.values(err.constraints || {}).join(', '))
    .join('; ');
}
