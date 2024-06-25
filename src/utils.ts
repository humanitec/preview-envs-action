const ENV_ID_LIMIT = 20; // Only 20 chars are supported

export const branchNameToEnvId = (
  prefix: string,
  branchName: string,
): string => {
  branchName = branchName.replace(/[^a-z0-9-]+/g, "-"); // Remove unsupported chars
  branchName = branchName.replace(/^-+/, "").replace(/-+$/, ""); // Remove leading and trailing hyphens

  const idLimit = ENV_ID_LIMIT - `${prefix}-`.length;

  let suffix = branchName.slice(-idLimit);
  suffix = suffix.replace(/^-+/, ""); // Remove leading hyphens to prevent -- in the env id

  // Return last as often common prefixes like "feat" or "dependabot" are used.
  return `${prefix}-${suffix}`;
};
