import { makeLambdaRequest } from '../../../../third-party/common/ts/runtime/lambda-client';
import { asyncMemoized } from '../../../../third-party/common/ts/runtime/memorized';
import { config } from '../config/config';


type GetDubsRequest = { myAnimeListId: number };
type GetDubsResponseItem = {
  name: string;
  signedLink: string;
  firstEpisode: number;
  lastEpisode: number;
  hasGaps: boolean;
};
type GetDubsResponse = GetDubsResponseItem[];

type GetEpisodesRequest = { myAnimeListId: number; dub: string };
type GetEpisodesResponse = number[];


const getDubsInternal = (myAnimeListId: number): Promise<GetDubsResponse> => {
  return makeLambdaRequest<GetDubsRequest, GetDubsResponse>(
    config.value.loanApi.functionArn,
    { myAnimeListId },
  );
}

const getEpisodesInternal = (myAnimeListId: number, dub: string): Promise<GetEpisodesResponse> => {
  return makeLambdaRequest<GetEpisodesRequest, GetEpisodesResponse>(
    config.value.loanApi.functionArn,
    { myAnimeListId, dub },
  );
}


export const getDubs = asyncMemoized('getDubs', getDubsInternal);

export const getEpisodes = asyncMemoized('getEpisodes', getEpisodesInternal);
