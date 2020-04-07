import { Octokit } from "@octokit/rest";
import _ from "lodash";
// https://octokit.github.io/rest.js/v17

export type RepoType = { name: string; full_name: string };
export type OptionsType = { state: "open" | "closed" | "all"; base?: string };

export default class OctoClient {
  octokit: Octokit;
  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getPullRequestDetails(repo: RepoType, id: number) {
    const { get } = this.octokit.pulls;
    const [owner, name] = repo.full_name.split("/");
    const item = await get({
      owner,
      repo: name,
      pull_number: id,
    });
    return { item, repo };
  }

  async getCurrentUser(): Promise<UserType> {
    return this.octokit.request("/user").then(({ data }) => data);
  }

  async listRepos(): Promise<RepoType[]> {
    const repos: RepoType[] = await this.octokit.repos
      .listForAuthenticatedUser({ sort: "updated", per_page: 100 })
      .then(({ data }) => data);

    return repos.map(({ name, full_name }) => ({
      name,
      full_name,
    }));
  }

  private listPrs = _.memoize(
    async (repo: RepoType, options: OptionsType): Promise<PullRequest[]> => {
      const currentUser = await this.getCurrentUser();
      const [owner, name] = repo.full_name.split("/");
      const prs = await this.octokit.pulls
        .list({ owner, repo: name, ...options })
        .then(({ data }) => data);

      const reviews = await Promise.all(
        prs.map((pr) => {
          if (pr.state !== "open") {
            return undefined;
          }

          return this.octokit.pulls
            .listReviews({
              owner,
              repo: name,
              pull_number: pr.number,
            })
            .then(({ data }) => data);
        })
      );

      return prs.map((item, idx) => {
        const _reviews: any = reviews[idx];
        return new PullRequest({
          repo,
          item,
          reviews: _reviews,
          currentUser,
        });
      });
    },
    (repo: RepoType, options: OptionsType) => {
      return `${repo.full_name}?state=${options.state}&base${options.base}`;
    }
  );

  async getDashboardData(
    repos: RepoType[],
    options: OptionsType = { state: "all", base: "master" }
  ) {
    const getPrs = (repo: RepoType) => this.listPrs(repo, options);
    return _.flatten(await Promise.all(repos.map(getPrs)));
  }
}

export type PullRequestStateType =
  | "MERGED" // code has been merged into master
  | "ABANDONED"
  | "WAITING_ON_AUTHOR"
  | "REQUIRES_RE_REVIEW"
  | "MUST_RE_REVIEW"
  | "READY_TO_LAND"
  | "NEEDS_REVIEW"
  | "UNKNOWN";

export type UserType = {
  login: string;
};

type ReviewType = {
  commit_id: string;
  user: UserType;
  state: "DISMISSED" | "CHANGES_REQUESTED" | "APPROVED";
};

type PrType = {
  head: {
    sha: string;
  };
  number: number;
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  user: UserType;
  state: string;
  html_url: string;
  merged_at: string;
  body: string;
  requested_reviewers: UserType[];
};

export class PullRequest {
  repo: RepoType;
  reviews?: ReviewType[];
  item: PrType;
  state: PullRequestStateType;
  currentUser: UserType;
  constructor({
    repo,
    item,
    reviews,
    currentUser,
  }: {
    repo: RepoType;
    item: PrType;
    currentUser: UserType;
    reviews?: ReviewType[];
  }) {
    this.repo = repo;
    this.item = item;
    this.reviews = reviews;
    this.currentUser = currentUser;
    this.state = this.calculateState();
  }

  isOpen() {
    return this.item.state;
  }

  private calculateState(): PullRequestStateType {
    const { item, reviews } = this;
    const isApprove = (r: ReviewType) => r.state === "APPROVED";
    const isBlock = (r: ReviewType) => r.state === "CHANGES_REQUESTED";
    const isLatestCommit = (r: ReviewType) => r.commit_id === item.head.sha;

    if (item.state === "closed") {
      return item.merged_at ? "MERGED" : "ABANDONED";
    }

    if (item.state === "open") {
      if (!reviews) {
        return "UNKNOWN";
      }

      const ordered = _.orderBy(reviews, ["submitted_at"], ["desc"]);
      const relevant = _.filter(ordered, (r) => isApprove(r) || isBlock(r));
      const byUser = _.groupBy(relevant, "user.login");
      const latest = Object.keys(byUser).map((login) => byUser[login][0]);
      const blocking = latest.filter(isBlock);

      if (blocking.length > 0) {
        // if any blocking review is for the latest commit, then
        // we are waiting on the author to update
        if (_.find(blocking, isLatestCommit)) {
          return "WAITING_ON_AUTHOR";
        }

        // otherwise, if I'm on any older commits, then I must re-review
        if (_.find(blocking, (r) => r.user.login === this.currentUser.login)) {
          return "MUST_RE_REVIEW";
        }

        // finally, we just need to review
        return "REQUIRES_RE_REVIEW";
      }

      const approvals = latest.filter(isApprove);
      if (_.find(approvals, isLatestCommit)) {
        return "READY_TO_LAND";
      }

      return "NEEDS_REVIEW";
    }

    return "UNKNOWN";
  }
}
