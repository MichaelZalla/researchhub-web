import { useState } from "react";
import { StyleSheet, css } from "aphrodite";

// Config
import colors, { bannerColor } from "~/config/themes/colors";
import { getJournalImagePath, formatJournalName } from "~/config/utils/misc";
import { capitalize } from "~/config/utils/string";
import { getJournalFromURL } from "~/config/utils/parsers";

const JournalCard = (props) => {
  const { paper } = props;
  const { external_source, url } = paper;
  const [imgExists, setImgExists] = useState(true);

  const externalSource = external_source
    ? external_source
    : getJournalFromURL(url);
  const journal = formatJournalName(externalSource);

  const journalImageProps = () => ({
    src: journal && getJournalImagePath(journal),
    className: css(styles.image),
    onError: () => setImgExists(false),
  });

  return (
    <a
      className={css(styles.container)}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {imgExists && <img {...journalImageProps()} />}
      <div className={css(styles.column) + " clamp1"}>
        {externalSource && (
          <span className={css(styles.journal)}>
            {capitalize(externalSource)}
          </span>
        )}
        {url && <span>{"View Original"}</span>}
      </div>
    </a>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 15px 10px 17px",
    borderLeft: `3px solid #FFF`,
    textDecoration: "unset",
    color: "unset",
    transition: "all ease-in-out 0.1s",
    overflow: "hidden",
    ":hover": {
      cursor: "pointer",
      background: "#FAFAFA",
      borderLeft: `3px solid ${colors.NEW_BLUE()}`,
    },
    ":hover .url": {
      color: colors.BLUE(),
      textDecoration: "underline",
    },
  },
  image: {
    height: 30,
    width: 30,
    minWidth: 30,
    maxWidth: 30,
    borderRadius: 4,
    objectFit: "contain",
    marginRight: 10,
    background: "#EAEAEA",
    border: "1px solid #ededed",
    "@media only screen and (max-width: 415px)": {
      height: 25,
      width: 25,
      minWidth: 25,
      maxWidth: 25,
    },
  },
  journal: {
    fontSize: 16,
    color: colors.BLACK(1),
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    lineHeight: 1.3,
    "@media only screen and (max-width: 415px)": {
      fontSize: 14,
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    boxSizing: "border-box",
    textOverflow: "ellipsis",
  },
  url: {
    fontSize: 14,
    width: "inherit",
    display: "inline-block",
    textOverflow: "ellipsis",
    color: colors.BLUE(),
    textDecoration: "unset",
    fontWeight: 500,
    ":hover": {
      cursor: "pointer",
      textDecoration: "underline",
    },
    "@media only screen and (max-width: 415px)": {
      fontSize: 12,
    },
  },
});

export default JournalCard;
