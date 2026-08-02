import { validateDub, validateEpisode, validateMyAnimeListId } from './argument-validators';
import { CommandDto } from './command-dto';
import { CommandShortcut } from './command-shortcut';

export class WatchCommandDto extends CommandDto {
  public static Command = CommandShortcut.watch;

  public command = WatchCommandDto.Command;
  protected properties: (keyof this)[] = ['myAnimeListId', 'dub', 'episode'];

  public myAnimeListId: number;
  public dub: string;
  public episode: number;

  constructor(myAnimeListId: number | string, dub: string, episode: number | string) {
    super();
    this.myAnimeListId = typeof myAnimeListId === 'string' ? parseInt(myAnimeListId, 10) : myAnimeListId;
    this.dub = dub;
    this.episode = typeof episode === 'string' ? parseInt(episode, 10) : episode;
    validateMyAnimeListId(this.myAnimeListId);
    validateDub(this.dub);
    validateEpisode(this.episode);
  }
}
