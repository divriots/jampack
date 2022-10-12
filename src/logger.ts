import kleur from 'kleur';

export class Logger {

  private prefix: string = '';

  Logger(prefix: string = '') {
    this.prefix = prefix;
  }

  info(message: string): void {
    console.info(this.prefix+message);
  }
  
  warn(message: string): void {
    console.warn(this.prefix+message);
  }
  
  error(message: string): void {
    console.error(this.prefix+message);
  }

}

export function printTitle(msg: string, bgColor: (x: string | number) => string = kleur.bgGreen) {
  console.log('');
  console.log(bgColor(kleur.black(` ${msg} `)));
}
