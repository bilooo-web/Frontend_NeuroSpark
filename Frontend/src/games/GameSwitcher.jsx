import React from 'react';
import { useParams } from 'react-router-dom';
import PathChangeGame from './PathChange/PathChangeGame';
import MemoryPadlocksGame from './MemoryPadlocks/MemoryPadlocksGame';
import Faces_Names from './Faces&Names/Faces_NamesGame';
import PairOfCards from './PairOfCards/PairOfCards';

const GameSwitcher = () => {
    const { id } = useParams();

    switch (id) {
        case 'path-change':
            return <PathChangeGame />;
        case 'padlocks':
            return <MemoryPadlocksGame />;
        case 'faces-and-names':
            return <Faces_Names />;
        case 'pair-of-cards':
            return <PairOfCards />
        default:
            return (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh',
                    fontSize: '24px',
                    color: '#fff',
                    background: '#1a1a1a'
                }}>
                    Game not found: {id}
                </div>
            );
    }
};

export default GameSwitcher;
