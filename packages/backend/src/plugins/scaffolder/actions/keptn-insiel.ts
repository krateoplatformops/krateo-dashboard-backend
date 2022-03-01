/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { resolveSafeChildPath } from '@backstage/backend-common';
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import axios from 'axios';
import * as https from 'https';

export const createKeptnProjectInsielAction = (options: { config: Config }) => {
  const { config } = options;

  return createTemplateAction<{}>({
    id: 'krateo:keptn-insiel',
    schema: {
      input: {
        required: ['host', 'component_id'],
        type: 'object',
        properties: {
          host: {
            type: 'string',
            title: 'Host',
            description: 'Host',
          },
          component_id: {
            type: 'string',
            title: 'Component Id',
            description: 'Component Id',
          },
        },
      },
    },
    async handler(ctx) {
      const fullUrl = `https://${ctx.input.host}`;
      const url = new URL(fullUrl);
      const owner = url.searchParams.get('owner');
      const repo = url.searchParams.get('repo');
      const base = url.origin;
      const repoURL = `${base}/${owner}/${repo}`;

      const templateUrl = ctx.baseUrl.replace('/tree/main/', '');

      const workDir = await ctx.createTemporaryDirectory();
      const projectDir = resolveSafeChildPath(workDir, 'project');

      await git.clone({
        fs,
        http,
        dir: workDir,
        url: templateUrl,
        onAuth: () => ({ username: process.env.GITHUB_TOKEN }),
        ref: 'main',
        singleBranch: true,
        depth: 1,
      });

      // get keptn api
      const proxy = config.get('proxy');
      const target = proxy['/keptn-api'].target.replace('api/v1', 'api/controlPlane/v1');

      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        validateStatus: (status) => {
          return status < 500
        }
      });

      ctx.logger.info(`RepoUrl: ${repoURL}`);
      ctx.logger.info(`Target: ${target}`);

      ctx.logger.info(`Creating Project`);
      await axiosInstance({
        method: 'post',
        url: `${target}/project`,
        data: {
          gitRemoteURL: repoURL,
          gitToken: process.env.GITHUB_TOKEN,
          gitUser: owner,
          name: ctx.input.component_id,
          shipyard: Buffer.from(fs.readFileSync(path.join(projectDir, 'shipyard.yaml'))).toString('base64'),
        },
        headers: {
          'Content-Type': `application/json`,
          'x-token': `${process.env.KEPTN_API_TOKEN}`,
        },
      });
      ctx.logger.info(`✅ Project created`);

      ctx.logger.info(`Creating Service`);
      await axiosInstance({
        method: 'post',
        url: `${target}/project/${ctx.input.component_id}/service`,
        data: {
          serviceName: ctx.input.component_id,
        },
        headers: {
          'Content-Type': `application/json`,
          'x-token': `${process.env.KEPTN_API_TOKEN}`,
        },
      });
      ctx.logger.info(`✅ Service created`);

      ctx.logger.info(`Project created successfully! 👍`);
    },
  });
};
