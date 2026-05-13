import { useContext } from 'react';
import { ConnectionsContext } from '../context/ConnectionsContext.jsx';

export const useConnections = () => useContext(ConnectionsContext);
