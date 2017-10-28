/* @flow */

export type Machine<
  Defs: { state: any, handlers: any, baseProps: any },
  State = $ElementType<Defs, 'state'>,
  Handlers = $ElementType<Defs, 'handlers'>,
  BaseProps = $ElementType<Defs, 'baseProps'>
> = {
  init: BaseProps => State,
  handle: $ObjMap<
    Handlers,
    <Data>
      (Data => void) => ({
        data: Data,
        state: State,
        props: BaseProps,
        handlers: Handlers,
        name: string,
        index: number
      }) => State
  >
};

export const makeHandlers = (componentName: string, instance: any, machine: any): any => {
  const handlers = {};
  Object.keys(machine.handle).forEach(key => {
    const h = machine.handle[key];
    handlers[key] = (arg, maybeMeta, maybeAddress) => {
      let data = arg;
      let name = '';
      let index = 0;
      // TODO: better check for react synthetic event
      if (arg instanceof Object && arg.target instanceof HTMLElement) {
        const { target } = arg;
        if (target.value !== undefined) {
          data = target.value;
          name = target.name;
          index = Number(target.dataset.index) || 0;
        } else if (target.checked !== undefined) {
          data = target.checked;
          name = target.name;
          index = Number(target.dataset.index) || 0;
        } else {
          data = undefined;
        }
      }
      const state = instance.getMState();
      const { props } = instance;
      const meta = maybeMeta || {
        handlerName: key,
        componentName,
        data
      };
      const childAddress = maybeAddress || { name, index };
      const nextState = h({
        state,
        data,
        props,
        handlers,
        name: childAddress.name,
        index: childAddress.index
      }); 
      const address = {
        index: props.index || 0,
        name: props.name || ''
      };
      instance.setMState(nextState, meta, address);
    }
  });
  return handlers;
}

export const getNames = (Component: any): any => {
  const originalName = Component.name || Component.displayName || 'Unknown';
  const displayName = 'Machine(' + originalName + ')';
  return { originalName, displayName };
}
