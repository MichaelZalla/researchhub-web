import { CitationConsensus } from "./hypothesis";
import { Hub } from "./hub";
import { parseCreatedBy } from "./contribution";
import {
  parsePeerReviewScoreSummary,
  PeerReviewScoreSummary,
} from "./peerReview";
import Bounty from "./bounty";

export type ID = string | number | null | undefined;
export type KeyOf<ObjectType> = keyof ObjectType;
export type ValueOf<ObjectType> = ObjectType[keyof ObjectType];
export type NullableString = string | null;

export interface TopLevelDocument {
  authors: Array<AuthorProfile>;
  score: number;
  createdDate: string;
  discussionCount: number;
  unifiedDocument: UnifiedDocument;
  hubs: Array<Hub>;
  createdBy: CreatedBy | null;
  userVote?: VoteType | null;
  title?: string;
  externalUrl?: string;
  doi?: string;
  datePublished?: string;
  journal?: string;
  formats?: Array<PaperFormat>;
  note?: any;
  markdown?: string;
  isReady: boolean;
  consensus?: CitationConsensus;
  boostAmount: number;
  id: ID;
  isOpenAccess?: boolean;
  bounties?: Bounty[]
  document_type: string;
}

export type PaperFormat = {
  type: "pdf" | "latex";
  url: string;
};

export type UrlDocument = {
  id?: ID;
  title?: string;
  slug?: string;
  paperTitle?: string;
  isRemoved?: boolean;
};

export type RhDocumentType =
  | "eln"
  | "hypothesis"
  | "paper"
  | "post"
  | "question"
  | "researchhub_post";
export type VoteType = "downvote" | "neutralvote" | "upvote";
export type VoteEnumType = 0 /* nuetral */ | 1 /* upvote */ | 2; /* downvote */

// TODO: remove this type once comment modules are migrated.
export type CommentType = "comment" | "reply" | "thread";

export type UnifiedDocument = {
  id: ID;
  documentType: RhDocumentType;
  document?: UrlDocument;
  createdBy?: CreatedBy;
  reviewSummary?: PeerReviewScoreSummary;
  isRemoved: boolean;
};

export type AuthorProfile = {
  id?: ID;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  isClaimed: boolean;
  url: string;
  sequence?: "first" | "additional";
};

export type RHUser = {
  authorProfile?: AuthorProfile;
  id: ID;
};

// TODO: Deprecate this in favor of RHUser
// NOTE: Avoid using this type
export type User = {
  agreed_to_terms: boolean;
  author_profile: {
    academic_verification: any; // TODO
    author_score: number;
    claimed: boolean;
    claimed_by_user_author_id: any; // TODO
    created_date: string;
    description: null | string;
    education: any[]; // TODO
    facebook: null | string;
    first_name: string;
    headline: null | string;
    id: number;
    is_claimed: boolean;
    last_name: string;
    linkedin: null | string;
    merged_with: any; // TODO
    num_posts: number;
    orcid_account: null | string;
    orcid_id: null | string;
    profile_image: string | null;
    reputation: number;
    sift_link: null | string;
    total_score: any; // TODO
    twitter: null | string;
    university: null | string;
    updated_date: string;
    user: number;
  };
  balance: number;
  bookmarks: any[]; // TODO
  country_code: any; // TODO
  created_date: string;
  date_joined: string;
  email: string;
  first_name: string;
  has_seen_first_coin_modal: boolean;
  has_seen_orcid_connect_modal: boolean;
  has_seen_stripe_modal: boolean;
  id: number;
  invited_by: any; // TODO
  is_active: boolean;
  is_suspended: boolean;
  last_login: string;
  last_name: string;
  moderator: boolean;
  probable_spammer: boolean;
  referral_code: any; // TODO
  reputation: number;
  sift_risk_score: any; // TODO
  spam_updated_date: any; // TODO
  subscribed: any[]; // TODO
  suspended_updated_date: any; // TODO
  updated_date: string;
  upload_tutorial_complete: boolean;
};

export type AuthStore = {
  isLoggedIn: boolean;
  isFetchingLogin: boolean;
  loginFailed: boolean;
  generatingAPIKey: boolean;
  authChecked: boolean;
  orcidConnectFailure: boolean;
  orcidConnectPending: boolean;
  orcidConnectSuccess: boolean;
  user: User;
  error: null | string;
  showBanner: boolean;
  uploadingPaper: boolean;
  userCoinAction: string;
  uuid: null | string;
  walletLink: any; // TODO
};

export type CreatedBy = {
  author_profile?: AuthorProfile; // occasional insertion slip-ins from legacy code.
  authorProfile: AuthorProfile;
  firstName: string;
  id: ID;
  lastName: string;
};

export const parseUnifiedDocument = (raw: any): UnifiedDocument => {
  if (typeof raw !== "object") {
    return raw;
  }

  const parsed = {
    id: raw.id,
    documentType: raw?.document_type?.toLowerCase(),
    document: {},
    isRemoved: raw.is_removed,
  };

  if (raw.created_by) {
    parsed["createdBy"] = parseCreatedBy(raw.created_by);
  }

  const unparsedInnerDoc = Array.isArray(raw.documents)
    ? raw.documents[0]
    : typeof raw.documents === "object"
    ? raw.documents
    : {};

  parsed.document = {
    id: unparsedInnerDoc?.id,
    title: unparsedInnerDoc?.title,
    slug: unparsedInnerDoc?.slug,
  };

  if (parsed.documentType === "discussion") {
    parsed.documentType = "post";
  } else if (parsed.documentType === "paper") {
    parsed.documentType = "paper";
    parsed.document["paperTitle"] = unparsedInnerDoc.paper_title;
  }

  if (raw.reviews) {
    parsed["reviewSummary"] = parsePeerReviewScoreSummary(raw.reviews);
  }

  return parsed;
};

export const parseAuthorProfile = (raw: any): AuthorProfile => {
  if (typeof raw !== "object") {
    return raw;
  }

  const parsed = {
    id: raw.id,
    profileImage: raw.profile_image,
    firstName: raw.first_name,
    lastName: raw.last_name,
    url: `/user/${raw.id}/overview`,
    ...(raw.sequence && { sequence: raw.sequence }),
  };

  if (!parsed.firstName) {
    parsed.firstName = "N/A";
  }

  return parsed;
};

export const parseUser = (raw: any): RHUser => {
  const parsed = {
    id: raw.id,
    authorProfile: parseAuthorProfile(raw.author_profile),
  };

  return parsed;
};
