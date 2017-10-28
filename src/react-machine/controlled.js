/* @flow */
import * as React from 'react';
import { getNames, makeHandlers } from './internal';
import type { Machine } from './internal';

type HOC<
  Defs: { state: any, handlers: any, baseProps: any},
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>,
> = (
  React.ComponentType<{ state: State, handlers: Handlers } & BaseProps> =>
  React.ComponentType<{ state: State, onChange: State => void } & BaseProps>
);

export type Controlled<Defs> = Machine<Defs> => HOC<Defs>;
export type ControlledProps<
  Defs: { state: any, handlers: any, baseProps: any},
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>
> = { state: State, handlers: Handlers } & BaseProps

export default <Defs: *>(machine: Machine<Defs>): HOC<Defs> => Component => {
  const { originalName, displayName } = getNames(Component);
  return class extends React.Component<any, any> {
    static displayName = displayName;
    handlers = makeHandlers(originalName, this, machine);
    getMState() {
      return this.props.state;
    }
    setMState(value, meta, address) {
      this.props.onChange(value, meta, address);
    }
    render() {
      const { handlers } = this;
      return (
        <Component
          {...this.props}
          handlers={handlers}
        />
      );
    }
  }
}
