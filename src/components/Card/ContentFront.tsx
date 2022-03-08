import React from 'react';
import BranchTracker from '../BranchTracker';
import Browser from '../Browser';
import ConflictManager from '../ConflictManager';
import Diff from '../Diff';
import Editor from '../Editor';
import Explorer from '../Explorer';
import SourceControl from '../SourceControl';
import Loading from './Loading';
import { Card } from '../../store/slices/cards';

const Content = (card: Card) => {
    switch (card.type) {
        case 'Loading':
            return (<Loading />);
        case 'Editor':
            return (<Editor metafileId={card.metafile} />);
        case 'Diff':
            return (<Diff metafileId={card.metafile} />);
        case 'Explorer':
            return (<Explorer rootMetafileId={card.metafile} />);
        case 'SourceControl':
            return (<SourceControl sourceControlId={card.metafile} />);
        case 'Browser':
            return (<Browser />);
        case 'BranchTracker':
            return (<BranchTracker />);
        case 'ConflictManager':
            return (<ConflictManager metafileId={card.metafile} />);
        default:
            return null;
    }
};

const ContentFront = (card: Card) => {
    return (<div className='card-front'><Content {...card} /></div>)
}

export default ContentFront;