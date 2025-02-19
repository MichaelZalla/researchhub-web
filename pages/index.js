import { AUTH_TOKEN } from "~/config/constants";
import { fetchUnifiedDocFeed } from "~/config/fetch";
import { filterOptions } from "~/config/utils/options";
import { getBeUnifiedDocType } from "~/config/utils/getUnifiedDocType";
import { isServer } from "~/config/server/isServer";
import { isNullOrUndefined } from "~/config/utils/nullchecks";
import HubPage from "~/components/Hubs/HubPage";
import nookies from "nookies";

const Index = (props) => {
  return <HubPage home={true} {...props} />;
};

Index.getInitialProps = async (ctx) => {
  // TODO: calvinhlee - refactor this
  const { query } = ctx;
  const { type, filter, hot_v2 } = ctx?.query ?? {};

  const filterObj = filterOptions.filter((el) => el.value === filter)[0];
  const cookies = nookies.get(ctx);
  const authToken = cookies[AUTH_TOKEN];
  const defaultProps = {
    feed: 0,
    filter: filterObj,
    home: true,
    initialFeed: null,
    initialHubList: null,
    leaderboardFeed: null,
    loggedIn: authToken !== undefined,
    page: 1,
    query,
  };

  if (!isServer()) {
    return defaultProps;
  }

  try {
    const beDocType = getBeUnifiedDocType(type);
    const initialFeed = await fetchUnifiedDocFeed(
      {
        hubId: null,
        ordering: "hot",
        page: 1,
        subfilters: filterObj,
        subscribedHubs: false,
        timePeriod: "today",
        type: beDocType,
      },
      authToken,
      !isNullOrUndefined(authToken) /* withVotes */
    );
    return {
      ...defaultProps,
      initialFeed,
    };
  } catch (error) {
    return defaultProps;
  }
};

export default Index;
