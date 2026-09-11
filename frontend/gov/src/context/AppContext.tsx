"use client";

import React, { createContext, useContext, useState } from "react";
import { evaluatorQueueItems } from "@/data/mockData";

export type PersonaType = "DEPT_NASHIK" | "DEPT_PUNE" | "STARTUP" | "EVALUATOR" | "MSINS_ADMIN";

export interface EvaluatorClaimItem {
  id: string;
  pilotId: string;
  kpi: string;
  claimedValue: string;
  sourceDocument: string;
  sourceExcerpt: string;
  extractionConfidence: number;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
}

interface AppContextType {
  activePersona: PersonaType;
  currentRole: PersonaType;
  setActivePersona: (p: PersonaType) => void;
  evaluatorClaims: EvaluatorClaimItem[];
  verifyClaim: (id: string, verifierName?: string) => void;
  rejectClaim: (id: string) => void;
  adaptedPilotCreated: boolean;
  createAdaptedPilot: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<PersonaType>("DEPT_NASHIK");
  const [evaluatorClaims, setEvaluatorClaims] = useState<EvaluatorClaimItem[]>(evaluatorQueueItems);
  const [adaptedPilotCreated, setAdaptedPilotCreated] = useState<boolean>(false);

  const verifyClaim = (id: string, verifierName: string = "Dr. Vidya Joshi (COEP)") => {
    setEvaluatorClaims((prev) =>
      prev.map((claim) =>
        claim.id === id
          ? {
              ...claim,
              status: "VERIFIED",
              verifiedBy: verifierName,
              verifiedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            }
          : claim
      )
    );
  };

  const rejectClaim = (id: string) => {
    setEvaluatorClaims((prev) =>
      prev.map((claim) =>
        claim.id === id
          ? {
              ...claim,
              status: "FLAGGED_FOR_CLARIFICATION",
              verifiedBy: null,
              verifiedAt: null,
            }
          : claim
      )
    );
  };

  const createAdaptedPilot = () => {
    setAdaptedPilotCreated(true);
  };

  return (
    <AppContext.Provider
      value={{
        activePersona,
        currentRole: activePersona,
        setActivePersona,
        evaluatorClaims,
        verifyClaim,
        rejectClaim,
        adaptedPilotCreated,
        createAdaptedPilot,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
