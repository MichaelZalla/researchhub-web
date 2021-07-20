import { css, StyleSheet } from "aphrodite";
import React, { ReactNode, ReactElement } from "react";

type Props = {
  body: ReactNode;
  header: ReactNode;
};

export default function SiteWideBanner({
  body,
  header,
}: Props): ReactElement<"div"> {
  return (
    <div className={css(styles.siteWideBanner)}>
      <div className={css(styles.contentWrap)}>
        <div className={css(styles.textSection)}>
          <div className={css(styles.headerText)}>{header}</div>
          <div className={css(styles.bodyText)}>{body}</div>
        </div>
        <div className={css(styles.imgWrap)}>
          <img
            className={css(styles.bannerImg)}
            src={"/static/icons/site-wide-banner.png"}
          />
        </div>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  siteWideBanner: {
    display: "flex",
    width: "100%",
    height: 120,
    backgroundColor: "rgb(65 114 239)",
    fontFamily: "Roboto",
  },
  contentWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    margin: "auto",
    width: "80%",
    "@media only screen and (max-width: 1024px)": {
      margin: "none",
      padding: "0 12px",
      width: "100%",
    },
  },
  headerText: {
    color: "#fff",
    fontWeight: 500,
    fontSize: 24,
    marginBottom: 16,
    "@media only screen and (max-width: 1024px)": {
      fontSize: 18,
    },
  },
  bodyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 400,
    "@media only screen and (max-width: 1024px)": {
      fontSize: 12,
    },
  },
  textSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "calc(100% - 330px)",
    padding: 16,
    "@media only screen and (max-width: 767px)": {
      width: "100%",
      padding: "0 16px",
    },
  },
  bannerImg: {
    height: 120,
    width: 330,
  },
  imgWrap: {
    display: "unset",
    "@media only screen and (max-width: 767px)": {
      // ipad-size
      display: "none",
    },
  },
});
