import { Component, Fragment } from "react";
import { connect } from "react-redux";
import { StyleSheet, css } from "aphrodite";
import * as moment from "dayjs";
import Ripples from "react-ripples";
import Router from "next/router";

// Component
import FeedList from "./FeedList";
import HubsList from "~/components/Hubs/HubsList";
import Loader from "~/components/Loader/Loader";
import Head from "~/components/Head";
import LeaderboardContainer from "../Leaderboard/LeaderboardContainer";
import SubscribeButton from "../Home/SubscribeButton";
import MobileFeedTabs from "../Home/MobileFeedTabs";
import ActivityList from "~/components/Activity/ActivityList";
import UnifiedDocFeedContainer from "~/components/UnifiedDocFeed/UnifiedDocFeedContainer";

// Redux
import { AuthActions } from "~/redux/auth";
import { MessageActions } from "~/redux/message";
import { HubActions } from "~/redux/hub";

// Config
import API from "~/config/api";
import { Helpers } from "@quantfive/js-web-config";
import colors from "~/config/themes/colors";
import { checkUserVotesOnPapers, fetchURL } from "~/config/fetch";
import { getFragmentParameterByName } from "~/config/utils/parsers";
import { filterOptions, scopeOptions } from "~/config/utils/options";
import { faLessThanEqual } from "@fortawesome/free-solid-svg-icons";
import MobileOnly from "../MobileOnly";
import ExitableBanner from "../Banner/ExitableBanner";
import { breakpoints } from "~/config/themes/screen";

const defaultFilter = filterOptions[0];
const defaultScope = scopeOptions[0];

class HubPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: this.props.initialFeed?.count ?? 0,
      papers: this.props.initialFeed?.results?.data ?? [],
      noResults: this.props.initialFeed?.results?.no_results ?? faLessThanEqual,
      next: this.props.initialFeed?.next ?? null,
      page: this.props.page || 2,
      doneFetching: this.props.initialFeed ? true : false,
      filterBy: this.props.filter ? this.props.filter : defaultFilter,
      scope: this.props.scope ? this.props.scope : defaultScope,
      feedType: this.props.initialFeed?.results?.feed_type ?? "subscribed",
      disableScope: this.props.filter ? this.props.filter.disableScope : true,
      feed: this.props.feed,
      papersLoading: false,
      titleBoxShadow: false,
      leaderboardTop: 0,
    };
  }

  setScrollShadow = () => {
    const height = document.getElementById("topbar").offsetHeight + 34;
    this.setState({ leaderboardTop: height });
  };

  updateUserBannerPreference = () => {
    this.props.setUserBannerPreference(false);
  };

  /**
   * In this scroll listener, we're going to add a CSS class on the
   * title bar when we hit a certain height
   */
  scrollListener = () => {
    const { auth } = this.props;
    if (auth.showBanner && window.scrollY > 323) {
      this.setState({
        titleBoxShadow: true,
      });
    } else if (!auth.showBanner && window.scrollY > 27) {
      this.setState({
        titleBoxShadow: true,
      });
    } else if (!auth.showBanner && window.scrollY < 27) {
      this.setState({
        titleBoxShadow: false,
      });
    } else if (auth.showBanner && window.scrollY < 323) {
      this.setState({
        titleBoxShadow: false,
      });
    }
  };

  componentDidMount() {
    const { isLoggedIn, initialFeed, hubState } = this.props;
    if (initialFeed) {
      this.detectPromoted(this.state.papers);
    }

    const subscribed = hubState.subscribedHubs ? hubState.subscribedHubs : [];
    const subscribedHubs = {};
    subscribed.forEach((hub) => {
      subscribedHubs[hub.id] = true;
    });

    this.setState({
      subscribe: this.props.hub ? subscribedHubs[this.props.hub.id] : null,
    });
    // window.addEventListener("scroll", this.scrollListener);
  }

  componentDidUpdate = async (prevProps, prevState) => {
    const { hubState } = this.props;
    const subscribed = hubState.subscribedHubs ? hubState.subscribedHubs : [];
    const subscribedHubs = {};
    subscribed.forEach((hub) => {
      subscribedHubs[hub.id] = true;
    });

    if (
      prevProps.hub &&
      this.props.hub &&
      prevProps.hub.id !== this.props.hub.id
    ) {
      if (this.props.hub.id) {
        this.setState({
          subscribe: this.props.hub ? subscribedHubs[this.props.hub.id] : null,
          page: 1,
        });
      }
    }

    if (!prevProps.isLoggedIn && this.props.isLoggedIn) {
      this.checkUserVotes(this.state.papers);
      if (this.props.hub && this.props.hub.id) {
        fetch(API.HUB({ slug: this.props.slug }), API.GET_CONFIG())
          .then(Helpers.checkStatus)
          .then(Helpers.parseJSON)
          .then((_) => {
            this.setState({
              subscribe: subscribedHubs[this.props.hub.id],
            });
          });

        this.setState({
          subscribe: this.props.hub ? subscribedHubs[this.props.hub.id] : null,
        });
      }
    }
  };

  // componentWillUnmount() {
  //   window.removeEventListener("scroll", this.scrollListener);
  // }

  checkUserVotes = (papers) => {
    if (!papers || !papers.length) return;

    const paperIds = papers.map((paper) => paper.id);
    checkUserVotesOnPapers({ paperIds }).then((res) => {
      const userVotes = { ...res };
      const updatedPapers = papers.map((paper) => {
        if (userVotes[paper.id]) {
          paper.user_vote = userVotes[paper.id];
        }
        return paper;
      });

      this.setState({
        papers: updatedPapers,
      });
    });
  };

  detectPromoted = (papers) => {
    const promotedPapers = [];
    if (papers) {
      papers.forEach((paper) => {
        if (paper.promoted) {
          promotedPapers.push(paper.id);
        }
      });
    }

    let createdLocationMeta = this.state.filterBy;
    if (createdLocationMeta === "hot") {
      createdLocationMeta = "trending";
    }

    const PAYLOAD = {
      paper_ids: promotedPapers,
      paper_is_boosted: true,
      interaction: "VIEW",
      created_location: "FEED",
      created_location_meta: "trending",
    };

    // fetch(
    //   API.PROMOTION_STATS({ route: "batch_views" }),
    //   API.POST_CONFIG(PAYLOAD)
    // )
    //   .then(Helpers.checkStatus)
    //   .then(Helpers.parseJSON);
  };

  loadMore = () => {
    const { loadingMore, page, filterBy, feed } = this.state;
    const { hub } = this.props;
    if (loadingMore) return;

    this.setState({
      loadingMore: true,
    });

    fetchURL(this.state.next).then((res) => {
      const { next, previous, results } = res;
      const papers = results.data;
      this.detectPromoted(papers);
      this.setState(
        {
          papers: [...this.state.papers, ...papers],
          next,
          prev: previous,
          page: page + 1,
          loadingMore: false,
        },
        () => {
          const pageParam = getFragmentParameterByName(
            "page",
            this.state.next ? this.state.next : this.state.prev
          ); // grab page from backend response
          const offset = this.state.next ? -1 : 1;
          this.updateSlugs(Number(pageParam) + offset);
        }
      );
    });
  };

  updateSlugs = (page) => {
    let { href, as } = this.formatLink();
    if (page) {
      as += `?page=${page}`;
    }

    const { filterBy } = this.state;
    if (filterBy.href) {
      Router.push(href, as, { shallow: true });
    }
  };

  formatLink = () => {
    const { home, slug } = this.props;
    const { feed, filterBy, scope, disableScope } = this.state;
    const filter = filterBy.href;
    const filterRoute = `/${filter}`;
    const scopeRoute = "/[scope]";
    const hubNameRoute = "/[slug]";
    const hubPrefix = "/hubs";
    const allPrefix = "/";

    const myFeed = feed === 0;
    const trending = filter === "trending";

    if (home && disableScope) {
      if (myFeed && trending) {
        // hide trending slug
        return {
          href: "/",
          as: "/",
        };
      } else if (myFeed && !trending) {
        // show filter slugs
        return {
          href: filterRoute,
          as: `/${filter}`,
        };
      } else {
        // all route with filters
        if (trending) {
          return {
            href: allPrefix,
            as: allPrefix,
          };
        }
        return {
          href: allPrefix + filterRoute,
          as: allPrefix + `/${filter}`,
        };
      }
    } else if (home && !disableScope) {
      if (myFeed) {
        // hide trending slug
        return {
          href: filterRoute + scopeRoute,
          as: `/${filter}/${scope.value}`,
        };
      } else {
        // all route with filters
        return {
          href: allPrefix + filterRoute + scopeRoute,
          as: allPrefix + `/${filter}/${scope.value}`,
        };
      }
    } else if (!home && disableScope) {
      if (trending) {
        return {
          href: hubPrefix + hubNameRoute,
          as: hubPrefix + `/${slug}`,
        };
      } else {
        return {
          href: hubPrefix + hubNameRoute + "/[filter]",
          as: hubPrefix + `/${slug}/${filter}`,
        };
      }
    } else if (!home && !disableScope) {
      return {
        href: hubPrefix + hubNameRoute + "/[filter]" + scopeRoute,
        as: hubPrefix + `/${slug}/${filter}/${scope.value}`,
      };
    }
  };

  calculateScope = () => {
    const scope = {
      start: 0,
      end: 0,
    };
    const scopeId = this.state.scope.value;

    const now = moment();
    const today = moment().startOf("day");
    const week = moment().startOf("day").subtract(7, "days");
    const month = moment().startOf("day").subtract(30, "days");
    const year = moment().startOf("day").subtract(365, "days");

    scope.end = now.unix();

    if (scopeId === "day") {
      scope.start = today.unix();
    } else if (scopeId === "week") {
      scope.start = week.unix();
    } else if (scopeId === "month") {
      scope.start = month.unix();
    } else if (scopeId === "year") {
      scope.start = year.unix();
    } else if (scopeId === "all-time") {
      const start = "2019-01-01";
      const diff = now.diff(start, "days") + 1;
      const alltime = now.startOf("day").subtract(diff, "days");
      scope.start = alltime.unix();
    }

    return scope;
  };

  formatMainHeader = () => {
    const { filterBy, feed } = this.state;

    if (feed === 0) {
      return "";
    }

    const isHomePage = this.props.home;
    let prefix = "";
    switch (filterBy.value) {
      case "removed":
        prefix = "Removed";
        break;
      case "hot":
        prefix = "Trending";
        break;
      case "top_rated":
        prefix = "Top";
        break;
      case "newest":
        prefix = "Newest";
        break;
      case "most_discussed":
        prefix = "Most Discussed";
        break;
      case "pulled-papers":
        prefix = "Pulled";
        break;
    }

    return `${prefix} Papers ${isHomePage ? "on" : "in"} `;
  };

  onFilterSelect = (type, option) => {
    const { disableScope, label } = option;

    if (this.state[type].label === label) return;

    this.setState(
      {
        page: 1,
        [type]: option,
        disableScope: disableScope || false,
      },
      () => {
        this.updateSlugs();
      }
    );
  };

  onScopeSelect = (type, option) => {
    const { label } = option;

    if (this.state[type].label === label) return;

    this.setState(
      {
        page: 1,
        [type]: option,
      },
      () => {
        this.updateSlugs();
      }
    );
  };

  onFeedSelect = (index) => {
    this.setState(
      {
        feed: index,
        page: 1,
      },
      () => {
        this.updateSlugs();
      }
    );
  };

  // onHubSelect = (e) => {
  //   this.setState({ feed: undefined });
  // };

  voteCallback = (index, paper) => {
    const papers = [...this.state.papers];
    papers[index] = paper;
    this.setState({
      papers,
    });
  };

  updateSubscription = (subscribing) => {
    const { hub, hubState, updateSubscribedHubs } = this.props;
    let subscribedHubs;
    if (subscribing) {
      subscribedHubs = JSON.parse(JSON.stringify(hubState.subscribedHubs));
      subscribedHubs.push(hub);
    } else {
      subscribedHubs = hubState.subscribedHubs.filter(
        (item) => item.id !== hub.id
      );
    }
    updateSubscribedHubs(subscribedHubs);
  };

  onSubscribe = (name = "") => {
    const { showMessage, setMessage } = this.props;
    this.updateSubscription(true);
    setMessage(`Joined ${name}`);
    showMessage({ show: true });
    this.setState({
      transition: false,
      subscribe: !this.state.subscribe,
    });
  };

  onUnsubscribe = (name = "") => {
    const { showMessage, setMessage } = this.props;
    this.updateSubscription(false);
    setMessage(`Left ${name}`);
    showMessage({ show: true });
    this.setState({
      transition: false,
      subscribe: !this.state.subscribe,
    });
  };

  renderLoadMoreButton = () => {
    const { next, loadingMore } = this.state;
    if (next !== null) {
      return (
        <div className={css(styles.buttonContainer)}>
          {!loadingMore ? (
            <Ripples
              className={css(styles.loadMoreButton)}
              onClick={this.loadMore}
            >
              Load More Papers
            </Ripples>
          ) : (
            <Loader
              key={"paperLoader"}
              loading={true}
              size={25}
              color={colors.BLUE()}
            />
          )}
        </div>
      );
    }
  };

  render() {
    const { feed } = this.state;

    const {
      auth,
      home,
      hub,
      hubState,
      initialFeed,
      initialHubList,
      leaderboardFeed,
      loggedIn,
    } = this.props;

    if (auth.user.moderator && filterOptions.length < 5) {
      filterOptions.push(
        {
          value: "removed",
          label: "Removed",
          href: "removed",
        },
        {
          value: "pulled-papers",
          href: "pulled-papers",
          label: "Pulled Papers",
          disableScope: true,
        },
        {
          value: "user-uploaded",
          label: "User Uploaded",
        }
      );
    }

    return (
      <div className={css(styles.rhHomeContainer)}>
        <div className={css(styles.rhHomeContentContainer, styles.column)}>
          <div className={css(styles.banner)}>
            {home && <Head title={home && null} />}
          </div>
          <div className={css(styles.row, styles.body)}>
            <div className={css(styles.column, styles.sidebar)}>
              <div className={css(styles.leftSidebarContainer)}>
                <FeedList
                  activeFeed={feed}
                  onFeedSelect={this.onFeedSelect}
                  current={home ? null : hub}
                />
                <LeaderboardContainer
                  hubId={0}
                  initialUsers={leaderboardFeed}
                />
                <HubsList
                  current={home ? null : hub}
                  initialHubList={initialHubList}
                  onHubSelect={this.onHubSelect}
                />
              </div>
            </div>
            <UnifiedDocFeedContainer
              feed={feed}
              home={home}
              hubName={home ? (feed ? "ResearchHub" : "My Hubs") : hub.name}
              hubState={hubState}
              hub={hub}
              loggedIn={loggedIn}
              serverLoadedData={initialFeed}
              subscribeButton={
                <SubscribeButton
                  {...this.props}
                  {...this.state}
                  onClick={() => this.setState({ transition: true })}
                  onSubscribe={this.onSubscribe}
                  onUnsubscribe={this.onUnsubscribe}
                />
              }
            />
            <div className={css(styles.column, styles.sidebar)}>
              <div className={css(styles.rightSidebarContainer)}>
                <ActivityList
                  // hubIds={
                  //   feed === 0
                  //     ? hubState.subscribedHubs.map((hub) => hub.id) // myHubs
                  //     : hub ? [hub.id] : null // Single hub or All feed
                  // }
                  subscribedHubs={hubState.subscribedHubs}
                  hub={hub}
                  hubId={hub ? hub.id : null}
                  feed={feed}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

var styles = StyleSheet.create({
  rhHomeContainer: {
    display: "flex",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  rhHomeContentContainer: {
    width: "inherit",
    height: "inherit",
    maxWidth: 2000,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    fontFamily: "Roboto",
    cursor: "default",
  },
  titleContainer: {
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    paddingLeft: "8%",
    paddingTop: 0,
    boxSizing: "border-box",
    height: 200,
    zIndex: 2,
    "@media only screen and (max-width: 767px)": {
      height: "unset",
      justifyContent: "flex-start",
    },
  },
  disableScope: {
    pointerEvents: "none",
    cursor: "not-allowed",
    opacity: 0.4,
  },
  centered: {
    height: 120,
  },
  placeholder: {
    marginTop: 16,
  },
  placeholderBottom: {
    marginTop: 16,
  },
  readMore: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "#FFF",
    ":hover": {
      fontWeight: 400,
    },
  },
  header: {
    fontSize: 50,
    fontWeight: 400,
    "@media only screen and (max-width: 685px)": {
      fontSize: 40,
    },
    "@media only screen and (max-width: 577px)": {
      fontSize: 25,
      marginTop: 16,
      width: 300,
    },
    "@media only screen and (max-width: 321px)": {
      width: 280,
    },
  },
  body: {
    width: "100%",
    height: "100%",
    marginTop: 28,
    // display: "table",
    // minWidth: "100vw",
    borderSpacing: "20px 0px",
    alignItems: "flex-start",
    boxSizing: "border-box",
    paddingLeft: 28,
    paddingRight: 28,
    "@media only screen and (max-width: 990px)": {
      padding: "0px 20px",
    },
    "@media only screen and (max-width: 767px)": {
      padding: "0px 16px",
      maxWidth: 550,
      display: "block",
      minWidth: "unset",
    },
  },
  mainfeed: {
    minHeight: "inherit",
    height: "100%",
    width: "100%",
    maxWidth: 1200,
    // display: "table-cell",
    flexDirection: "column",
    "@media only screen and (min-width: 1920px)": {
      minWidth: 1200,
    },
    "@media only screen and (max-width: 990px)": {
      width: "100%",
    },
    "@media only screen and (max-width: 415px)": {
      padding: 0,
      width: "100%",
    },
  },
  allFeedButton: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 3,
    cursor: "pointer",
    boxSizing: "border-box",
    width: "unset",
    padding: "0px 15px",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.14)",
  },
  sidebar: {
    // display: "table-cell",
    paddingBottom: 30,
    // "@media only screen and (min-width: 1920px)": {
    //   minWidth: 280,
    // },
    "@media only screen and (max-width: 1199px)": {
      display: "none",
    },
  },
  leftSidebarContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: 260,
    minWidth: 260,
    maxWidth: 260,
    minHeight: "100%",
    height: "100%",
  },
  rightSidebarContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: 280,
    minWidth: 280,
    maxWidth: 280,
    minHeight: "100%",
    height: "100%",
  },
  subtext: {
    whiteSpace: "initial",
    width: 670,
    fontSize: 16,
    fontWeight: 300,
    "@media only screen and (max-width: 799px)": {
      width: "100%",
      fontSize: 16,
    },
    "@media only screen and (max-width: 577px)": {
      fontSize: 16,
      width: 305,
      marginTop: 20,
    },
    "@media only screen and (max-width: 321px)": {
      width: 280,
    },
  },
  feedPapers: {
    position: "relative",
  },
  bannerContainer: {
    dropShadow: "0px 2px 4px rgba(185, 185, 185, 0.25)",
    "@media only screen and (max-width: 415px)": {
      padding: 0,
      width: "100%",
    },
  },
  sampleFeed: {
    height: "calc(100vh - 420px)",
    minHeight: 600,
    overflow: "hidden",
  },
  banner: {
    width: "100%",
  },
  promo: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  },
  button: {
    height: 55,
    width: 230,
    marginTop: 10,
    marginBottom: 0,
  },
  titleBoxShadow: {
    boxShadow: "0 4px 41px -24px rgba(0,0,0,0.16)",
  },
  topbar: {
    paddingTop: 30,
    paddingBottom: 20,
    width: "100%",
    paddingLeft: 70,
    paddingRight: 70,
    boxSizing: "border-box",
    alignItems: "center",
    zIndex: 2,
    top: 65,
    "@media only screen and (min-width: 900px)": {
      paddingLeft: 25,
      paddingRight: 25,
    },
    "@media only screen and (min-width: 1200px)": {
      paddingLeft: 50,
      paddingRight: 50,
    },

    "@media only screen and (max-width: 767px)": {
      position: "relative",
      top: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
    "@media only screen and (max-width: 665px)": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingBottom: 20,
    },
  },
  /**
   * INFINITE SCROLL
   */
  infiniteScroll: {
    minWidth: "100%",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "calc(100vh - 200px)",
    marginTop: 10,
    paddingBottom: 30,
    "@media only screen and (min-width: 1920px)": {
      minWidth: 1200,
    },
  },
  blank: {
    opacity: 0,
    height: 60,
  },
  hubName: {
    textTransform: "capitalize",
    marginRight: 13,
    "@media only screen and (max-width: 1343px)": {
      marginRight: 8,
    },
    "@media only screen and (max-width: 1149px)": {
      marginRight: 5,
    },
  },
  mobileHubListContainer: {
    display: "none",
    backgroundColor: "#FFF",
  },
  mobileList: {
    paddingTop: 20,
    width: "90%",
  },

  optionContainer: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    marginLeft: 5,
  },
  loader: {
    opacity: 1,
    height: 15,
    width: 55,
    "@media only screen and (max-width: 768px)": {
      width: 48,
    },
  },
  noResultsLine: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 16,
    padding: 16,
    borderBottom: "1px solid",
  },
  relatedResults: {
    textAlign: "center",
    fontSize: 25,
    marginBottom: 16,
  },
  subscribeContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    "@media only screen and (max-width: 665px)": {
      marginRight: 10,
    },
    "@media only screen and (max-width: 799px)": {
      marginRight: 0,
      width: "100%",
      justifyContent: "center",
      marginBottom: 16,
    },
  },
  subscribe: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.7,
    width: 120,
    height: 37,
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    color: "#FFF",
    backgroundColor: colors.BLUE(),
    borderRadius: 3,
    border: "none",
    outline: "none",
    boxSizing: "border-box",
    ":hover": {
      background: "#3E43E8",
    },
    "@media only screen and (max-width: 1149px)": {
      fontSize: 13,
    },
    "@media only screen and (max-width: 801px)": {
      width: "100%",
    },
  },
  subscribed: {
    backgroundColor: "#FFF",
    color: colors.BLUE(1),
    border: `1px solid ${colors.BLUE(1)}`,
    ":hover": {
      border: `1px solid ${colors.BLUE(1)}`,
      backgroundColor: colors.BLUE(1),
      color: "#FFF",
    },
  },
  leaderboard: {
    display: "none",
    "@media only screen and (min-width: 900px)": {
      display: "block",
      width: "20%",
      marginRight: 40,
    },
    "@media only screen and (min-width: 1200px)": {
      width: "18%",
    },
    "@media only screen and (min-width: 1440px)": {
      width: "15%",
      marginRight: 50,
    },
  },
  subscribeHover: {
    ":hover": {
      color: "#fff",
      backgroundColor: colors.RED(1),
      border: `1px solid ${colors.RED(1)}`,
    },
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    height: 45,
    "@media only screen and (max-width: 768px)": {
      marginTop: 15,
      marginBottom: 15,
    },
  },
  loadMoreButton: {
    fontSize: 14,
    border: `1px solid ${colors.BLUE()}`,
    boxSizing: "border-box",
    borderRadius: 4,
    height: 45,
    width: 155,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: colors.BLUE(),
    cursor: "pointer",
    userSelect: "none",
    ":hover": {
      color: "#FFF",
      backgroundColor: colors.BLUE(),
    },
  },
  hidden: {
    display: "none",
  },
});

const mapStateToProps = (state) => ({
  modals: state.modals,
  auth: state.auth,
  user: state.auth.user,
  isLoggedIn: state.auth.isLoggedIn,
  hubState: state.hubs,
  allHubs: state.hubs.hubs,
  topHubs: state.hubs.topHubs,
});

const mapDispatchToProps = {
  getUser: AuthActions.getUser,
  setUserBannerPreference: AuthActions.setUserBannerPreference,
  showMessage: MessageActions.showMessage,
  setMessage: MessageActions.setMessage,
  updateSubscribedHubs: HubActions.updateSubscribedHubs,
  getTopHubs: HubActions.getTopHubs,
};

export default connect(mapStateToProps, mapDispatchToProps)(HubPage);
