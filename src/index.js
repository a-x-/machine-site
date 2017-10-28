/* @flow */
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { Machinery, machinery, machineChange } from './react-machine/connected';

const reducer = combineReducers({ machinery });

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const ConnectedMachinery = connect(
  ({ machinery }) => ({ machinery }),
  { machineChange }
)(Machinery);

const root = (
  <Provider store={store}>
    <ConnectedMachinery>
      <App/>
    </ConnectedMachinery>
  </Provider>
);

// $FlowFixMe
const rootElement: Element = document.getElementById('root');

ReactDOM.render(root, rootElement);
