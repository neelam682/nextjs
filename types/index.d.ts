// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}


interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
}

// ---------- USER PARAMS ----------
export enum Plan {
  basic = "basic",
  pro = "pro",
  enterprise = "enterprise",
}

export enum SubscriptionStatus {
  active = "active",
  canceled = "canceled",
  trialing = "trialing",
  past_due = "past_due",
  incomplete = "incomplete",
}

export interface CreateUserParams {
  clerkId: string; // from Clerk
  email: string;
  username?: string;
  photo?: string;

  // Subscription info
  plan?: Plan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  currentPeriodEnd?: Date;

  // Optional credits if you use them
  creditBalance?: number;
}

export interface UpdateUserParams {
  username?: string;
  photo?: string;

  // Subscription updates
  plan?: Plan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  currentPeriodEnd?: Date;

  // Credits
  creditBalance?: number;
}
