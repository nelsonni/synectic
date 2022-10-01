import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Close } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { RootState } from '../../store/store';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { popCards } from '../../store/thunks/stacks';
import { cardRemoved } from '../../store/slices/cards';
import { UUID } from '../../store/types';

/**
 * Button for closing and removing card, or popping the card off of a stack if captured. The button is only enabled
 * when the card is defined and not captured.
 * 
 * @param obj - A destructured object for named props.
 * @param obj.cardId - The Card UUID that should be tracked by this button.
 * @param obj.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const CloseButton = ({ cardId, mode = 'light' }: { cardId: UUID, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const close = async () => (card && card.captured) ? dispatch(popCards({ cards: [card.id] })) : dispatch(cardRemoved(cardId));

    return (
        <>
            {card && !card.captured &&
                <Tooltip title='Close'>
                    <IconButton className={classes.root} aria-label='close' onClick={close}>
                        <Close />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default CloseButton;