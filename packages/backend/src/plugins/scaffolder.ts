/*
 * Copyright 2020 The Backstage Authors
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

import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { createBuiltinActions } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrations } from '@backstage/integration';
import {
  createArgoCDAction,
  creategitHubProtectionAction,
  createSonarCloudAction,
  createKeptnProjectAction,
  createRoInsielAction,
  createRoInsielTomcatAction,
  createCloudbeesInsielAction,
  createCloudbeesInsielTomcatAction,
  createKeptnProjectInsielAction,
  createSonarQubeAction,
  createGbpEnterpriseAction,
} from './scaffolder/actions';

export default async function createPlugin({
  logger,
  config,
  database,
  reader,
  discovery,
}: PluginEnvironment): Promise<Router> {
  const catalogClient = new CatalogClient({ discoveryApi: discovery });

  const integrations = ScmIntegrations.fromConfig(config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config,
    reader,
  });

  const actions = [
    ...builtInActions,
    createArgoCDAction(),
    createSonarCloudAction(),
    creategitHubProtectionAction(),
    createKeptnProjectAction(),
    createRoInsielAction(),
    createRoInsielTomcatAction(),
    createCloudbeesInsielAction({
      config,
    }),
    createCloudbeesInsielTomcatAction({
      config,
    }),
    createKeptnProjectInsielAction({
      config,
    }),
    createSonarQubeAction(),
    createGbpEnterpriseAction(),
  ];

  return await createRouter({
    logger,
    config,
    database,
    catalogClient,
    reader,
    actions,
  });
}
