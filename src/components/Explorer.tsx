import React, { useState } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ReplayIcon from '@material-ui/icons/Replay';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import type { UUID, Card, GitStatus } from '../types';
import { RootState } from '../store/store';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { StyledTreeItem } from './StyledTreeComponent';
import { discardMetafileChanges, MetafileWithPath } from '../containers/metafiles';
import { BranchRibbon } from './BranchRibbon';
import { BranchList } from './BranchList';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import useDirectory from '../containers/hooks/useDirectory';
import { SourceControlButton } from './SourceControl';
import { removeUndefinedProperties } from '../containers/format';

const FileComponent: React.FunctionComponent<MetafileWithPath> = props => {
  const dispatch = useAppDispatch();

  const colorFilter = (status: GitStatus | undefined) => {
    switch (status) {
      case '*added': // Fallthrough
      case 'added':
        return '#95bf77'; // green
      case '*deleted': // Fallthrough
      case 'deleted':
        return '#da6473'; // red
      case '*modified': // Fallthrough
      case 'modified':
        return '#d19a66'; // orange
      default:
        return undefined;
    }
  }
  const optionals = removeUndefinedProperties({
    color: colorFilter(props.status),
    labelInfo: (props.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status)) ? ReplayIcon : undefined
  });

  return (
    <StyledTreeItem key={props.id} nodeId={props.id}
      labelText={extractFilename(props.path)}
      {...optionals}
      labelInfoClickHandler={async (e) => {
        e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        await dispatch(discardMetafileChanges(props));
      }}
      labelIcon={InsertDriveFileIcon}
      enableHover={true}
      onClick={() => (props.status && ['*deleted', 'deleted'].includes(props.status)) ? null : dispatch(loadCard({ filepath: props.path }))}
    />
  );
}

export const DirectoryComponent: React.FunctionComponent<MetafileWithPath> = props => {
  const { directories, files } = useDirectory(props.path);
  const [expanded, setExpanded] = useState(false);

  const clickHandle = async () => setExpanded(!expanded);

  return (
    < StyledTreeItem key={props.id} nodeId={props.id}
      labelText={props.name}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
      {files.map(file => <FileComponent key={file.id} {...file} />)}
    </StyledTreeItem >
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootId));
  const { directories, files } = useDirectory((rootMetafile as MetafileWithPath).path);

  return (
    <>
      {rootMetafile && rootMetafile.branch ? <div className='list-component'>
        <BranchRibbon branch={rootMetafile.branch} />
        <TreeView
          defaultCollapseIcon={<ArrowDropDownIcon />}
          defaultExpandIcon={<ArrowRightIcon />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
          {files.map(file => <FileComponent key={file.id} {...file} />)}
        </TreeView>
      </div> : null}
    </>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      {repo ?
        <>
          <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} /> : undefined}
          <span>Status:</span><span className='field'>{metafile ? metafile.status : ''}</span>
          <span>Versions:</span>{metafile ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} /> : undefined}
        </>
        : undefined}
    </>
  );
};

export default Explorer;