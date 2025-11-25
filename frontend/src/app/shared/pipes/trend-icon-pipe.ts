import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trendIcon'
})
export class TrendIconPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
