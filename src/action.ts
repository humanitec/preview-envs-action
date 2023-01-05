import {getOctokit, context} from '@actions/github';
import {getInput} from '@actions/core';

import {branchNameToEnvId} from './utils';
import {createApiClient, HumanitecClient} from './humanitec';

async function createEnvironment(input: ActionInput): Promise<void> {
  const {orgId, appId, envId, context, octokit, humClient, branchName} = input;

  const baseEnvId = getInput('base-env') || 'development';

  const ENV_PATH = `/orgs/${orgId}/apps/${appId}/envs/${envId}`;
  const IMAGE_ID = `registry.humanitec.io/${orgId}/${appId}`;

  const baseEnvRes = await humClient.environmentApi.orgsOrgIdAppsAppIdEnvsEnvIdGet(orgId, appId, baseEnvId);
  if (baseEnvRes.status != 200) {
    throw new Error(`Unexpected response fetching env: ${baseEnvRes.status}, ${baseEnvRes.data}`);
  }

  const baseEnv = baseEnvRes.data;

  if (!baseEnv.last_deploy) {
    throw new Error(`Environment ${baseEnv.id} has never been deployed`);
  }

  const createEnvRes = await humClient.environmentApi.orgsOrgIdAppsAppIdEnvsPost(
    orgId,
    appId,
    {
      from_deploy_id: baseEnv.last_deploy.id,
      id: envId,
      name: envId,
      type: baseEnv.type,
    },
  );
  if (createEnvRes.status != 201) {
    throw new Error(`Unexpected response creating env: ${baseEnvRes.status}, ${baseEnvRes.data}`);
  }

  const createRuleRes = await humClient.automationRuleApi.orgsOrgIdAppsAppIdEnvsEnvIdRulesPost(
    orgId,
    appId,
    envId,
    {
      active: true,
      artefacts_filter: [IMAGE_ID],
      type: 'update',
      match_ref: `refs/heads/${branchName}`,
    },
  );
  if (createRuleRes.status != 201) {
    throw new Error(`Unexpected response creating rule: ${baseEnvRes.status}, ${baseEnvRes.data}`);
  }

  if (octokit) {
    await octokit.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `Created environment in Humanitec: https://app.humanitec.io${ENV_PATH}`,
    });
  }
}


async function deleteEnvironment(input: ActionInput): Promise<void> {
  const {orgId, appId, envId, context, octokit, humClient} = input;

  const delEnvRes = await humClient.environmentApi.orgsOrgIdAppsAppIdEnvsEnvIdDelete(orgId, appId, envId);
  if (delEnvRes.status != 204 && delEnvRes.status != 404) {
    throw new Error(`Unexpected response creating rule: ${delEnvRes.status}, ${delEnvRes.data}`);
  }

  if (octokit) {
    await octokit.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `Preview environment deleted.`,
    });
  }
}

interface ActionInput {
  orgId: string;
  appId: string;
  envId: string;
  context: typeof context;
  octokit?: ReturnType<typeof getOctokit>;
  humClient: HumanitecClient;
  branchName: string;
}

/**
 * Performs the GitHub action.
 */
export async function runAction(): Promise<void> {
  const token = getInput('humanitec-token', {required: true});
  const orgId = getInput('humanitec-org', {required: true});
  const appId = getInput('humanitec-app', {required: true});
  const apiHost = getInput('humanitec-api') || 'api.humanitec.io';

  const action = getInput('action', {required: true});
  const ghToken = getInput('github-token');

  let octokit;
  if (ghToken) {
    octokit = getOctokit(ghToken);
  }

  const branchName = process.env.GITHUB_HEAD_REF;
  if (!branchName) {
    throw new Error('No branch name found');
  }

  const envId = branchNameToEnvId('dev', branchName);
  const humClient = createApiClient(apiHost, token);

  const input = {orgId, appId, envId, context, octokit, humClient, branchName};

  if (action == 'create') {
    return createEnvironment(input);
  } else if (action == 'delete') {
    return deleteEnvironment(input);
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
}
