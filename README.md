# gcloud SDK package for NPM
This package is an [NPM][npm] wrapper around the [gcloud SDK][gcloud-sdk] installer for [Google Cloud Platform][gcp]. It supports OSX, Windows, and Linux.

If the gcloud SDK is not present on your machine, this package will install it. Otherwise, it will update the existing installation using `gcloud components update`.

## Use
```
npm install -g @google-cloud/gcloud-cli
```

## Dependencies
On Windows, this package requires PowerShell access.

On Linux and OSX, this package requires either `bash`, `fish`, or `zsh`.

## Caveats
This package has several caveats:
 - This package adds a PATH entry pointing to the gcloud binary, which must be manually removed
 - On Windows, this package installs a specific version of the gcloud SDK if no existing installation is detected. Otherwise, it installs (or updates to) the newest available version.
 - Multiple installations: this package can only be installed in one location at a time. If the first installation is removed, this package must be reinstalled to restore gcloud access.
 - Shell detection: on OSX and Linux, this package relies on the `SHELL` environment variable. If this is not set correctly, `gcloud` may not be added to the user's path.
 - This package runs a `postinstall` script. If `postinstall` scripts are not enabled (e.g. due to `npm install --ignore-scripts`), then this package will not install correctly.

We plan to fix some of these caveats in a later release.

## Removal/Uninstalling
In addition to the standard package removal process, the following additional artifacts must be manually removed:
- PATH entry

## Project Status

This project is currently in Alpha. As such, the direction of the project, its underlying
design decisions, and/or Google's commitment to it may change rapidly and/or without prior notice.

Furthermore, this is not an official Google product - experimental or otherwise.

[npm]: https://npmjs.org
[gcloud-sdk]: https://cloud.google.com/sdk/
[gcp]: https://cloud.google.com/nodejs
