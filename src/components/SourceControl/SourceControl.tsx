import React, { useMemo, useState } from 'react';
import { TreeView } from '@material-ui/lab';
import type { Card, UUID } from '../../types';
import { RootState } from '../../store/store';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitBranchIcon } from '../GitIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import useDirectory from '../../containers/hooks/useDirectory';
import { fetchVersionControl, FileMetafile, isFilebasedMetafile } from '../../store/thunks/metafiles';
import { changedCheck, modifiedCheck, SourceFileComponent, stagedCheck } from './SourceFileComponent';
import { add, remove } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';
import branchSelectors from '../../store/selectors/branches';

const SourceControl: React.FunctionComponent<{ sourceControlId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.sourceControlId));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile && metafile.repo ? metafile.repo : ''));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  const { files, update } = useDirectory(metafile ? metafile.path : undefined);
  const changed = useMemo(() => files.filter(f => changedCheck(f.status)), [files]);
  const staged = useMemo(() => files.filter(f => stagedCheck(f.status)), [files]);
  const modified = useMemo(() => files.filter(f => modifiedCheck(f.status)), [files]);
  const dispatch = useAppDispatch();

  const stage = async (metafile: FileMetafile) => {
    await add(metafile.path);
    const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
    dispatch(metafileUpdated({ ...metafile, ...vcs }));
    update();
  };

  const unstage = async (metafile: FileMetafile) => {
    await remove(metafile.path);
    const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
    dispatch(metafileUpdated({ ...metafile, ...vcs }));
    update();
  };

  return (
    <>
      {branch ?
        <div className='list-component'>
          <BranchRibbon branch={branch.ref} onClick={() => { console.log({ props, files, modified }) }} />
          <TreeView
            expanded={[`${repo ? repo.name : ''}-${branch.ref}-staged`, `${repo ? repo.name : ''}-${branch.ref}-changed`]}
          >
            <StyledTreeItem key={`${repo ? repo.name : ''}-${branch.ref}-staged`}
              nodeId={`${repo ? repo.name : ''}-${branch.ref}-staged`}
              labelText='Staged'
              labelInfoText={`${staged.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? staged.filter(isFilebasedMetafile).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={() => unstage(file)} {...file} />)
                : null
              }
            </StyledTreeItem>
            <StyledTreeItem key={`${repo ? repo.name : ''}-${branch.ref}-changed`}
              nodeId={`${repo ? repo.name : ''}-${branch.ref}-changed`}
              labelText='Changed'
              labelInfoText={`${changed.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? changed.filter(isFilebasedMetafile).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={() => stage(file)} {...file} />)
                : null
              }
            </StyledTreeItem>
          </TreeView>
        </div>
        : null}
    </>
  );
}

export const SourceControlReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  return (
    <>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      <span>Branch:</span><span className='field'>{branch ? branch.ref : 'untracked'}</span>
    </>
  )
}

export default SourceControl;