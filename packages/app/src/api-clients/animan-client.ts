import type { BotRequest, BotResponse } from '../../../../third-party/common/ts/interfaces';
import { makeLambdaRequest } from '../../../../third-party/common/ts/runtime/lambda-client';
import { config } from '../config/config';
import type { VideoKey } from '../shared/database/entities/video-key';
import { assert } from '../shared/helpers/assert';

export const getVideoInfo = async (videoKey: VideoKey): Promise<BotResponse> => {
  const upperVideoKey: BotRequest = {
    videoKey: {
      myAnimeListId: videoKey.myAnimeListId,
      dub: videoKey.dub,
      episode: videoKey.episode,
    },
  };

  const result = await makeLambdaRequest<BotRequest, BotResponse>(
    config.value.animan.getAnimeFunctionName,
    upperVideoKey,
  );

  assert('status' in result);

  return result;
};
