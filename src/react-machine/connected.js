/* @flow */
import * as React from 'react';
import { getNames, makeHandlers } from './internal';
import type { Machine } from './internal';

const noop = () => {};
const GC_TIMEOUT = 5; // ms

type HOC<
  Defs: { state: any, handlers: any, baseProps: any},
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>
> = (
  React.ComponentType<{ state: State, handlers: Handlers } & BaseProps> =>
  React.ComponentType<BaseProps>
);

type Options = { persistent?: boolean }

export type Connected<Defs> = Machine<Defs> => HOC<Defs>;
export type ConnectedProps<
  Defs: { state: any, handlers: any, baseProps: any},
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>
> = { state: State, handlers: Handlers } & BaseProps

export default <Defs: *>(machine: Machine<Defs>, options?: Options): HOC<Defs> => Component => {
  const { persistent = false } = options || {};
  const { originalName, displayName } = getNames(Component);
  const getId = instance => {
    const { name, index = '*' } = instance.props;
    return [
      instance.context['#machineIdAbove'],
      ':',
      originalName,
      '-',
      name || index
    ].join('');
  }
  return class extends React.Component<any, any> {
    initialState: any;
    static displayName = displayName;
    static contextTypes = {
      '#machineIdAbove': noop,
      '#machinery': noop
    };
    static childContextTypes = {
      '#machineIdAbove': noop,
    };
    id = getId(this);
    subscribed = false;
    state = {};
    handlers = makeHandlers(originalName, this, machine);
    machinery = this.context['#machinery']
    getMState() {
      const value = this.machinery.get(this.id);
      return value === undefined ? this.initialState : value;
    }
    setMState(newState, meta, _) {
      this.machinery.inform({
        id: this.id,
        newState,
        ...meta
      });
    }
    componentWillMount() {
      if (machine.init.length > 0) {
        this.machinery.inform({
          id: this.id,
          newState: machine.init(this.props),
          componentName: displayName,
          handlerName: '#init'
        });
      } else {
        this.initialState = machine.init(this.props);
      }
    }
    componentDidMount() {
      this.machinery.subscribe(this);
    }
    componentWillUnmount() {
      this.machinery.unsubscribe(this, persistent);
    }
    render() {
      const { handlers } = this;
      const state = this.getMState();
      return (
        <Component
          {...this.props}
          handlers={handlers}
          state={state}
        />
      );
    }
    getChildContext() {
      return {
        '#machineIdAbove': this.id
      }
    }
  }
}

export const machinery = (state: { [string]: mixed } = {}, action: Object) => {
  const id = action['#machine'];
  if (id) {
    const clone = {...state};
    if (id === 'gc') {
      for (let i = 0; i < action.ids.length; i++) {
        delete clone[action.ids[i]];
      }
    } else { 
      clone[id] = action.newState;
    }
    return clone;
  }
  return state;
}

type ChangeInfo =
  | {
    kind: 'change',
    id: string,
    newState: mixed,
    data: mixed,
    componentName: string,
    handlerName: string
  }
  | {
    kind: 'gc',
    ids: string[]
  };

export const machineChange = (info: ChangeInfo) => {
  if (info.kind === 'gc') {
    return {
      type: '#machine',
      '#machine': 'gc',
      ids: info.ids
    };
  } else {
    return {
      type: info.componentName + '.' + info.handlerName,
      data: info.data,
      '#machine': info.id,
      newState: info.newState
    };
  }
}

const makeChildContext = instance => ({
  subscribe: (child) => {
    const { id } = child;
    if (instance.listeners[id]) {
      console.error('react-machine: duplicate id for a connected machine:', id);
    } else {
      instance.listeners[id] = child;
    }
  },
  unsubscribe: (child, persistent) => {
    delete instance.listeners[child.id];
    if (!persistent) {
      instance.unused[child.id] = true;
    }
    instance.scheduleGc();
  },
  get: (id) => {
    return instance.props.machinery[id];
  },
  inform: (info) => {
    instance.props.machineChange(info);
  }
});

export class Machinery extends React.Component<{
  machinery: { [string]: mixed },
  machineChange: (ChangeInfo) => void,
  children: React.Node
}> {
  static childContextTypes = {
    '#machineIdAbove': noop,
    '#machinery': noop,
  };
  listeners = {};
  unused = {};
  childContext: any = makeChildContext(this);
  gcTimeout = -1;
  scheduleGc() {
    clearTimeout(this.gcTimeout);
    this.gcTimeout = setTimeout(() => this.doGc(), GC_TIMEOUT);
  }
  doGc() {
    const ids = Object.keys(this.unused).filter(id => !this.listeners[id]);
    this.props.machineChange({ kind: 'gc', ids });
  }
  componentWillUpdate(nextProps: any) {
    const { machinery } = this.props;
    const nextMachinery = nextProps.machinery;
    if (nextMachinery === machinery) {
      return;
    }
    const { listeners } = this;
    const keys = Object.keys(listeners);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (nextMachinery[key] !== machinery[key]) {
        listeners[key].forceUpdate();
      }
    }
  }
  render() {
    return this.props.children;
  }
  getChildContext() {
    return {
      '#machineIdAbove': '@',
      '#machinery': this.childContext
    }
  }
}
