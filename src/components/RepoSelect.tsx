import React from 'react';
import { useSelector } from 'react-redux';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import type { UUID } from '../types';
import { RootState } from '../store/root';
import { FormControl, InputLabel, MenuItem, OutlinedInput, Select } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    formControl_lg: {
      margin: theme.spacing(1),
      minWidth: 496,
    },
    formControl_sm: {
      margin: theme.spacing(1),
      minWidth: 240,
    },
    formItem: {
      padding: 10,
    },
    button: {
      margin: theme.spacing(1),
    },
    section1: {
      margin: theme.spacing(3, 2, 1),
    },
    section2: {
      margin: theme.spacing(1, 1),
    },
  }),
);

type RepoSelectProps = {
  repo: UUID,
  setRepo: React.Dispatch<React.SetStateAction<UUID>>;
}

const RepoSelect: React.FunctionComponent<RepoSelectProps> = props => {
    const classes = useStyles();
    const repos = useSelector((state: RootState) => Object.values(state.repos));

    const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => props.setRepo(event.target.value as UUID);

    return (
      <FormControl variant='outlined' className={classes.formControl_lg} size='small'>
        <InputLabel id='repo-select-label'>Repository</InputLabel>
        <Select
          labelId='repo-select-label'
          id='repo-select'
          value={props.repo}
          onChange={repoChange}
          label='Repository'
          input={<OutlinedInput margin='dense' />}
        >
          <MenuItem value='None' className={classes.formItem}>None</MenuItem>
          {repos.map(repo => <MenuItem key={repo.id} value={repo.id} className={classes.formItem}>{repo.name}</MenuItem>)}
        </Select>
      </FormControl>
    );
}

export default RepoSelect;