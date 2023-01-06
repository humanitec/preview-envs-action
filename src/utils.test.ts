import {describe, expect, test} from '@jest/globals';
import {branchNameToEnvId} from './utils';

describe('utils', () => {
  describe('branchNameToEnvId', () => {
    const testCases = [
      {name: 'basic', input: 'basic', expectedOutput: 'dev-basic'},
      {name: 'long', input: 'a'.repeat(100), expectedOutput: 'dev-aaaaaaaaaaaaaaaa'},
      {name: 'special', input: 'some/feature_branch', expectedOutput: 'dev-some-feature-bra'},
      {name: 'hyphen', input: '-name_-', expectedOutput: 'dev-name'},
    ];

    for (const tc of testCases) {
      // eslint-disable-next-line jest/valid-title
      test(tc.name, async () => {
        expect(branchNameToEnvId('dev', tc.input)).toEqual(tc.expectedOutput);
      });
    }
  });
});
