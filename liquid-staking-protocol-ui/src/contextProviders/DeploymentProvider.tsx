import { createContext, useContext, type PropsWithChildren } from "react";

const DeploymentContext = createContext<null>(null);

const DeploymentContextProvider = ({ children }: PropsWithChildren) => {
  

    
  
    return (
    <DeploymentContext.Provider value={}>
      {children}{" "}
    </DeploymentContext.Provider>
  );
};

export default DeploymentContextProvider;
