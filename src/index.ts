import * as core from '@actions/core';
import {runAction} from './action';
import axios from 'axios';

runAction().catch((e) => {
  core.error('Action failed');

  core.setFailed(`${e.name} ${e.message}`);
  if (axios.isAxiosError(e)) {
    if (e.config) {
      core.error(`method: ${e.config.method}`);
      core.error(`request: ${e.config.url}`);
    }
    if (e.response) {
      core.error(`response: ${JSON.stringify(e.response.data)}`);
    }
  }
});
