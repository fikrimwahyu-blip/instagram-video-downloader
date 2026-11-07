import React from "react";

import { useFetch } from "@/features/api/hooks/use-fetch";

import { RequestConfigType } from "@/types/request-config";
import { IG_GraphQLResponseDto } from "@/features/api/_dto/instagram";

import { wrapperFetchJsonResponse } from "@/features/api/utils";

export type GetInstagramPostRequest = {
  shortcode: string;
  url: string;
};

export type GetInstagramPostResponse = IG_GraphQLResponseDto;

export function useGetInstagramPost() {
  const fetch = useFetch();

  return React.useCallback(
    (data: GetInstagramPostRequest, requestConfig?: RequestConfigType) => {
      const params = new URLSearchParams({ url: data.url });
      return fetch(`/api/instagram/p/${data.shortcode}?${params.toString()}`, requestConfig).then(
        wrapperFetchJsonResponse<GetInstagramPostResponse>
      );
    },
    [fetch]
  );
}
