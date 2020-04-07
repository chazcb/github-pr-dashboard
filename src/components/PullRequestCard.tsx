import React from "react";
import { PullRequest } from "../OctoClient";
import styled from "styled-components";
import timeSince from "../timeSince";

const Card = styled.section`
  margin: 2px;
  padding: 10px;
  border: thin solid gray;
  border-radius: 3px;
  position: relative;
`;

const CardTitle = styled.h1`
  font-weight: 500;
  font-size: 12px;
  margin: 2px 0;
  padding: 2px 0;
`;

const CardMeta = styled.span`
  font-size: 11px;
  color: #74777d;
  display: block;
  position: absolute;
  top: 10px;
  right: 10px;
`;

const getRepoDisplay = (name: string) => {
  return name.replace(/\W+/g, "").toUpperCase();
};

const getStateDisplay = (pr: PullRequest) => {
  if (pr.item.state === "closed") {
    return pr.item.merged_at ? "closed" : "abandoned";
  }
  return pr.item.state;
};

const PullRequestCard = ({ pr }: { pr: PullRequest }) => {
  return (
    <Card>
      <CardTitle>
        <strong>{getRepoDisplay(pr.repo.name)}</strong>
        <a target="_blank" rel="noopener noreferrer" href={pr.item.html_url}>
          {pr.item.title}
        </a>
      </CardTitle>
      <div>state: {getStateDisplay(pr)}</div>
      <div>review: {pr.state || "-"}</div>
      <div>author: {pr.item.user.login}</div>
      <CardMeta>{`updated ${timeSince(pr.item.updated_at)} ago`}</CardMeta>
    </Card>
  );
};

export default PullRequestCard;
