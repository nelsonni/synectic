import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/root';
import { Canvas } from '../types';
import { ActionKeys } from '../store/actions';
import CardComponent from './CardComponent';
import NewCardComponent from './NewCardDialog';
import FilePickerButton from './FilePickerDialog';
import { Button } from '@material-ui/core';
import StackComponent from './StackComponent';
import { loadStack } from '../containers/handlers';
import DiffPickerButton from './DiffPickerDialog';
import { BrowserButton } from './Browser';
import ErrorDialog from './ErrorDialog';

const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const metafiles = useSelector((state: RootState) => Object.values(state.metafiles));
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const errors = useSelector((state: RootState) => Object.values(state.errors));
  const dispatch = useDispatch();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;

      console.log(`drop item.type: ${String(item.type)}\nisOver: ${isOver}, canDrop: ${canDrop}`);

      switch (item.type) {
        case 'CARD': {
          const card = cards[monitor.getItem().id];
          console.log(`card.id: ${card.id}`);
          dispatch({
            type: ActionKeys.UPDATE_CARD,
            id: card.id,
            card: { ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }
          });
          break;
        }
        case 'STACK': {
          const stack = stacks[monitor.getItem().id];
          console.log(`stack.id : ${stack.id}s`);
          dispatch({
            type: ActionKeys.UPDATE_STACK,
            id: stack.id,
            stack: { ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }
          });
          break;
        }
        default: {
          console.log(`default option, no item.type`);
          break;
        }
      }
    }
  });

  const createStack = () => {
    const cardsList = Object.values(cards);
    const actions = loadStack('test', [cardsList[0], cardsList[1]], 'go get some testing');
    actions.map(action => dispatch(action));
  }

  const showState = () => {
    console.log(`METAFILES:`);
    metafiles.map(m => console.log(`name: ${m.name}, branch: ${m.ref}`));
    console.log(`REPOS:`);
    repos.map(r => console.log(`name: ${r.name}, path: ${r.url.href}, refs: ${JSON.stringify(r.refs)}`));
  }

  return (
    <div className='canvas' ref={drop}>
      <NewCardComponent />
      <FilePickerButton />
      <DiffPickerButton />
      <Button id='stack-button' variant='contained' color='primary' onClick={createStack}>Create Stack</Button>
      <BrowserButton />
      <Button id='button' variant='contained' color='primary' onClick={showState}>Show State</Button>
      {Object.values(stacks).map(stack => <StackComponent key={stack.id} {...stack} />)}
      {Object.values(cards).filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)}
      {errors.map(error => <ErrorDialog key={error.id} {...error} />)}
      {props.children}
    </div >
  );
}

export default CanvasComponent;