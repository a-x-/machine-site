/* @flow */
import * as React from 'react';
import logo from './logo.svg';
import './App.css';
//import local from './react-machine/local';
import controlled from './react-machine/controlled';
import connected from './react-machine/connected';
import uuid from 'uuid/v4';

import type { Controlled, ControlledProps } from './react-machine/controlled';
import type { Connected, ConnectedProps } from './react-machine/connected';

type ItemState = {
  uid: string,
  counter: number,
  input: string
};

type ItemDefs = {
  state: ItemState,
  handlers: {
    plus: () => void,
    minus: () => void,
    rename: (string) => void
  },
  baseProps: {}
};

const initItem = () => {
  const uid = uuid().slice(0, 6);
  return {
    uid,
    counter: 0,
    input: uid
  };
}

const Item = (controlled: Controlled<ItemDefs>)({
  init: initItem,
  handle: {
    plus({ state }) {
      return {
        ...state,
        counter: state.counter + 1
      };
    },
    minus({ state }) {
      return {
        ...state,
        counter: state.counter - 1
      };
    },
    rename: ({ state, data }) => {
      // FIXME
      (data);
      return {
        ...state,
        input: data
      };
    }
  }
})(
  class Item extends React.PureComponent<ControlledProps<ItemDefs>> {
    render() {
      const { handlers, state } = this.props;
      return (
        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
          <span>
            <div style={{ width: 100, height: 100, background: '#' + state.input }}/>
            <input onChange={handlers.rename} value={state.input}/>
            <button onClick={handlers.plus}>+</button>
            <button onClick={handlers.minus}>-</button>
            { state.counter }
          </span>
          <List key={state.uid} name={state.uid}/>
        </div>
      );
    }
  }
);

type ListDefs = {
  state: ItemState[],
  baseProps: {},
  handlers: {
    add: () => void,
    remove: () => void,
    itemChange: (ItemState) => void
  }
};

const List = (connected: Connected<ListDefs>)({
  init: () => [],
  handle: {
    add({ state }) {
      return [...state, initItem()];
    },
    remove({ state, index }) {
      const newState = [...state];
      newState.splice(index, 1);
      return newState;
    },
    itemChange({ state, data, index }) {
      const newState = [...state];
      newState[index] = data;
      return newState;
    }
  }
})(
  class List extends React.PureComponent<ConnectedProps<ListDefs>> {
    render() {
      const { handlers, state } = this.props;
      return (
        <div>
          <ul>
            {
              state.map((item, i) => (
                <li key={i}>
                  <button data-index={i} onClick={handlers.remove} children='x'/>
                  <Item
                    key={i}
                    index={i}
                    state={item}
                    onChange={() => {} /*handlers.itemChange*/}
                  />
                </li>
              ))
            }
            <li>
              <button onClick={handlers.add} children='+'/>
            </li>
          </ul>
        </div>
      );
    }
  }
);

class App extends React.PureComponent<{}> {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <List/>
      </div>
    );
  }
}

export default App;
