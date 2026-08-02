import { validateMyAnimeListId } from './argument-validators';
import { CommandDto } from './command-dto';
import { CommandShortcut } from './command-shortcut';

export class InfoCommandDto extends CommandDto {
  public static Command = CommandShortcut.info;

  public command = InfoCommandDto.Command;
  protected properties: (keyof this)[] = ['myAnimeListId'];

  public myAnimeListId: number;

  constructor(myAnimeListId: number | string) {
    super();
    this.myAnimeListId = typeof myAnimeListId === 'string' ? parseInt(myAnimeListId, 10) : myAnimeListId;
    validateMyAnimeListId(this.myAnimeListId);
  }
}
