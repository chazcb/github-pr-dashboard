import { useEffect, useState } from "react";

export default <R>(query: () => Promise<R>) => {
  const [data, setData] = useState<R | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(false);
  const refresh = () => {
    setLoading(true);
    query()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);
  return {
    loading,
    error,
    refresh,
    data,
  };
};
