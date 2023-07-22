import { Reflector } from '../../utils/reflector.class.ts';

export function WsChannel(name: string): ClassDecorator {
  return (target: object) => {
    Reflector.defineMetadata(
      'pattern',
      new URLPattern({
        pathname: `${name[0] === '/' ? '' : '/'}${name}`,
      }),
      target,
    );
  };
}
