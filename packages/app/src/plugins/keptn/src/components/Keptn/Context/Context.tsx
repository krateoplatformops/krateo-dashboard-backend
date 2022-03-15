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

import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Avatar, Typography, Grid, Chip, Accordion } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-use';
import { keptnApiRef } from '../../../api';

import { useApi } from '@backstage/core-plugin-api';

import { Event } from './Event';

const useStyles = makeStyles(() => ({
  serviceName: {
    fontSize: '1.2rem',
    textTransform: 'uppercase',
  },
  artifact: {
    marginBottom: '10px',
  },
  image: {
    marginLeft: '10px',
  },
}));

export const Context = ({ s, project }: { s: any; project: string }) => {
  const { entity } = useEntity();
  const classes = useStyles();
  const keptnApi = useApi(keptnApiRef);
  const [value, setValue] = useState<any>();
  const [loading, setLoading] = useState<any>(false);
  const [events, setEvents] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    await keptnApi
      .getEvent({
        keptnContext: s.shkeptncontext,
        project: project,
        pageSize: 100,
      })
      .then(res => {
        setLoading(false);
        setValue(res);
      });
  };

  const stages = () => {
    return value.events.reduce((r, a) => {
      r[a.data.stage] = [...(r[a.data.stage] || []), a];
      return r;
    }, {});
  };

  useAsync(loadData, [keptnApi, project]);

  return (
    <Grid container direction="column" wrap="nowrap" spacing={2}>
      {!loading &&
        value &&
        Object.entries(stages()).map(([key, event]) => (
          <Event key={key} title={key} event={event} />
        ))}
    </Grid>
  );
};
