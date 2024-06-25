import { getOctokit, context } from "@actions/github";
import { getInput, setOutput, info, getBooleanInput } from "@actions/core";
import Mustache from "mustache";

import { branchNameToEnvId } from "./utils.js";
import { createApiClient, HumanitecClient } from "./humanitec/index.js";
import { ResponseError } from "@humanitec/autogen";

type octokit = ReturnType<typeof getOctokit>;

async function createEnvironment(input: ActionInput): Promise<void> {
  const {
    orgId,
    appId,
    envId,
    context,
    octokit,
    humClient,
    branchName,
    environmentUrl,
    webAppUrl,
  } = input;

  const baseEnvId = getInput("base-env") || "development";
  const createAutomationRule = getBooleanInput("create-automation-rule");
  console.log("createAutomationRule", createAutomationRule);
  const imageName = (process.env.GITHUB_REPOSITORY || "").replace(/.*\//, "");
  const image =
    getInput("image") || `registry.humanitec.io/${orgId}/${imageName}`;

  const baseEnv = await humClient.getEnvironment({
    orgId,
    appId,
    envId: baseEnvId,
  });

  if (!baseEnv.last_deploy) {
    throw new Error(`Environment ${baseEnv.id} has never been deployed`);
  }

  const createEnv = await humClient.createEnvironment({
    orgId,
    appId,
    EnvironmentDefinitionRequest: {
      from_deploy_id: baseEnv.last_deploy.id,
      id: envId,
      name: envId,
      type: baseEnv.type,
    },
  });

  console.log(`Created environment: ${createEnv.id}, ${environmentUrl}`);

  if (createAutomationRule) {
    const matchRef = `refs/heads/${branchName}`;
    const createRule = await humClient.createAutomationRule({
      orgId,
      appId,
      envId,
      AutomationRuleRequest: {
        active: true,
        artefacts_filter: [image],
        type: "update",
        match_ref: matchRef,
      },
    });

    console.log(
      `Created auto-deployment rule for ${createRule.match_ref} and image ${createRule.artefacts_filter[0]}`,
    );
  }

  if (!octokit) {
    return;
  }

  const deployment = await octokit.rest.repos.createDeployment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: branchName,
    auto_merge: false,
    environment: envId,
    transient_environment: true,
    required_contexts: [],
  });

  if (!("id" in deployment.data)) {
    throw new Error(`Creating deployment failed ${deployment.data.message}`);
  }

  const deploymentId = deployment.data.id;
  console.log(`Created github deployment ${deploymentId}`);

  await octokit.rest.repos.createDeploymentStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    deployment_id: deploymentId,
    ref: branchName,
    auto_merge: false,
    state: "pending",
    environment_url: environmentUrl,
    log_url: webAppUrl,
  });
}

async function findLatestDeployment(octokit: octokit, envId: string) {
  const deployments = await octokit.rest.repos.listDeployments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    environment: envId,
  });

  if (deployments.data.length === 0) {
    return;
  }

  return deployments.data[0];
}

async function notifyDeploy(input: NotifyInput): Promise<void> {
  const { envId, context, octokit, environmentUrl, webAppUrl, branchName } =
    input;

  if (!octokit) {
    return;
  }

  const latestDeployment = await findLatestDeployment(octokit, envId);
  if (!latestDeployment) {
    console.log("No deployment found");
    return;
  }

  let deploymentId = latestDeployment.id;

  const currentSHA = process.env.GITHUB_SHA;
  if (latestDeployment.sha !== currentSHA) {
    console.log(
      `Current deployment sha ${latestDeployment.sha} is not matching commit sha ${currentSHA}`,
    );
    console.log(`Creating new deployment`);
    // Create another deployment as otherwise github marks the current one as outdated
    const deployment = await octokit.rest.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: branchName,
      auto_merge: false,
      environment: envId,
      transient_environment: true,
      required_contexts: [],
    });

    if (!("id" in deployment.data)) {
      throw new Error(`Creating deployment failed ${deployment.data.message}`);
    }

    deploymentId = deployment.data.id;

    console.log(`Created github deployment ${deploymentId}`);
  }

  await octokit.rest.repos.createDeploymentStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    deployment_id: deploymentId,
    state: "success",
    environment_url: environmentUrl,
    log_url: webAppUrl,
  });
}

async function deleteEnvironment(input: ActionInput): Promise<void> {
  const { orgId, appId, envId, context, octokit, humClient } = input;

  try {
    await humClient.deleteEnvironment({
      orgId,
      appId,
      envId,
    });
  } catch (e) {
    if (e instanceof ResponseError && e.response.status == 404) {
      // Environment already deleted
    } else {
      throw e;
    }
  }

  console.log(`Deleted environment: ${envId}`);

  if (!octokit) {
    return;
  }

  const latestDeployment = await findLatestDeployment(octokit, envId);
  if (!latestDeployment) {
    console.log("No deployment found");
    return;
  }

  await octokit.rest.repos.createDeploymentStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    deployment_id: latestDeployment.id,
    state: "inactive",
  });
}

interface ActionInput {
  orgId: string;
  appId: string;
  envId: string;
  context: typeof context;
  octokit?: octokit;
  humClient: HumanitecClient;
  branchName: string;
  environmentUrl: string;
  webAppUrl: string;
}

type NotifyInput = Omit<ActionInput, "humClient">;

/**
 * Performs the GitHub action.
 */
export async function runAction(): Promise<void> {
  const orgId = getInput("humanitec-org", { required: true });
  const appId = getInput("humanitec-app", { required: true });
  const action = getInput("action", { required: true });
  const ghToken = getInput("github-token");

  let octokit;
  if (ghToken) {
    octokit = getOctokit(ghToken);
  }

  const branchName = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (!branchName) {
    throw new Error("No branch name found");
  }

  const envId = branchNameToEnvId("dev", branchName);
  const envPath = `/orgs/${orgId}/apps/${appId}/envs/${envId}`;
  const webAppUrl = `https://app.humanitec.io${envPath}`;

  const environmentUrlTemplate = getInput("environment-url-template");

  const templateParams = { envId, appId, orgId, branchName };
  let environmentUrl = webAppUrl;
  if (environmentUrlTemplate) {
    environmentUrl = Mustache.render(environmentUrlTemplate, templateParams);
  }
  info("Using environment: " + environmentUrl);
  setOutput("environment-url", environmentUrl);
  setOutput("humanitec-env", envId);
  if (action == "get-environment-url") {
    return;
  }

  const notifyParams: NotifyInput = {
    ...templateParams,
    context,
    octokit,
    webAppUrl,
    environmentUrl,
  };
  if (action == "notify") {
    return notifyDeploy(notifyParams);
  }

  const token = getInput("humanitec-token", { required: true });
  const apiHost = getInput("humanitec-api") || "api.humanitec.io";
  const humClient = createApiClient(apiHost, token);

  const actionParams: ActionInput = { ...notifyParams, humClient };
  if (action == "create") {
    return createEnvironment(actionParams);
  } else if (action == "delete") {
    return deleteEnvironment(actionParams);
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
}
