import React, { useRef } from "react";
import useData from "../hooks/useData";
export default () => {
  const input = useRef<HTMLInputElement>(null);
  const { dispatch } = useData();

  const onClick = () => {
    if (input?.current?.value) {
      dispatch({ type: "LOGIN", token: input.current.value });
    }
  };

  return (
    <div>
      <input name="githubtoken" ref={input} placeholder="github token" />
      <button onClick={onClick}>Log in</button>
      <a href="https://github.com/settings/tokens">Create a token here</a>
    </div>
  );
};
