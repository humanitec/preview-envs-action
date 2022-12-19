export const branchNameToEnvId = (prefix: string, branchName: string): string => {
  branchName = branchName.replace(/[^a-z0-9-]+/g, '-'); // Remove unsupported chars
  branchName = branchName.replace(/^-+/, '').replace(/-+$/, ''); // Remove leading and trailing hyphens

  return `${prefix}-${branchName}`.substring(0, 20); // Only 20 chars are supported
};
