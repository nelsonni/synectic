import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import type { Metafile, UUID } from '../../types';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { add } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';

type StageButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for managing the staging of changes for VCS-tracked cards. This button tracks the status of metafiles associated with the list
 * of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `*absent`, `*added`,
 * `*undeleted`, `*modified`, or `*deleted`. Clicking on the button will trigger all unstaged metafiles to have their changes staged.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional mode for switching between light and dark themes.
 */
const StageButton: React.FunctionComponent<StageButtonProps> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    // checks for whether button is on a single card and also captured
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const stage = async () => {
        await Promise.all(unstaged
            .filter(isFileMetafile)
            .map(async metafile => {
                await add(metafile.path);
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                console.log(`staging ${metafile.name}`, { vcs });
                dispatch(metafileUpdated({ ...metafile, ...vcs }));
            })
        );
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
            {unstaged.length > 0 && !isCaptured &&
                <Tooltip title='Stage'>
                    <IconButton
                        className={classes.root}
                        aria-label='stage'
                        onClick={stage}
                        onMouseEnter={() => onHover(unstaged)}
                        onMouseLeave={offHover}
                    >
                        <Add />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default StageButton;