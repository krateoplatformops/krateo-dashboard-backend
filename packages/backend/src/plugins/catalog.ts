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

import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { Duration } from 'luxon';
import { LdapOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-ldap';
import {
  defaultGroupTransformer,
  MicrosoftGraphOrgReaderProcessor,
} from '@backstage/plugin-catalog-backend-module-msgraph';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());
  builder.addProcessor(
    MicrosoftGraphOrgReaderProcessor.fromConfig(env.config, {
      logger: env.logger,
    }),
  );
  if (process.env.LDAP_ENABLED === 'true') {
    builder.addEntityProvider(
      LdapOrgEntityProvider.fromConfig(env.config, {
        id: 'our-ldap-master',
        target: process.env.LDAP_TARGET || 'ldap://localhost:389',
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
          frequency: Duration.fromObject({ minutes: 60 }),
          timeout: Duration.fromObject({ minutes: 15 }),
        }),
      }),
    );
  }
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
