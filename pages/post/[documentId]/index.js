import { Fragment } from "react";
import Router from "next/router";
import Error from "next/error";
import Loader from "~/components/Loader/Loader";
import { buildSlug } from "~/config/utils/buildSlug";
import API from "~/config/api";

// Redux
import helpers from "@quantfive/js-web-config/helpers";

function Post(props) {
  // TODO: Does this need to be a dynamic route or hard refresh?
  if (props.error) {
    return <Error statusCode={404} />;
  }

  if (props.redirectPath && typeof window !== "undefined") {
    Router.push(props.redirectPath);
  }

  return (
    <Error title={<Fragment>Redirecting to page</Fragment>} statusCode={301} />
  );
}

Post.getInitialProps = async (ctx) => {
  const { store, res, query } = ctx;

  const posts = await fetch(
    API.RESEARCHHUB_POST({ post_id: query.documentId }),
    API.GET_CONFIG()
  ).then(helpers.parseJSON);
  const post = posts.results[0];
  const redirectPath = `/post/${post.id}/${post.slug}`;

  return { post, redirectPath };
};

export default Post;
