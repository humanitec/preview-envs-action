import * as core from "@actions/core";
import { runAction } from "./action.js";
import { ResponseError } from "@humanitec/autogen";

runAction().catch(async (e) => {
  core.error("Action failed");

  core.setFailed(`${e.name} ${e.message}`);

  if (e instanceof ResponseError) {
    const { response } = e;
    core.error(`API response:`);
    core.error(`status: ${response.status}`);
    if (response.body && response.bodyUsed) {
      core.error(`response: ${await response.text()}`);
    }
  }
});
