# Dynamic Preview Environments using Humanitec

This GitHub action allows you to dynamically create & deleted preview environments using Humanitec.

## Inputs

* TBD

## Outputs

* TBD

## Example usage

Create preview environments when a PR is created and remove it again on merge.

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
      - uses: humanitec/preview-envs-action@main
        with:
          humanitec-token: ${{ secrets.HUMANITEC_TOKEN }}
          humanitec-org: my-org
          humanitec-app: my-app
          action: create
          github-token: ${{ secrets.GITHUB_TOKEN }}
```


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
      - uses: humanitec/preview-envs-action@main
        with:
          humanitec-token: ${{ secrets.HUMANITEC_TOKEN }}
          humanitec-org: my-org
          humanitec-app: my-app
          action: delete
          github-token: ${{ secrets.GITHUB_TOKEN }}
```


## Development

Running the tests requires an Humanitec account. Once this is created, the following environment variables need to be configure:

* `HUMANITEC_ORG`
* `HUMANITEC_TOKEN`
* `HUMANITEC_APP`
