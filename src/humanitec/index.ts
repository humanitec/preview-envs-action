import { APIConfig, apiConfig, PublicApi } from "@humanitec/autogen";

export type HumanitecClient = PublicApi;

export const createApiClient = (basePath: string, token: string): PublicApi => {
  const clientConfig: APIConfig = {
    token,
    internalApp: "preview-envs-action/latest",
  };

  if (basePath) {
    clientConfig.apiHost = `https://${basePath}`;
  }

  const config = apiConfig(clientConfig);

  return new PublicApi(config);
};
