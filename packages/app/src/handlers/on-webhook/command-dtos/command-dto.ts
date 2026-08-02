import { logger } from '../../../shared/logger';
import type { CommandShortcut } from './command-shortcut';

export abstract class CommandDto {
  protected abstract command: CommandShortcut;
  protected abstract properties: (keyof this)[];

  public static fromPayload(payload: string): CommandDto | null {
    try {
      return new (CommandDto as any)(...payload.split(' ').slice(1));
    } catch (error) {
      logger.info('Failed to parse command payload', error);
      return null;
    }
  }

  public toString(): string {
    return [this.command, ...this.properties.map((prop) => this[prop])].join(' ');
  }
}
