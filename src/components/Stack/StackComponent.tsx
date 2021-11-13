import React from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import type { Card, FilesystemStatus, Metafile, Stack, UUID } from '../../types';
import { RootState } from '../../store/store';
import CardComponent from '../Card/CardComponent';
import { pushCards, popCard } from '../../store/thunks/stacks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import metafileSelectors from '../../store/selectors/metafiles';
import { stackRemoved } from '../../store/slices/stacks';
import { StyledIconButton } from '../StyledIconButton';
import SaveIcon from '@material-ui/icons/Save';
import CloseIcon from '@material-ui/icons/Close';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { writeFileAsync } from '../../containers/io';
import { metafileUpdated } from '../../store/slices/metafiles';
import { fileSaveDialog } from '../../containers/dialogs';
import { createSelector } from '@reduxjs/toolkit';

const DnDItemType = {
  CARD: 'CARD',
  STACK: 'STACK'
}
type DragObject = {
  id: string,
  type: string
}

const selectByStackAndState = createSelector(
  cardSelectors.selectAll,
  metafileSelectors.selectEntities,
  (_state: RootState, stackId: UUID) => stackId,
  (_state, _stackId, state: FilesystemStatus) => state,
  (cards, metafiles, stackId, state) => cards
    .filter(c => c.captured === stackId)
    .map(c => metafiles[c.metafile])
    .filter((m): m is Metafile => m !== undefined)
    .filter(m => m && m.state === state)
)

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const capturedCards = useAppSelector((state: RootState) => cardSelectors.selectByStack(state, props.id));
  const modifiedMetafiles = useAppSelector((state: RootState) => selectByStackAndState(state, props.id, 'modified'));
  const dispatch = useAppDispatch();

  // Enable StackComponent as a drop source (i.e. allowing this stack to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.STACK,
    item: () => ({ id: props.id, type: DnDItemType.STACK }),
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  }, [props.id]);

  // Enable StackComponent as a drop target (i.e. allow other elements to be dropped on this stack)
  const [, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = stacks[props.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a stack on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropTarget = stacks[props.id];
          const dropSource = cards[monitor.getItem().id];
          if (!dropTarget || !dropSource) return; // something isn't correct with this drop event
          if (dropSource.captured && dropSource.captured !== dropTarget.id) {
            dispatch(popCard({ stack: dropTarget, card: dropSource, delta: delta }));
            dispatch(pushCards({ stack: dropTarget, cards: [dropSource] }));
          } else if (!dropSource.captured) {
            dispatch(pushCards({ stack: dropTarget, cards: [dropSource] }));
          }
          break;
        }
        case DnDItemType.STACK: {
          const dropTarget = stacks[props.id];
          const dropSource = stacks[monitor.getItem().id];
          if (dropTarget && dropSource) {
            dispatch(pushCards({
              stack: dropTarget,
              cards: dropSource.cards
                .map(id => cards[id])
                .filter((card): card is Card => card !== undefined)
            }));
            dispatch(stackRemoved(dropSource.id));
          }
          break;
        }
      }
    }
  });
  const close = () => {
    capturedCards.map((card, idx) => dispatch(popCard({ stack: props, card: card, delta: { x: card.left + (idx * 25), y: card.top + (idx * 25) } })));
    dispatch(stackRemoved(props.id));
  }

  const save = async () => {
    console.log(`saving the stack...`);

    await Promise.all(modifiedMetafiles
      .filter(isFileMetafile)
      .map(async metafile => {
        console.log(`saving ${metafile.name}...`);
        console.log({ metafile });
        await writeFileAsync(metafile.path, metafile.content);
        const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
        dispatch(metafileUpdated({ ...metafile, ...vcs, state: 'unmodified' }));
      }));

    await Promise.all(modifiedMetafiles
      .filter(metafile => !isFileMetafile(metafile))
      .map(metafile => {
        console.log(`saving ${metafile.name}...`);
        dispatch(fileSaveDialog(metafile));
      }));
  }

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  return <div className='stack' ref={dragAndDrop} data-testid='stack-component'
    style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
    <StyledIconButton aria-label='close' onClick={close} ><CloseIcon /></StyledIconButton>
    <StyledIconButton aria-label='save' disabled={modifiedMetafiles.length == 0} onClick={save} ><SaveIcon /></StyledIconButton>
    {capturedCards.map(card => <CardComponent key={card.id} {...card} />)}
    {props.children}
  </div>
}

export default StackComponent;