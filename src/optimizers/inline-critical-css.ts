// @ts-ignore
import Critters from 'critters';

export function inlineCriticalCss(path: string, html: string) {
  const critters = new Critters({
    compress: false,
    fonts: false,
    logLevel: 'info',
    path,
  });
  return critters.process(html);
}
