import { useLocation } from "react-router-dom";
import { Layout } from "../components/Layout/Layout";
import { NewWorkspace } from "../components/NewWorkspace/NewWorkspace";

export const NewWorkspacePage = () => {
  const location = useLocation();
  const isSSHMode = new URLSearchParams(location.search).get("mode") === "ssh";

  return (
    <Layout>
      <NewWorkspace isSSH={isSSHMode} />
    </Layout>
  );
};
