import { Helpers } from "@quantfive/js-web-config";
import API from "~/config/api";

export function fetchHubFromSlug({ slug }: { slug: string }): any {
  return fetch(API.HUB({ slug }), API.GET_CONFIG())
    .then(Helpers.checkStatus)
    .then(Helpers.parseJSON)
    .then((res: any): any => {
      return (res?.results ?? [])[0] ?? null;
    });
}
