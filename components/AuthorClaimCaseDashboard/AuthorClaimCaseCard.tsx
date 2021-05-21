import { css, StyleSheet } from "aphrodite";
import { AUTHOR_CLAIM_STATUS } from "./constants/AuthorClaimStatus";
import { ID, ValueOf } from "../../config/types/root_types";
import React, { ReactElement, useState } from "react";
import colors from "../../config/themes/colors";
import icons from "../../config/themes/icons";

export type AuthorClaimCase = {
  caseID: ID;
  caseStatus: ValueOf<typeof AUTHOR_CLAIM_STATUS> | string;
  requestorID: ID;
  requestorEmail: string;
  requestorName: string;
  targetAuthorID: ID;
  targetAuthorName: string;
};

type Props = {
  allowedActions: Array<ValueOf<typeof AUTHOR_CLAIM_STATUS>>;
  authorClaimCase: AuthorClaimCase;
  cardWidth: number | string;
};

export default function AuthorClaimCaseCard({
  allowedActions,
  authorClaimCase,
  cardWidth,
}: Props): ReactElement<"div"> {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  return (
    <div
      className={css(styles.authorClaimCaseCard)}
      onClick={(): void => setIsCollapsed(!isCollapsed)}
      role="none"
      style={{ width: cardWidth }}
    >
      <div className={css(styles.chevronWrap)}>
        {isCollapsed ? icons.chevronDown : icons.chevronUp}
      </div>
      <div className={css(styles.cardMain)}>
        <div
          className={css(
            styles.cardMainSectionWrap,
            !isCollapsed && styles.borderBottom
          )}
        >
          <div className={css(styles.cardMainSection)}>name</div>
          <div className={css(styles.cardMainSection, styles.fontGrey)}>
            email
          </div>
          <div className={css(styles.cardMainSection, styles.fontGrey)}>
            date
          </div>
          <div className={css(styles.cardMainSection)}>buttons</div>
        </div>
        {!isCollapsed ? (
          <div className={css(styles.cardSubmain)}>
            <div className={css(styles.requestorSubInfo)}>
              User Profile Info
            </div>
            <div> Target Author Info </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  authorClaimCaseCard: {
    display: "flex",
    backgroundColor: "#FFF",
    border: `1px solid ${colors.GREY(0.5)}`,
    borderRadius: 4,
    fontFamily: "Roboto",
    marginBottom: 16,
    minHeight: 72,
  },
  borderBottom: {
    borderBottom: `1px solid ${colors.GREY(0.5)}`,
  },
  cardMain: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0px 16px",
    width: "100%",
  },
  cardMainSection: {
    alignItems: "center",
    display: "flex",
    height: 72,
    justifyContent: "flex-start",
    paddingRight: 16,
    width: "24%",
  },
  cardMainSectionWrap: {
    display: "flex",
    width: "100%",
  },
  cardSubmain: {
    display: "flex",
    flexDirection: "column",
    height: 72,
    justifyContent: "center",
    width: "100%",
  },
  chevronWrap: {
    alignItems: "center",
    color: "#787c7e",
    display: "flex",
    height: 72,
    justifyContent: "center",
    width: 52,
  },
  fontGrey: {
    color: colors.GREY(1),
  },
  requestorSubInfo: {
    fontSize: 16,
  },
});
