import { Component, Fragment } from "react";
import { connect } from "react-redux";
import { StyleSheet, css } from "aphrodite";

// Component
import VoteWidget from "../VoteWidget";
import ThreadActionBar from "./ThreadActionBar";
import DiscussionPostMetadata from "../DiscussionPostMetadata";
import ReplyEntry from "./ReplyEntry";
import ThreadTextEditor from "./ThreadTextEditor";

// Config
import colors from "~/config/themes/colors";
import { UPVOTE, DOWNVOTE } from "~/config/constants";
import { checkVoteTypeChanged } from "~/config/utils/reputation";
import { getNestedValue } from "~/config/utils/misc";
import API from "~/config/api";
import { Helpers } from "@quantfive/js-web-config";
import { createUsername } from "~/config/utils/user";

// Redux
import DiscussionActions from "../../redux/discussion";
import { MessageActions } from "~/redux/message";

class CommentEntry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      revealReply: true,
      hovered: false,
      collapsed: false,
      score: 0,
      selectedVoteType: "",
      // Pagination
      page: 2, // we assume page 1 is already present
      fetching: false, // when true, we show loading state,
      replies: [],
      // Removed
      removed: this.props.comment.isRemoved,
      // Editing,
      editing: false,
      canEdit: false,
    };
    this.commentRef = null;
  }

  componentDidMount() {
    const selectedVoteType = getNestedValue(this.props, [
      "comment",
      "user_vote",
      "vote_type",
    ]);
    // const revealReply =
    //   this.props.comment.replies.length > 0 &&
    //   this.props.comment.replies.length < 5;
    const score = this.props.comment.score;
    this.setState(
      {
        replies: this.props.comment.replies,
        // revealReply,
        selectedVoteType,
        score,
        highlight: this.shouldHighlight(),
        canEdit:
          this.props.comment.source === "twitter"
            ? false
            : this.props.auth &&
              this.props.auth.user.id === this.props.comment.created_by.id,
      },
      () => {
        this.props.comment.highlight &&
          setTimeout(() => {
            this.setState({ highlight: false }, () => {
              this.props.comment.highlight = false;
            });
          }, 10000);
      }
    );
  }

  shouldHighlight = () => {
    const { currentAuthor, comment, context } = this.props;
    const isCurrentAuthor =
      currentAuthor?.id === comment.created_by.author_profile.id;

    if (context === "AUTHOR_PROFILE") {
      if (isCurrentAuthor) {
        return true;
      }
    } else if (context === "DOCUMENT") {
      return false;
    }

    return false;
  };

  componentDidUpdate(prevProps) {
    this.handleVoteTypeUpdate(prevProps);
    if (prevProps.auth !== this.props.auth) {
      let { comment } = this.props;
      this.setState({
        canEdit:
          this.props.comment.source === "twitter"
            ? false
            : this.props.auth.user.id === comment.created_by.id,
      });
    }
  }

  handleVoteTypeUpdate = (prevProps) => {
    const stateToSet = {};

    const nextSelectedVoteType = this.getNextSelectedVoteType(prevProps);
    const nextReplyVoteType = this.getNextReplyVoteType(prevProps);
    const nextReplies = this.getNextReplies();

    if (nextSelectedVoteType !== undefined) {
      // If this component's vote has changed, downstream votes *may* have
      // changed too, so we update the state of the downstream children.
      stateToSet["selectedVoteType"] = nextSelectedVoteType;
      stateToSet["replies"] = nextReplies;
    }
    if (nextReplyVoteType !== undefined) {
      // In this case we *know* the downstream votes have changed.
      stateToSet["replies"] = nextReplies;
    }

    // Update state only if we detect a difference
    if (Object.keys(stateToSet).length > 0) {
      this.setState({
        ...stateToSet,
      });
    }
  };

  getNextSelectedVoteType = (prevProps) => {
    return checkVoteTypeChanged(prevProps.comment, this.props.comment);
  };

  getNextReplyVoteType = (prevProps) => {
    const prevReplies = getNestedValue(prevProps, ["comment", "replies"], []);
    const prevReply = prevReplies[0];
    const nextReplies = this.getNextReplies();
    const nextReply = nextReplies[0];
    return checkVoteTypeChanged(prevReply, nextReply);
  };

  getNextReplies = () => {
    return getNestedValue(this.props, ["comment", "replies"], []);
  };

  fetchReplies = (e) => {
    e && e.stopPropagation();
    this.setState(
      {
        fetching: true,
      },
      () => {
        let { data, comment } = this.props;
        let discussionThreadId = data.id;
        let commentId = comment.id;
        let paperId = data.paper;
        let page = this.state.page;

        fetch(
          API.THREAD_COMMENT_REPLY(
            paperId,
            discussionThreadId,
            commentId,
            page
          ),
          API.GET_CONFIG()
        )
          .then(Helpers.checkStatus)
          .then(Helpers.parseJSON)
          .then((res) => {
            this.setState({
              replies: [...this.state.replies, ...res.results],
              page: this.state.page + 1,
              fetching: false,
            });
          })
          .catch((_err) => {
            let { setMessage, showMessage } = this.props;
            setMessage("Hm something went wrong");
            showMessage({ show: true, error: true, clickoff: true });
            this.setState({ fetching: false });
          });
      }
    );
  };

  renderViewMore = () => {
    if (this.state.replies.length < this.props.comment.replyCount) {
      let fetching = this.state.fetching;
      let totalCount = this.props.comment.replyCount;
      let currentCount = this.state.replies.length;
      let fetchCount =
        totalCount - currentCount >= 10 ? 10 : totalCount - currentCount;
      return (
        <div className={css(styles.viewMoreContainer)}>
          <div
            className={css(styles.viewMoreButton)}
            onClick={!fetching ? this.fetchReplies : null}
          >
            {fetching ? (
              <span className={css(styles.loadingText)}>loading...</span>
            ) : (
              `View ${fetchCount} More`
            )}
          </div>
        </div>
      );
    }
  };

  upvote = async () => {
    let {
      data,
      comment,
      postUpvote,
      postUpvotePending,
      post,
      hypothesis,
      documentType,
    } = this.props;
    let discussionThreadId = data.id;
    let paperId = data.paper;
    let documentId;
    if (documentType === "post" || documentType === "question") {
      documentId = post.id;
    } else if (documentType === "hypothesis") {
      documentId = hypothesis.id;
    }
    let commentId = comment.id;

    postUpvotePending();

    await postUpvote(
      documentType,
      paperId,
      documentId,
      discussionThreadId,
      commentId
    );

    this.updateWidgetUI();
  };

  downvote = async () => {
    let {
      data,
      comment,
      postDownvote,
      postDownvotePending,
      post,
      hypothesis,
      documentType,
    } = this.props;
    let discussionThreadId = data.id;
    let paperId = data.paper;
    let documentId;
    if (documentType === "post" || documentType === "question") {
      documentId = post.id;
    } else if (documentType === "hypothesis") {
      documentId = hypothesis.id;
    }
    let commentId = comment.id;

    postDownvotePending();

    await postDownvote(
      documentType,
      paperId,
      documentId,
      discussionThreadId,
      commentId
    );

    this.updateWidgetUI();
  };

  updateWidgetUI = () => {
    let voteResult = this.props.vote;
    const success = voteResult.success;
    const vote = getNestedValue(voteResult, ["vote"], false);

    if (success) {
      const voteType = vote.voteType;
      let score = this.state.score;
      if (voteType === UPVOTE) {
        if (voteType) {
          if (this.state.selectedVoteType === null) {
            score += 1;
          } else {
            score += 2;
          }
        } else {
          score += 1;
        }
        this.setState({
          selectedVoteType: UPVOTE,
          score,
        });
      } else if (voteType === DOWNVOTE) {
        if (voteType) {
          if (this.state.selectedVoteType === null) {
            score -= 1;
          } else {
            score -= 2;
          }
        } else {
          score -= 1;
        }
        this.setState({
          selectedVoteType: DOWNVOTE,
          score,
        });
      }
    }
  };

  submitReply = async ({ content, plainText, callback }) => {
    let {
      data,
      comment,
      postReply,
      postReplyPending,
      discussionCount,
      setCount,
      documentType,
      post,
      hypothesis,
    } = this.props;
    let paperId = data.paper;
    let documentId;
    if (documentType === "post" || documentType === "question") {
      documentId = post.id;
    } else if (documentType === "hypothesis") {
      documentId = hypothesis.id;
    }
    let discussionThreadId = data.id;
    let commentId = comment.id;

    postReplyPending();
    await postReply(
      documentType,
      paperId,
      documentId,
      discussionThreadId,
      commentId,
      content,
      plainText
    );
    if (this.props.discussion.donePosting && this.props.discussion.success) {
      callback && callback();
      let newReply = { ...this.props.discussion.postedReply };
      newReply.highlight = true;
      let replies = [...this.state.replies, newReply];
      comment.replies = replies;
      setCount && setCount(discussionCount + 1);
      this.setState({
        revealReply: true,
        replies,
      });
    } else {
      callback && callback();
    }
  };

  saveEditsComments = async ({ content, plainText, callback }) => {
    let {
      data,
      comment,
      updateComment,
      updateCommentPending,
      showMessage,
      setMessage,
      post,
      hypothesis,
      documentType,
    } = this.props;
    let paperId = data.paper;
    let documentId;
    if (documentType === "post" || documentType === "question") {
      documentId = post.id;
    } else if (documentType === "hypothesis") {
      documentId = hypothesis.id;
    }
    let discussionThreadId = data.id;
    let commentId = comment.id;

    updateCommentPending();
    await updateComment(
      documentType,
      paperId,
      documentId,
      discussionThreadId,
      commentId,
      content,
      plainText
    );
    if (this.props.discussion.doneUpdating && this.props.discussion.success) {
      callback();
      this.setState({ editing: false });
    } else {
      setMessage("Something went wrong");
      showMessage({ show: true, error: true });
    }
  };

  formatMetaData = () => {
    let { data, comment, post, hypothesis, documentType } = this.props;
    let documentId;
    if (documentType === "post" || documentType === "question") {
      documentId = post.id;
    } else if (documentType === "hypothesis") {
      documentId = hypothesis.id;
    }
    return {
      authorId: data.created_by.author_profile.id,
      threadId: data.id,
      commentId: comment.id,
      paperId: data.paper,
      comment: comment.user_flag,
      contentType: "comment",
      objectId: comment.id,
      documentId: documentId,
    };
  };

  getDocumentID = () => {
    const { data, hypothesis, post } = this.props;
    return data?.paper ?? hypothesis?.id ?? post?.id;
  };

  handleStateRendering = () => {
    if (this.state.removed) {
      return false;
    }
    if (!this.state.collapsed) {
      return true;
    }
  };

  toggleReplyView = () => {
    this.setState({
      revealReply: !this.state.revealReply,
    });
  };

  toggleHover = (e) => {
    e && e.stopPropagation();
    this.setState({ hovered: !this.state.hovered });
  };

  toggleCollapsed = (e) => {
    e && e.stopPropagation();
    this.setState({ collapsed: !this.state.collapsed });
  };

  toggleEdit = () => {
    this.setState({ editing: !this.state.editing });
  };

  removePostUI = () => {
    this.setState(
      {
        removed: true,
      },
      () => {
        //Todo: clean this part of code, temp use
        this.props.comment.isRemoved = true;
      }
    );
  };

  onReplySubmitCallback = () => {
    let { comment, setCount, discussion, discussionCount } = this.props;
    let newReply = { ...discussion.postedReply };
    newReply.highlight = true;
    let replies = [...this.state.replies, newReply];
    comment.replies = replies;
    setCount && setCount(discussionCount + 1);
    this.setState({
      revealReply: true,
      replies,
    });
  };

  renderReplies = () => {
    let {
      data,
      hostname,
      path,
      comment,
      paper,
      mediaOnly,
      post,
      hypothesis,
      documentType,
      currentAuthor,
      noVote,
    } = this.props;
    let replies =
      this.state.replies.length < 1
        ? this.props.comment.replies
        : this.state.replies;
    replies = replies.sort(
      (a, b) => new Date(a.created_date) - new Date(b.created_date)
    );
    return replies.map((reply, i) => {
      return (
        <ReplyEntry
          noVote={noVote}
          data={data}
          currentAuthor={currentAuthor}
          hostname={hostname}
          path={path}
          key={`disc${reply.id}`}
          comment={comment}
          reply={reply}
          paper={paper}
          mobileView={this.props.mobileView}
          onReplySubmitCallback={this.onReplySubmitCallback}
          mediaOnly={mediaOnly}
          post={post}
          hypothesis={hypothesis}
          documentType={documentType}
        />
      );
    });
  };

  render() {
    const {
      data,
      hostname,
      comment,
      mobileView,
      paper,
      mediaOnly,
      documentType,
      noVote,
    } = this.props;
    let threadId = comment.id;
    let commentCount =
      this.state.replies.length > comment.reply_count
        ? this.state.replies.length
        : comment.reply_count;
    const documentID = this.getDocumentID();
    let date = comment.created_date;
    let body = comment.source === "twitter" ? comment.plain_text : comment.text;
    let username = createUsername(comment);
    let metaIds = this.formatMetaData();

    return (
      <div
        className={css(styles.row, styles.commentCard)}
        ref={(element) => (this.commentRef = element)}
      >
        <div
          className={css(
            styles.column,
            styles.left,
            noVote && styles.columnNoVote
          )}
        >
          <div
            className={css(
              styles.voteContainer,
              this.state.highlight && styles.voteContainerHighlight
            )}
          >
            {noVote ? null : (
              <VoteWidget
                styles={styles.voteWidget}
                score={this.state.score}
                onUpvote={this.upvote}
                onDownvote={this.downvote}
                selected={this.state.selectedVoteType}
                // fontSize={"12px"}
                // width={"40px"}
                type={"Comment"}
                promoted={false}
              />
            )}
            {!this.state.collapsed && (
              <div
                className={css(
                  styles.threadLineContainer,
                  noVote && styles.threadlineNoVote
                )}
                onClick={this.toggleReplyView}
              >
                <div className={css(styles.threadline) + " threadline"} />
              </div>
            )}
          </div>
        </div>
        <div className={css(styles.column, styles.metaData)}>
          <div
            className={css(
              styles.mainContent,
              this.state.highlight && styles.highlight
            )}
          >
            {!this.state.removed && (
              <div className={css(styles.row, styles.topbar)}>
                <DiscussionPostMetadata
                  authorProfile={getNestedValue(comment, [
                    "created_by",
                    "author_profile",
                  ])}
                  isCreatedByEditor={comment?.is_created_by_editor}
                  data={comment}
                  username={username}
                  date={date}
                  paper={paper}
                  documentType={documentType}
                  smaller={true}
                  onHideClick={!mobileView && this.toggleCollapsed}
                  hideState={this.state.collapsed}
                  dropDownEnabled={true}
                  // Moderator
                  metaData={metaIds}
                  onRemove={this.removePostUI}
                  twitter={data.source === "twitter"}
                  twitterUrl={data.url}
                />
              </div>
            )}
            {this.handleStateRendering() && (
              <Fragment>
                <div className={css(styles.content)}>
                  <ThreadTextEditor
                    readOnly={true}
                    initialValue={body}
                    body={true}
                    editing={this.state.editing}
                    onEditCancel={this.toggleEdit}
                    onEditSubmit={this.saveEditsComments}
                    textStyles={styles.commentEditor}
                    mediaOnly={mediaOnly}
                  />
                </div>
                <div className={css(styles.row, styles.bottom)}>
                  <ThreadActionBar
                    comment
                    commentID={comment?.id}
                    contentType="comment"
                    count={commentCount}
                    documentID={documentID}
                    documentType={this.props.documentType}
                    editing={this.state.editing}
                    hideReply={comment.source === "twitter"}
                    hostname={hostname}
                    isRemoved={this.state.removed}
                    mediaOnly={mediaOnly}
                    onClick={this.toggleReplyView}
                    onCountHover={this.toggleHover}
                    onSubmit={this.submitReply}
                    showChildrenState={this.state.revealReply}
                    small
                    threadID={data?.id}
                    toggleEdit={this.state.canEdit && this.toggleEdit}
                  />
                </div>
              </Fragment>
            )}
            {this.state.removed && (
              <Fragment>
                <div className={css(styles.content)}>
                  <div className={css(styles.removedText)}>
                    Comment Removed By Moderator
                  </div>
                </div>
                <div className={css(styles.row, styles.bottom)}>
                  <ThreadActionBar
                    comment
                    commentID={comment?.id}
                    contentType="comment"
                    count={commentCount}
                    documentID={documentID}
                    documentType={this.props.documentType}
                    hideReply={comment.source === "twitter"}
                    hostname={hostname}
                    isRemoved={this.state.removed}
                    onClick={this.toggleReplyView}
                    onCountHover={this.toggleHover}
                    onSubmit={this.submitReply}
                    showChildrenState={this.state.revealReply}
                    small
                    threadID={data?.id}
                  />
                </div>
              </Fragment>
            )}
          </div>
          {!this.state.collapsed && this.state.revealReply && (
            <Fragment>
              {this.renderReplies()}
              {this.renderViewMore()}
            </Fragment>
          )}
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    height: "100%",
  },
  columnNoVote: {
    width: 18,
  },
  left: {
    alignItems: "center",
    width: 44,
    display: "table-cell",
    height: "100%",
    verticalAlign: "top",
    "@media only screen and (max-width: 600px)": {
      width: 35,
    },
  },
  voteContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  commentCard: {
    marginTop: 15,
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    marginBottom: 5,
    overflow: "visible",
    display: "table",
    tableLayout: "fixed",
    height: "100%",
    borderSpacing: 0,
    "@media only screen and (max-width: 415px)": {
      justifyContent: "space-between",
    },
  },
  topbar: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  content: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
    overflowWrap: "break-word",
    lineHeight: 1.6,
  },
  metaData: {
    display: "table-cell",
    height: "100%",
    boxSizing: "border-box",
    width: "100%",
  },
  voteContainerHighlight: {
    marginTop: 5,
  },
  mainContent: {
    width: "100%",
    padding: "9px 10px 8px 8px",
    boxSizing: "border-box",
    marginLeft: 2,
  },
  highlight: {
    padding: "8px 10px 10px 15px",
    backgroundColor: colors.LIGHT_BLUE(0.2),
    borderRadius: 5,
    marginBottom: 10,
    "@media only screen and (max-width: 767px)": {
      paddingLeft: 10,
      paddingRight: 5,
      paddingBottom: 5,
    },
  },
  bottom: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  title: {
    margin: 0,
    padding: 0,
    fontSize: 20,
  },
  body: {
    margin: 0,
  },
  replyContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    width: "100%",
  },
  voteWidget: {
    margin: 0,
    "@media only screen and (max-width: 415px)": {
      width: 35,
    },
  },
  viewMoreContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 8,
    marginLeft: 20,
  },
  viewMoreButton: {
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    ":hover": {
      color: colors.NEW_BLUE(),
    },
  },
  loadingText: {
    color: colors.NEW_BLUE(),
  },
  removedText: {
    fontStyle: "italic",
    fontSize: 13,
  },
  commentEditor: {
    fontSize: 16,
    "@media only screen and (max-width: 767px)": {
      fontSize: 14,
    },
    "@media only screen and (max-width: 415px)": {
      fontSize: 12,
    },
  },
  threadLineContainer: {
    padding: 8,
    paddingBottom: 0,
    // height: "calc(100% - 80px)",
    height: "calc(100% - 58px)",
    cursor: "pointer",
    ":hover .threadline": {
      backgroundColor: colors.NEW_BLUE(1),
    },
  },
  threadline: {
    height: "100%",
    width: 2,
    backgroundColor: colors.GREY_LINE(),
    cursor: "pointer",
  },
  threadlineNoVote: {
    height: "100%",
  },
  hoverThreadline: {
    backgroundColor: colors.NEW_BLUE(),
  },
  activeThreadline: {
    backgroundColor: colors.NEW_BLUE(0.3),
  },
});

const mapStateToProps = (state) => ({
  discussion: state.discussion,
  vote: state.vote,
  auth: state.auth,
});

const mapDispatchToProps = {
  postReply: DiscussionActions.postReply,
  postReplyPending: DiscussionActions.postReplyPending,
  postUpvotePending: DiscussionActions.postUpvotePending,
  postUpvote: DiscussionActions.postUpvote,
  postDownvotePending: DiscussionActions.postDownvotePending,
  postDownvote: DiscussionActions.postDownvote,
  updateComment: DiscussionActions.updateComment,
  updateCommentPending: DiscussionActions.updateCommentPending,
  setMessage: MessageActions.setMessage,
  showMessage: MessageActions.showMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(CommentEntry);
