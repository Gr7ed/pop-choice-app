import { customType } from 'drizzle-orm/pg-core';

export type Vector1536 = number[];

export const vector1536 = customType<{ data: Vector1536; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: Vector1536) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): Vector1536 {
    return value.replace(/[[\]]/g, '').split(',').map(Number);
  },
});
