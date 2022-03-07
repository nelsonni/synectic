import React from 'react';
import { Modal } from '../../store/slices/modals';
import CloneDialog from './CloneDialog';
import CommitDialog from './CommitDialog';
import DiffPickerDialog from './DiffPickerDialog';
import ErrorDialog from './ErrorDialog';
import GitGraph from '../GitGraph';
import MergeDialog from './MergeDialog';
import NewCardDialog from './NewCardDialog';
import Notification from './Notification';
import SourcePickerDialog from './SourcePickerDialog';

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