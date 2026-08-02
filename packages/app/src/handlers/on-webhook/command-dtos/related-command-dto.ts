import { validateMyAnimeListId } from './argument-validators';
import { CommandDto } from './command-dto';
import { CommandShortcut } from './command-shortcut';

export class RelatedCommandDto extends CommandDto {
  public static Command = CommandShortcut.related;

  public command = RelatedCommandDto.Command;
  protected properties: (keyof this)[] = ['myAnimeListId'];

  public myAnimeListId: number;

  constructor(myAnimeListId: number | string) {
    super();
    this.myAnimeListId = typeof myAnimeListId === 'string' ? parseInt(myAnimeListId) : myAnimeListId;
    validateMyAnimeListId(this.myAnimeListId);
  }
}
