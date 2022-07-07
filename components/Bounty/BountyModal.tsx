import { ReactElement, useState } from "react";
import { css, StyleSheet } from "aphrodite";
import BaseModal from "../Modals/BaseModal";
import ReactTooltip from "react-tooltip";
import icons from "~/config/themes/icons";
import Button from "../Form/Button";
import colors from "~/config/themes/colors";


const BOUNTY_DEFAULT_AMOUNT = 1000;
const BOUNTY_RH_PERCENTAGE = 7;

type Props = {
  isOpen: Boolean;
  withPreview: Boolean;
  closeModal: Function;
  handleBountyAdded: Function;
  removeBounty: Function;
  addBtnLabel?: string;
  appliedBounty?: any;
};

function BountyModal({
    isOpen,
    withPreview,
    closeModal,
    handleBountyAdded,
    appliedBounty,
    removeBounty,
    addBtnLabel = "Add Bounty",
  }: Props): ReactElement {

    const [bountyAmount, setBountyAmount] = useState(appliedBounty?.grossBountyAmount || BOUNTY_DEFAULT_AMOUNT);

    const handleClose = () => {
      closeModal();
    }

    const handleBountyInputChange = (event) => {
      setBountyAmount(event.target.value);
    }

    const researchHubAmount = parseInt((BOUNTY_RH_PERCENTAGE/100 * bountyAmount).toFixed(0));
    return (
      <BaseModal
        closeModal={handleClose}
        isOpen={isOpen}
        modalStyle={styles.modalStyle}
        titleStyle={styles.title}
        title={
          <>
            <span className={css(styles.bountyIcon)}>{icons.bountySolid}</span>
            <span>Add ResearchCoin Bounty</span>
          </>
        }
      >

        <div className={css(styles.rootContainer)}>
          <div className={css(styles.values)}>
            <div className={css(styles.offeringLine)}>
              <div className={css(styles.lineItem, styles.offeringLine)}>
                <div className={css(styles.lineItemText, styles.offeringText)}>
                  I am offering
                </div>
                <div className={css(styles.lineItemValue, styles.offeringValue)}>
                  <input onChange={handleBountyInputChange} value={bountyAmount} />
                  <span>RSC</span>
                </div>
              </div>

              <div className={css(styles.lineItem, styles.platformFeeLine)}>
                <ReactTooltip
                  effect="solid"
                  html={true}
                />                
                <div className={css(styles.lineItemText)} data-tip={`
                  <div style="text-align: left;">
                    • 5% of awarded amount will be paid to Research Hub. <br/>
                    • 2% of awarded amount will be paid to the Research Hub community.
                  </div>
                `}>
                  Research Hub Platform Fee ({BOUNTY_RH_PERCENTAGE}%)
                </div>
                <div className={css(styles.lineItemValue)}>
                  <span>- {researchHubAmount}</span>
                  <span>RSC</span>
                </div>
              </div>              

              <div className={css(styles.lineItem, styles.netAmountLine)}>
                <ReactTooltip
                  effect="solid"
                />
                <div className={css(styles.lineItemText)} data-tip={"Actual amount bounty winner will receive"}>
                  Net Bounty Award
                </div>
                <div className={css(styles.lineItemValue, styles.netAmountValue)}>
                  <span>{bountyAmount - researchHubAmount}</span>
                  <span>RSC</span>
                </div>
              </div>              
            </div>
          </div>
          <div className={css(infoSectionStyles.bountyInfo)}>
            <div className={css(infoSectionStyles.infoRow)}>
              <span className={css(infoSectionStyles.infoIcon)}>{icons.clock}</span> <span className={css(infoSectionStyles.infoText)}>Bounty will end in 30 days or as soon as you award a solution</span>
            </div>
            <div className={css(infoSectionStyles.infoRow)}>
              <span className={css(infoSectionStyles.infoIcon)}>{icons.bounty}</span> Award either partial or full bounty depending on whether solution satisfies your request
            </div>
            <div className={css(infoSectionStyles.infoRow)}>
              <span className={css(infoSectionStyles.infoIcon)}>{icons.undo}</span> If no solution satisfies your request, full bounty amount will be refunded to you
            </div>
          </div>

          <div className={css(styles.addBountyContainer)}>
            {appliedBounty &&
              <div className={css(styles.removeBountyBtn)} onClick={() => {
                removeBounty();
                closeModal();
              }}>Remove Bounty</div>
            }
            <div className={css(styles.addBtnContainer)}>
              <Button
                label={addBtnLabel}
                customButtonStyle={styles.addButton}
                customLabelStyle={styles.addButtonLabel}
                onClick={() => {
                  handleBountyAdded({
                    grossBountyAmount: bountyAmount,
                    netBountyAmount: bountyAmount - researchHubAmount,
                  })
                  closeModal();
                }}
              />
            </div>
          </div>
        </div>
      </BaseModal>
    )
}

const infoSectionStyles = StyleSheet.create({
  bountyInfo: {
    textAlign: "left",
  },
  infoRow: {
    marginBottom: 10,
    display: "flex",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {

  },
});

const styles = StyleSheet.create({
  rootContainer: {
    fontSize: 18,
    width: "100%",
    textAlign: "center",
  },
  title: {
    color: colors.ORANGE_DARK(),
    marginBottom: 25,
  },
  bountyIcon: {
    marginRight: 10,

  },
  modalStyle: {
    maxWidth: 700,
  },
  removeBountyBtn: {
    color: colors.RED(),
    fontSize: 14,
    fontWeight: 400,
  },
  addBountyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",

  },
  addBtnContainer: {
    marginLeft: "15px",
  },
  addButton: {
    background: colors.ORANGE(),
    borderRadius: "50px",
  },
  addButtonLabel: {
    color: colors.BLACK(),
  },
  values: {
    marginBottom: 25,
  },
  lineItem: {
    display: "flex",
    fontSize: 18,
    lineHeight: "26px",
  },
  lineItemValue: {
    display: "flex",
    marginLeft: "auto",
  },
  lineItemText: {

  },
  offeringLine: {

  },
  offeringText: {
    
  },
  offeringValue: {

  },
  platformFeeLine: {

  },
  netAmountLine: {
  },
  netAmountValue: {
    borderTop: "2px solid gray",
    color: colors.ORANGE_DARK(),
    fontWeight: 500,

  }
});

export default BountyModal;
