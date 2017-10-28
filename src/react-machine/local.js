/* @flow */
import * as React from 'react';
import { getNames, makeHandlers } from './internal';
import type { Machine } from './internal';

type HOC<
  Defs: { state: any, handlers: any, baseProps: any},
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>
> = (
  React.ComponentType<{ state: State, handlers: Handlers } & BaseProps> =>
  React.ComponentType<BaseProps>
);

export type Local<Defs> = Machine<Defs> => HOC<Defs>;

export default <Defs: *>(machine: Machine<Defs>): HOC<Defs> => Component => {
  const { originalName, displayName } = getNames(Component)
  return class extends React.Component<any, any> {
    initialState: any;
    static displayName = displayName;
    state = {
      value: machine.init(this.props)
    };
    handlers = makeHandlers(originalName, this, machine);
    getMState() {
      return this.state.value;
    }
    setMState(newState, _, __) {
      this.setState({ value: newState });
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
  }
}
