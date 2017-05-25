// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// This file contains UNIX constants/helpers for "npm install gcloud-cli"

// Import required libraries
const process = require('process'); // Make process mockable
const childProcess = require('child_process');
const os = require('os');
const path = require('path');
const loggingHelpers = require('./helpers-logging');

// Get logging values
const logger = loggingHelpers.getLoggerInstance();
const stdioConfig = loggingHelpers.getStdioConfig();

// Get misc. constants
const GCLOUD_ROOT = path.join(__dirname, 'google-cloud-sdk');
const OS_PLATFORM = os.platform();
const INSTALLER_URL = 'https://dl.google.com/dl/cloudsdk/channels/rapid/install_google_cloud_sdk.bash';

// Installs gcloud SDK on UNIX (OSX/Linux)
function installGcloud () {
  return Promise.all([
    // Install gcloud locally
    new Promise((resolve, reject) => {
      logger.info(`Installing gcloud SDK for UNIX (OSX/Linux)...`);
      const installCmd = `curl ${INSTALLER_URL} | bash -s -- --disable-prompts --install-dir="${path.dirname(GCLOUD_ROOT)}"`;

      try {
        logger.debug(`Running install command: ${installCmd}`);
        childProcess.execSync(installCmd, stdioConfig);
        return resolve();
      } catch (err) {
        return reject(err);
      }
    }).catch((err) => {
      throw new Error(`Fatal: error installing gcloud SDK: ${err}`);
    }),

    // Include gcloud in shell's PATH, if shell is supported
    new Promise((resolve, reject) => {
      const SHELL_TYPE = validateShellType();
      const SHELL_RC_PATH = validateShellRcPath();
      const SHELL_INC_PATH = path.join(GCLOUD_ROOT, `path.${SHELL_TYPE}.inc`);

      try {
        const pathCmd = `echo "\n\n# gcloud sdk\nsource ${SHELL_INC_PATH}" >> ${SHELL_RC_PATH}`;
        logger.debug(`Running path adding command: ${pathCmd}`);
        childProcess.execSync(pathCmd, stdioConfig);
        logger.info(`Added 'gcloud' alias to ${SHELL_RC_PATH}.`);
        return resolve();
      } catch (err) {
        return reject(err);
      }
    }).catch((err) => {
      logger.error(`Warning: error adding gcloud SDK alias to shell: ${err}`);
    })
  ]);
}

// Helper function that determines whether gcloud is installed
// @returns true if gcloud is in the users' PATH, false otherwise
function isGcloudInstalled () {
  try {
    const output = childProcess.execSync('which gcloud');
    logger.debug(`Found installed gcloud binary at ${output}`);
    return true;
  } catch (e) {
    logger.debug(`No gcloud installation found`);
    return false;
  }
}

// Helper function to get shell type
// @returns one of 'bash', 'fish', 'zsh', or NULL
//          (shells with gcloud aliasing scripts)
function getShellType () {
  const SHELL_TYPE = process.env.SHELL || null;
  let result = null;
  if (SHELL_TYPE && SHELL_TYPE.endsWith('/bash')) {
    result = 'bash';
  } else if (SHELL_TYPE && SHELL_TYPE.endsWith('/fish')) {
    result = 'fish';
  } else if (SHELL_TYPE && SHELL_TYPE.endsWith('/zsh')) {
    result = 'zsh';
  }

  logger.debug(`Detected shell type: ${result} (null -> unsupported shell)`);
  return result;
}

// Helper function to validate shell type
// Warns the user if they have an unsupported shell
// @returns The shell type, as defined by getShellType()
function validateShellType () {
  const SHELL_TYPE = getShellType();
  if (!SHELL_TYPE) {
    throw new Error(`Unknown shell type.\nThe gcloud installer supports zsh, fish, and bash.\nYou will have to add a 'gcloud' alias yourself.`);
  }
  return SHELL_TYPE;
}

// Helper function to get and validate .rc filepath
// @returns The filepath to the current shell's .rc file
function validateShellRcPath () {
  const SHELL_TYPE = getShellType();
  let SHELL_RC_FILE = null;

  // Get .rc filepath relative to the HOME directory
  if (SHELL_TYPE === 'bash') {
    SHELL_RC_FILE = OS_PLATFORM === 'darwin' ? '.bash_profile' : '.bashrc';
  } else if (SHELL_TYPE === 'fish') {
    SHELL_RC_FILE = '.config/fish/config.fish';
  } else if (SHELL_TYPE === 'zsh') {
    SHELL_RC_FILE = '.zshrc';
  } else {
    // Invalid shell type
    return null;
  }

  // Return full path to .rc file (if said file is valid, NULL otherwise)
  if (SHELL_RC_FILE && process.env.HOME) {
    const result = path.join(process.env.HOME, SHELL_RC_FILE);
    logger.debug(`Detected .*shrc file at ${result}.`);
    return result;
  } else {
    // Invalid .rc file
    throw new Error(`Could not find the .rc file for the current shell.\nYou will have to add a 'gcloud' alias yourself.`);
  }
}

// Exports
module.exports = {
  isGcloudInstalled: isGcloudInstalled,
  installGcloud: installGcloud
};
