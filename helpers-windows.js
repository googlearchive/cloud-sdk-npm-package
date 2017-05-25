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

// This file contains Windows helpers for "npm install gcloud-cli"

// Import required libraries
const childProcess = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const requestPromise = require('request-promise');
const extractZip = require('extract-zip');
const loggingHelpers = require('./helpers-logging');

// Get logging values
const logger = loggingHelpers.getLoggerInstance();
const stdioConfig = loggingHelpers.getStdioConfig();

// Get common constants
const SDK_VERSION = '158.0.0';
const OS_ARCHITECTURE = os.arch() === 'x64' ? 'x86_64' : 'x86';
const INSTALLER_URL = `https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${SDK_VERSION}-windows-${OS_ARCHITECTURE}-bundled-python.zip`;

// Installs gcloud SDK on Windows
function installGcloud () {
  logger.info(`Installing gcloud SDK for Windows...`);

  // Compute paths
  const ZIP_PATH = path.join(__dirname, 'google-cloud-sdk.zip');
  const ZIP_ROOT = path.join(__dirname, 'google-cloud-sdk');
  const SDK_ROOT = path.join(ZIP_ROOT, 'google-cloud-sdk');
  const INSTALLER_PATH = path.join(SDK_ROOT, 'install.bat');
  const BIN_PATH = path.join(SDK_ROOT, 'bin/');
  let PATH = process.env.PATH;
  if (!PATH.endsWith(';')) {
    PATH = PATH + ';';
  }

  return Promise.all([
    // Download installer
    downloadFile(INSTALLER_URL, ZIP_PATH)
      .then(() => {
        // Unzip installer
        return extractZipPromise(ZIP_PATH, ZIP_ROOT);
      })
      .then(() => {
        // Run installer
        childProcess.execSync(`"${INSTALLER_PATH}" -q`, stdioConfig);
      })
      .catch((err) => {
        throw new Error(`Fatal: error installing the gcloud SDK: ${err}`);
      }),

    // Add gcloud SDK to Windows PATH
    setEnvVar('path', PATH + BIN_PATH)
      .catch((err) => {
        logger.error(`Warning: error adding gcloud SDK to Windows PATH: ${err}`);
      })
  ]);
}

// Helper function that sets an environment variable on Windows
function setEnvVar (name, value) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug(`Setting environment variable ${name} to ${value} via Windows PowerShell`);
      childProcess.execSync(
        `powershell "[Environment]::SetEnvironmentVariable('${name}', '${value}', 'user')"`,
        stdioConfig
      );
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

// Helper function that determines whether gcloud is installed
// @returns true if gcloud is in the users' PATH, false otherwise
function isGcloudInstalled () {
  try {
    const output = childProcess.execSync('where /q gcloud');
    logger.debug(`Found installed gcloud binary at ${output}`);
    return true;
  } catch (e) {
    logger.debug(`No gcloud installation found`);
    return false;
  }
}

// Helper function to download a file
function downloadFile (url, outputName) {
  return new Promise((resolve, reject) => {
    logger.debug(`Downloading file from ${url} to location ${outputName}`);
    return requestPromise(url, { encoding: null })
      .then((response) => {
        fs.writeFile(outputName, response, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        });
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

// Helper function to extract a .zip file
function extractZipPromise (zipPath, outputDir) {
  // Clear output directory, if necessary
  return rimrafPromise(outputDir)

  // Unzip folder to output directory
  .then(() => {
    return new Promise((resolve, reject) => {
      logger.debug(`Extracting ${zipPath} to ${outputDir}`);
      extractZip(zipPath, {dir: outputDir}, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  });
}

// Helper function to delete a directory
function rimrafPromise (dir) {
  logger.debug(`Deleting directory ${dir}`);
  return new Promise((resolve, reject) => {
    // Skip this step if dir doesn't exist
    if (!fs.existsSync(dir)) {
      resolve();
    }

    rimraf(dir, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

// Exports
module.exports = {
  isGcloudInstalled: isGcloudInstalled,
  installGcloud: installGcloud
};
