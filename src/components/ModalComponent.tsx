import React from 'react';

import type { Modal } from '../types';
import CloneDialog from './SourceControl/CloneDialog';
import CommitDialog from './SourceControl/CommitDialog';
import DiffPickerDialog from './Diff/DiffPickerDialog';
import ErrorDialog from './ErrorDialog';
import { GitGraph } from './GitGraph/GitGraph';
import MergeDialog from './SourceControl/MergeDialog';
import NewCardDialog from './NewCardDialog';
import Notification from './Notification';
import SourcePickerDialog from './SourceControl/SourcePickerDialog';

const ModalComponent: React.FunctionComponent<Modal> = props => {
  switch (props.type) {
    case 'DiffPicker':
      return (<DiffPickerDialog {...props} />);
    case 'CloneSelector':
      return (<CloneDialog {...props} />);
    case 'Error':
      return (<ErrorDialog {...props} />);
    case 'GitGraph':
      return props.target ? (<GitGraph repo={props.target} />) : null;
    case 'MergeSelector':
      return (<MergeDialog {...props} />)
    case 'NewCardDialog':
      return (<NewCardDialog {...props} />);
    case 'SourcePicker':
      return (<SourcePickerDialog {...props} />);
    case 'CommitDialog':
      return (<CommitDialog {...props} />);
    case 'Notification':
      return (<Notification {...props} />);
    default:
      return null;
  }
};

export default ModalComponent;