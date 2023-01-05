import {apiConfig, AutomationRuleApi, EnvironmentApi} from '@humanitec/autogen';

export interface HumanitecClient {
  environmentApi: EnvironmentApi
  automationRuleApi: AutomationRuleApi
}

export const createApiClient = (basePath: string, token: string) => {
  const config = apiConfig({
    token,
    apiHost: `https://${basePath}`,
  });

  return {
    environmentApi: new EnvironmentApi(config),
    automationRuleApi: new AutomationRuleApi(config),
  };
};
