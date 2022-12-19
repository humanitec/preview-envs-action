import {
  AutomationRuleApi,
  Configuration,
  ConfigurationParameters,
  EnvironmentApi,
} from './generated';

export interface HumanitecClient {
  environmentApi: EnvironmentApi
  automationRuleApi: AutomationRuleApi
}


export const createApiClient = (basePath: string, token: string) => {
  const configParams: ConfigurationParameters = {
    basePath: `https://${basePath}`,
    baseOptions: {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  };

  const apiConfig = new Configuration(configParams);

  return {
    environmentApi: new EnvironmentApi(apiConfig),
    automationRuleApi: new AutomationRuleApi(apiConfig),
  };
};
