import {describe, expect, test, beforeEach, afterAll} from '@jest/globals';
import {runAction} from './action';
import {randomBytes} from 'crypto';

// Emulate https://github.com/actions/toolkit/blob/819157bf8/packages/core/src/core.ts#L128
const setInput = (name: string, value: string): void => {
  process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
};

const ensureEnv = (name: string): string => {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Required environment variables ${name} is empty.`);
  }

  return val;
};

const token = ensureEnv('HUMANITEC_TOKEN');
const orgId = ensureEnv('HUMANITEC_ORG');
const appId = ensureEnv('HUMANITEC_APP');

describe('action', () => {
  let branch: string;

  beforeEach(async () => {
    setInput('humanitec-token', token);
    setInput('humanitec-org', orgId);
    setInput('humanitec-app', appId);

    branch = randomBytes(10).toString('hex');
    process.env['GITHUB_HEAD_REF'] = branch;
  });

  afterAll(async () => {
    // TODO delete all envs
  });

  test('succeeds', async () => {
    try {
      setInput('action', 'create');
      await runAction();
      expect(process.exitCode).toBeFalsy();

      setInput('action', 'delete');
      await runAction();
      expect(process.exitCode).toBeFalsy();
    } catch (e) {
      console.log(e);
      throw new Error('failed');
    }
  });
});
