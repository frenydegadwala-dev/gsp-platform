import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'actionAvailable', standalone: true })
export class ActionAvailablePipe implements PipeTransform {
  transform(actions: any[], key: string): boolean {
    return actions?.some((a) => a.key === key) ?? false;
  }
}
