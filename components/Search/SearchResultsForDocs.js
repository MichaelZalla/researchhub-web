import * as moment from "dayjs";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import get from "lodash/get";
import { StyleSheet, css } from "aphrodite";
import PropTypes from "prop-types";

import colors from "~/config/themes/colors";
import { fetchURL } from "~/config/fetch";
import FormSelect from "~/components/Form/FormSelect";
import Badge from "~/components/Badge";
import EmptyFeedScreen from "~/components/Home/EmptyFeedScreen";
import FeedCard from "~/components/Author/Tabs/FeedCard";
import LoadMoreButton from "~/components/LoadMoreButton";
import { fetchUserVote } from "~/components/UnifiedDocFeed/api/unifiedDocFetch";
import { breakpoints } from "~/config/themes/screen";
import { isString } from "~/config/utils/string";

const timeFilterOpts = [
  {
    valueForApi: moment().startOf("day").format("YYYY-MM-DD"),
    value: "today",
    label: "Today",
  },
  {
    valueForApi: moment().startOf("week").format("YYYY-MM-DD"),
    value: "this-week",
    label: "This Week",
  },
  {
    valueForApi: moment().startOf("month").format("YYYY-MM-DD"),
    value: "this-month",
    label: "This Month",
  },
  {
    valueForApi: moment().startOf("year").format("YYYY-MM-DD"),
    value: "this-year",
    label: "This Year",
  },
  {
    isDefault: true,
    valueForApi: null,
    value: null,
    label: "All Time",
  },
];

const sortOpts = [
  {
    isDefault: true,
    valueForApi: null,
    value: null,
    label: "Relevance",
  },
  {
    valueForApi: "-hot_score",
    value: "-hot_score",
    label: "Trending",
  },
  {
    valueForApi: "-score",
    value: "-score",
    label: "Top Rated",
  },
  {
    valueForApi: "-publish_date",
    value: "-publish_date",
    label: "Newest",
  },
  {
    valueForApi: "-discussion_count",
    value: "-discussion_count",
    label: "Most Discussed",
  },
];

const SearchResultsForDocs = ({ apiResponse, entityType, context }) => {
  const router = useRouter();

  const [facetValuesForHub, setFacetValuesForHub] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextResultsUrl, setNextResultsUrl] = useState(null);
  const [numOfHits, setNumOfHits] = useState(null);
  const [results, setResults] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [searchEntityType, setSearchEntityType] = useState(
    entityType || router.query.type
  );

  const [pageWidth, setPageWidth] = useState(
    process.browser ? window.innerWidth : 0
  );

  const [selectedHubs, setSelectedHubs] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState({});
  const [selectedSortOrder, setSelectedSortOrder] = useState({});

  useEffect(() => {
    setSelectedHubs(getSelectedFacetValues({ forKey: "hubs" }));
    setSelectedTimeRange(
      getSelectedDropdownValue({ forKey: "publish_date__gte" })
    );
    setSelectedSortOrder(getSelectedDropdownValue({ forKey: "ordering" }));
  }, [router.query]);

  useEffect(() => {
    const results = get(apiResponse, "results", []);

    setResults(results);
    setNextResultsUrl(get(apiResponse, "next", null));
    setNumOfHits(get(apiResponse, "count", 0));
    setFacetValuesForHub(
      get(apiResponse, "facets._filter_hubs.hubs.buckets", [])
    );

    if (results && results.length) {
      fetchAndSetUserVotes(results);
    }
  }, [apiResponse]);

  useEffect(() => {
    const _setPageWidth = () => setPageWidth(window.innerWidth);

    window.addEventListener("resize", _setPageWidth, true);

    return () => {
      window.removeEventListener("resize", _setPageWidth, true);
    };
  }, []);

  const _fetchCurrentUserVotesForPosts = async (results) => {
    const formattedReq = results.map((r) => ({
      documents: [r],
      document_type: "POST",
    }));

    const documents = await fetchUserVote(formattedReq);

    const userVoteMap = documents.reduce((map, uniDoc) => {
      const docs = get(uniDoc, "documents", []);
      const post = docs[0];

      map[post.id] = post.user_vote;
      return map;
    }, {});

    // Don't override previous votes set, append to them.
    setUserVotes({ ...userVotes, ...userVoteMap });
  };

  const _fetchCurrentUserVotesForPapers = async (results) => {
    const formattedReq = results.map((r) => ({
      documents: r,
      document_type: "PAPER",
    }));

    const documents = await fetchUserVote(formattedReq);

    const userVoteMap = documents.reduce((map, doc) => {
      const paper = get(doc, "documents", {});
      map[paper.id] = paper.user_vote;
      return map;
    }, {});

    // Don't override previous votes set, append to them.
    setUserVotes({ ...userVotes, ...userVoteMap });
  };

  const fetchAndSetUserVotes = async (results) => {
    if (entityType === "post") {
      return _fetchCurrentUserVotesForPosts(results);
    } else if (entityType === "paper") {
      return _fetchCurrentUserVotesForPapers(results);
    }
  };

  const getSelectedFacetValues = ({ forKey }) => {
    let selected = [];

    if (Array.isArray(router.query[forKey])) {
      selected = router.query[forKey];
    } else if (isString(router.query[forKey])) {
      selected = [router.query[forKey]];
    }

    return selected.map((v) => ({ label: v, value: v, valueForApi: v }));
  };

  const getSelectedDropdownValue = ({ forKey }) => {
    const urlParam = get(router, `query.${forKey}`, null);
    let dropdownValue = null;

    if (forKey === "publish_date__gte") {
      dropdownValue = timeFilterOpts.find(
        (opt) => opt.valueForApi === urlParam
      );
      dropdownValue = dropdownValue || {};
    } else if (forKey === "ordering") {
      dropdownValue = sortOpts.find((opt) => opt.value === urlParam);
      dropdownValue =
        dropdownValue || sortOpts.find((opt) => opt.isDefault === true);
    }

    return dropdownValue;
  };

  const handleFilterSelect = (filterId, selected) => {
    let query = {
      ...router.query,
    };

    if (Array.isArray(selected)) {
      query[filterId] = selected.map((v) => v.valueForApi);
    } else if (!selected || !selected.valueForApi) {
      delete query[filterId];
    } else {
      query[filterId] = selected.valueForApi;
    }

    router.push({
      pathname: "/search/[type]",
      query,
    });
  };

  const handleRemoveSelected = ({ opt, dropdownKey }) => {
    let updatedQuery = { ...router.query };

    if (dropdownKey === "hubs") {
      const newValue = selectedHubs
        .filter((h) => h.value !== opt.value)
        .map((h) => h.value);

      updatedQuery[dropdownKey] = newValue;
    } else if (dropdownKey === "publish_date__gte") {
      delete updatedQuery[dropdownKey];
    }

    router.push({
      pathname: "/search/[type]",
      query: updatedQuery,
    });
  };

  const handleClearAll = () => {
    const updatedQuery = {
      ...router.query,
    };

    delete updatedQuery["publish_date__gte"];
    delete updatedQuery["hubs"];
    delete updatedQuery["ordering"];

    router.push({
      pathname: "/search/[type]",
      query: updatedQuery,
    });
  };

  const loadMoreResults = () => {
    setIsLoadingMore(true);

    fetchURL(nextResultsUrl)
      .then((res) => {
        setResults([...results, ...res.results]);
        setNextResultsUrl(res.next);
        setNumOfHits(res.count);
        setFacetValuesForHub(get(res, "facets._filter_hubs.hubs.buckets", []));

        fetchAndSetUserVotes(res.results);
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  const parseIfHighlighted = ({ searchResult, attribute }) => {
    const highlight = get(searchResult, `highlight.${attribute}`, [])[0];

    if (!highlight) {
      return searchResult[attribute];
    }

    const parts = highlight.split(/(<mark>[^<]+<\/mark>)/);
    const parsedString = parts.map((part) => {
      if (part.includes("<mark>")) {
        let replaced = part.replace("<mark>", "");
        replaced = replaced.replace("</mark>", "");
        return <span className={css(styles.highlight)}>{replaced}</span>;
      }
      return <span>{part}</span>;
    });

    return parsedString;
  };

  const renderAppliedFilterBadge = ({ opt, dropdownKey }) => {
    return (
      <Badge
        id={`${dropdownKey}-${opt.value}`}
        key={`${dropdownKey}-${opt.value}`}
        label={opt.label}
        onClick={() => handleRemoveSelected({ opt, dropdownKey })}
        onRemove={() => handleRemoveSelected({ opt, dropdownKey })}
      />
    );
  };

  const hasAppliedFilters = selectedHubs.length || selectedTimeRange.value;
  const facetValueOpts = facetValuesForHub.map((f) => ({
    label: `${f.key} (${f.doc_count})`,
    value: f.key,
    valueForApi: f.key,
  }));

  return (
    <div>
      {context !== "best-results" && (numOfHits > 0 || hasAppliedFilters) && (
        <Fragment>
          <div className={css(styles.resultCount)}>
            {`${numOfHits} ${numOfHits === 1 ? "result" : "results"} found.`}
          </div>
          <div className={css(styles.filters)}>
            <FormSelect
              id={"hubs"}
              options={facetValueOpts}
              containerStyle={styles.dropdownContainer}
              inputStyle={styles.dropdownInput}
              onChange={handleFilterSelect}
              isSearchable={true}
              placeholder={"Hubs"}
              value={selectedHubs}
              isMulti={true}
              multiTagStyle={null}
              multiTagLabelStyle={null}
              isClearable={false}
              showCountInsteadOfLabels={true}
            />
            <FormSelect
              id={"publish_date__gte"}
              options={timeFilterOpts}
              containerStyle={styles.dropdownContainer}
              inputStyle={styles.dropdownInput}
              onChange={handleFilterSelect}
              isSearchable={true}
              placeholder={"Date Published"}
              value={selectedTimeRange}
              isMulti={false}
              multiTagStyle={null}
              multiTagLabelStyle={null}
              isClearable={false}
              showLabelAlongSelection={
                pageWidth <= breakpoints.small.int ? true : false
              }
            />
            <FormSelect
              id={"ordering"}
              placeholder={"Sort"}
              options={sortOpts}
              value={selectedSortOrder}
              containerStyle={[
                styles.dropdownContainer,
                styles.dropdownContainerForSort,
              ]}
              inputStyle={styles.dropdownInput}
              onChange={handleFilterSelect}
              isSearchable={false}
              showLabelAlongSelection={
                pageWidth <= breakpoints.small.int ? true : false
              }
            />
          </div>

          {hasAppliedFilters && (
            <div className={css(styles.appliedFilters)}>
              {selectedHubs.map((opt) =>
                renderAppliedFilterBadge({ opt, dropdownKey: "hubs" })
              )}
              {selectedTimeRange.value &&
                renderAppliedFilterBadge({
                  opt: selectedTimeRange,
                  dropdownKey: "publish_date__gte",
                })}

              <Badge
                id="clear-all"
                label="CLEAR ALL"
                badgeClassName={styles.clearFiltersBtn}
                onClick={handleClearAll}
              />
            </div>
          )}
        </Fragment>
      )}

      {numOfHits === 0 && (
        <EmptyFeedScreen title="There are no results found for this criteria" />
      )}

      <div>
        {searchEntityType === "post" &&
          results.map((post, index) => {
            post.user_vote = userVotes[post.id];

            return (
              <FeedCard
                {...post}
                formattedDocType={"post"}
                key={post?.id || index}
                user_vote={post?.user_vote}
              />
            );
          })}
        {searchEntityType === "paper" &&
          results.map((paper, index) => {
            paper.promoted = false;
            paper.user_vote = userVotes[paper.id];

            return (
              <FeedCard
                {...paper}
                formattedDocType={"paper"}
                index={index}
                key={paper.id}
                paper={paper}
                voteCallback={(arrIndex, currPaper) => {
                  const idx = results.findIndex((p) => p.id === currPaper.id);

                  results[idx] = currPaper;
                  userVotes[currPaper.id] = currPaper.user_vote;

                  setResults(results);
                  setUserVotes(userVotes);
                }}
              />
            );
          })}
      </div>

      {nextResultsUrl && (
        <LoadMoreButton onClick={loadMoreResults} isLoading={isLoadingMore} />
      )}
    </div>
  );
};

const styles = StyleSheet.create({
  resultCount: {
    color: colors.GREY(),
    marginBottom: 20,
  },
  filters: {
    display: "flex",
    marginBottom: 20,
    [`@media only screen and (max-width: ${breakpoints.small.str})`]: {
      flexWrap: "wrap",
      marginBottom: 0,
    },
  },
  dropdownContainer: {
    width: 250,
    minHeight: "unset",
    marginTop: 0,
    marginBottom: 0,
    marginRight: 20,
    [`@media only screen and (max-width: ${breakpoints.small.str})`]: {
      marginRight: 0,
      marginBottom: 10,
      width: "100%",
    },
  },
  dropdownContainerForSort: {
    width: 200,
    marginRight: 0,
    marginLeft: "auto",
    [`@media only screen and (max-width: ${breakpoints.small.str})`]: {
      width: "100%",
    },
  },
  dropdownInput: {
    width: 200,
    minHeight: "unset",
    width: "100%",
  },
  appliedFilters: {
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
    padding: "2px 2px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    display: "flex",
    textTransform: "capitalize",
    marginBottom: 20,
  },
  highlight: {
    backgroundColor: "yellow",
  },
  clearFiltersBtn: {
    backgroundColor: "none",
    color: colors.RED(),
    fontSize: 12,
    ":hover": {
      boxShadow: `inset 0px 0px 0px 1px ${colors.RED()}`,
    },
  },
});

SearchResultsForDocs.propTypes = {
  apiResponse: PropTypes.object,
  entityType: PropTypes.string,
  context: PropTypes.oneOf(["best-results"]),
};

export default SearchResultsForDocs;
