# Dynamic Preview Environments using Humanitec

This GitHub Action allows you to dynamically create and deleted preview environments using the Humanitec Platform Orchestrator.

## Inputs

> **Note**  
> The preview environment is cloned from the `base-env` specified in the action inputs (defaults to `development` if not specified). 
> Ensure the source environment id, `base-env`, is up-to-date before creating preview environments, otherwise they may be cloned from an old version.


* `humanitec-token` (required), Humanitec API token
* `humanitec-org` (required), The name of the Humanitec org
* `humanitec-app` (required), The name of the Humanitec app
* `action`  (required), The action to be performed (create, notify or delete)
* `base-env` (optional), The source environment id, defaults to `development` if not specified.
* `image` (optional), The image of the workload that should be deployed, `registry.humanitec.io/${humanitec-org}/${GITHUB_REPOSITORY}` by default.
* `environment-url-template` (optional), Provide a custom mustache template for the environment url, `https://app.humanitec.io/orgs/{{orgId}}/apps/{{appId}}/envs/{{envId}}` by default.
* `humanitec-api` (optional), Use a different Humanitec API host.
* `github-token` (optional), GitHub token used for commenting inside the PR.

## Outputs

* `environment-url` : Rendered URL of the preview environment.
* `humanitec-env`: Id of the created environment.

## Example usage

### Create Preview Environment

Create preview environments when a PR is created and remove it again once the PR is closed.

`.github/workflows/create-preview-env.yml`

```yaml
name: Create Preview environment

on:
  pull_request_target:
    types: [ opened, reopened ]

jobs:
  create-preview-env:
    runs-on: ubuntu-latest

    steps:
      - uses: humanitec/preview-envs-action@v2
        with:
          humanitec-token: ${{ secrets.HUMANITEC_TOKEN }}
          humanitec-org: my-org
          humanitec-app: my-app
          action: create
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Delete Preview Environment

`.github/workflows/delete-preview-env.yml`

```yaml
name: Delete Preview environment

on:
  pull_request_target:
    types: [ closed ]

jobs:
  delete-preview-env:
    runs-on: ubuntu-latest

    steps:
      - uses: humanitec/preview-envs-action@v2
        with:
          humanitec-token: ${{ secrets.HUMANITEC_TOKEN }}
          humanitec-org: my-org
          humanitec-app: my-app
          action: delete
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
### Notify GitHub Environment

Add the following snipped after your CI step (commonly the [build-push-to-humanitec](https://github.com/humanitec/build-push-to-humanitec) step) to notify the underlying [GitHub Environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) about the newly pushed image. When the `environment-url-template` parameter is provided, GitHub will display a "View Deployment" button for convenient access to the preview environment using the generated URL.

```yaml
- uses: humanitec/preview-envs-action@v2
  with:
    humanitec-org: my-org
    humanitec-app: my-app
    action: notify
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment-url-template: https://dev-{{envId}}.my-domain.app
```

### Get Preview Environment URL

All actions above return the output parameter `environment-url`. If you just want to retrieve the environment url you can use this step:

```yaml
- name: Get Preview Environment
  id: preview-env
  uses: humanitec/preview-envs-action@v2
  with:
    humanitec-org: my-org
    humanitec-app: my-app
    action: get-environment-url
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment-url-template: "https://{{envId}}-app.humanitec.io"
- name: Print preview environment url
  run: |
  echo "This is the preview environment url: ${{ steps.preview-env.outputs.environment-url }}"
```

## Development

Running the tests requires an Humanitec account. Once this is created, the following environment variables need to be configured:

* `HUMANITEC_ORG`
* `HUMANITEC_TOKEN`
* `HUMANITEC_APP`
