import { Reflect } from '../../utils/reflect.class.ts';

export function WsChannel(name: string): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(
      'pattern',
      new URLPattern({
        pathname: `${name[0] === '/' ? '' : '/'}${name}`,
      }),
      target,
    );
  };
}
