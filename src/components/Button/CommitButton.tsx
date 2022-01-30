import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Done } from '@material-ui/icons';
import type { Metafile, Modal, UUID } from '../../types';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import { modalAdded } from '../../store/slices/modals';
import { v4 } from 'uuid';

type CommitButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for initiating commits to a specific branch and repository. This button tracks the status of metafiles associated with the list of 
 * cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `added`, `modified`, or 
 * `deleted`. Clicking on the button will trigger a `CommitDialog` modal to be loaded.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional mode for switching between light and dark themes.
 */
const CommitButton: React.FunctionComponent<CommitButtonProps> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const hasStaged = staged.length > 0;
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const commit = async () => {
        const firstMetafile = staged[0];
        if (firstMetafile.repo && firstMetafile.branch) {
            const commitDialogModal: Modal = {
                id: v4(),
                type: 'CommitDialog',
                options: {
                    'repo': firstMetafile.repo,
                    'branch': firstMetafile.branch
                }
            };
            dispatch(modalAdded(commitDialogModal));
        }
    };

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {hasStaged && !isCaptured &&
                <Tooltip title='Commit'>
                    <IconButton
                        className={classes.root}
                        aria-label='commit'
                        onClick={commit}
                        onMouseEnter={() => onHover(staged)}
                        onMouseLeave={offHover}
                    >
                        <Done />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default CommitButton;